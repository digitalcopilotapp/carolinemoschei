const pool = require("../db/pool");
const { normalizeEmail, normalizePhone, splitName } = require("../utils/normalize");
const logger = require("../utils/logger");

/**
 * Upsert a lead from Hotmart buyer data.
 * Creates a new lead or updates an existing one (matched by tenant_id + email).
 * Returns the lead record.
 */
async function upsertLead(buyerData, source, tenant) {
  const email = normalizeEmail(buyerData.email);
  if (!email) throw new Error("Lead email is required");

  const phone = normalizePhone(buyerData.phone || buyerData.checkout_phone);
  const fullName = buyerData.name || "";
  const { firstName, lastName } = splitName(fullName);
  const country = buyerData.country || null;
  const tenantId = tenant?.id || null;

  const { rows } = await pool.query(
    `INSERT INTO leads (tenant_id, email, phone, name, first_name, last_name, source, country)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (tenant_id, email) DO UPDATE SET
       phone = COALESCE(EXCLUDED.phone, leads.phone),
       name = COALESCE(EXCLUDED.name, leads.name),
       first_name = COALESCE(EXCLUDED.first_name, leads.first_name),
       last_name = COALESCE(EXCLUDED.last_name, leads.last_name),
       country = COALESCE(EXCLUDED.country, leads.country),
       updated_at = NOW()
     RETURNING *`,
    [tenantId, email, phone, fullName || null, firstName, lastName, source, country]
  );

  const lead = rows[0];
  logger.info("Lead upserted", {
    tenant: tenant?.slug,
    lead_id: lead.id,
    email: logger.maskEmail(email),
    source,
  });
  return lead;
}

module.exports = { upsertLead };
