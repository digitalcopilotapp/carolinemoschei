const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

async function runMigrations(connectionString) {
  const pool = new Pool({
    connectionString: connectionString || process.env.DATABASE_URL,
  });

  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir).sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const file of files) {
    if (!file.endsWith(".sql")) continue;

    const { rows } = await pool.query(
      "SELECT 1 FROM _migrations WHERE filename = $1",
      [file]
    );

    if (rows.length > 0) {
      console.log(`⏭  Already applied: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO _migrations (filename) VALUES ($1)", [
        file,
      ]);
      await pool.query("COMMIT");
      console.log(`✓  Applied: ${file}`);
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(`✗  Failed: ${file}`, err.message);
      throw err;
    }
  }

  await pool.end();
  console.log("✓  All migrations complete");
}

// Run directly if called as script
if (require.main === module) {
  runMigrations().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
  });
}

module.exports = { runMigrations };
