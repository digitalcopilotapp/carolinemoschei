const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error(
    JSON.stringify({
      level: "error",
      message: "Unexpected PostgreSQL pool error",
      error: err.message,
      timestamp: new Date().toISOString(),
    })
  );
});

module.exports = pool;
