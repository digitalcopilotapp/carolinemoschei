const { Router } = require("express");
const pool = require("../db/pool");
const { loadTenants, getAllTenants } = require("../config/tenantStore");
const { triggerAgentForTenant, getAgentStatus } = require("../services/chatwootAgent");
const logger = require("../utils/logger");

const router = Router();

/**
 * Admin auth middleware — validates TENANT_ADMIN_SECRET header.
 */
function adminAuth(req, res, next) {
  const secret = process.env.TENANT_ADMIN_SECRET;
  if (!secret) {
    return res.status(503).json({ error: "Admin API not configured" });
  }
  const provided = req.headers["x-admin-secret"];
  if (provided !== secret) {
    return res.status(401).json({ error: "Invalid admin secret" });
  }
  next();
}

router.use("/admin", adminAuth);

/** List all tenants */
router.get("/admin/tenants", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT id, slug, name, active, email_domain, meta_pixel_id, agent_enabled, created_at FROM tenants ORDER BY created_at"
  );
  res.json({ tenants: rows });
});

/** Create a new tenant */
router.post("/admin/tenants", async (req, res) => {
  const {
    slug, name, hotmart_webhook_secret, hotmart_product_ids,
    meta_pixel_id, meta_access_token,
    chatwoot_account_id, chatwoot_api_token, chatwoot_whatsapp_inbox_id,
    listmonk_list_ids, whatsapp_templates,
    email_domain, sender_email, stape_custom_domain, gtm_container_id,
    conversion_rules, agent_enabled, agent_interval_minutes,
  } = req.body;

  if (!slug) return res.status(400).json({ error: "slug is required" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO tenants (
        slug, name, hotmart_webhook_secret, hotmart_product_ids,
        meta_pixel_id, meta_access_token,
        chatwoot_account_id, chatwoot_api_token, chatwoot_whatsapp_inbox_id,
        listmonk_list_ids, whatsapp_templates,
        email_domain, sender_email, stape_custom_domain, gtm_container_id,
        conversion_rules, agent_enabled, agent_interval_minutes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING id, slug, name`,
      [
        slug, name, hotmart_webhook_secret, hotmart_product_ids || null,
        meta_pixel_id, meta_access_token,
        chatwoot_account_id, chatwoot_api_token, chatwoot_whatsapp_inbox_id,
        JSON.stringify(listmonk_list_ids || {}), JSON.stringify(whatsapp_templates || null),
        email_domain, sender_email, stape_custom_domain, gtm_container_id,
        JSON.stringify(conversion_rules || {}), agent_enabled || false, agent_interval_minutes || 5,
      ]
    );

    await loadTenants();
    logger.info("Tenant created", { slug });
    res.status(201).json({ tenant: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Tenant slug already exists" });
    }
    logger.error("Failed to create tenant", { error: err.message });
    res.status(500).json({ error: "Failed to create tenant" });
  }
});

/** Update a tenant */
router.patch("/admin/tenants/:slug", async (req, res) => {
  const { slug } = req.params;
  const fields = req.body;

  const allowed = [
    "name", "active", "hotmart_webhook_secret", "hotmart_product_ids",
    "meta_pixel_id", "meta_access_token",
    "chatwoot_account_id", "chatwoot_api_token", "chatwoot_whatsapp_inbox_id",
    "listmonk_list_ids", "whatsapp_templates",
    "email_domain", "sender_email", "stape_custom_domain", "gtm_container_id",
    "conversion_rules", "agent_enabled", "agent_interval_minutes",
  ];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      const val = (key === "listmonk_list_ids" || key === "whatsapp_templates" || key === "conversion_rules")
        ? JSON.stringify(fields[key])
        : fields[key];
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(val);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(slug);

  const { rowCount } = await pool.query(
    `UPDATE tenants SET ${setClauses.join(", ")} WHERE slug = $${paramIndex}`,
    values
  );

  if (rowCount === 0) return res.status(404).json({ error: "Tenant not found" });

  await loadTenants();
  logger.info("Tenant updated", { slug });
  res.json({ success: true });
});

/** Soft-delete a tenant */
router.delete("/admin/tenants/:slug", async (req, res) => {
  const { rowCount } = await pool.query(
    "UPDATE tenants SET active = FALSE, updated_at = NOW() WHERE slug = $1",
    [req.params.slug]
  );
  if (rowCount === 0) return res.status(404).json({ error: "Tenant not found" });

  await loadTenants();
  logger.info("Tenant deactivated", { slug: req.params.slug });
  res.json({ success: true });
});

/** Reload tenant cache */
router.post("/admin/tenants/reload", async (_req, res) => {
  const count = await loadTenants();
  res.json({ reloaded: count });
});

/** Trigger the chatwoot agent for a specific tenant */
router.post("/admin/agent/trigger/:slug", async (req, res) => {
  try {
    const result = await triggerAgentForTenant(req.params.slug);
    res.json({ success: true, result });
  } catch (err) {
    logger.error("Agent trigger failed", { slug: req.params.slug, error: err.message });
    res.status(err.message.includes("not found") ? 404 : 500).json({ error: err.message });
  }
});

/** Get agent status */
router.get("/admin/agent/status", async (_req, res) => {
  const status = getAgentStatus();

  // Also fetch cursor data for all enabled tenants
  try {
    const { rows: cursors } = await pool.query(
      `SELECT ac.*, t.slug AS tenant_slug
       FROM agent_cursors ac
       JOIN tenants t ON t.id = ac.tenant_id
       WHERE t.agent_enabled = TRUE
       ORDER BY ac.last_run_at DESC NULLS LAST`
    );
    status.cursors = cursors;
  } catch {
    status.cursors = [];
  }

  res.json(status);
});

module.exports = router;
