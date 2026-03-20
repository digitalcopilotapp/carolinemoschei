const pool = require("../db/pool");
const logger = require("../utils/logger");
const { WHATSAPP_TEMPLATES } = require("./templates");

/** @type {Map<string, object>} slug → tenant config */
const tenantsBySlug = new Map();

/** @type {Map<string, object>} id → tenant config */
const tenantsById = new Map();

/**
 * Load all active tenants from the database into memory.
 * Called on startup and when admin triggers a reload.
 */
async function loadTenants() {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM tenants WHERE active = TRUE"
    );

    tenantsBySlug.clear();
    tenantsById.clear();

    for (const row of rows) {
      const tenant = {
        ...row,
        // Merge per-tenant WhatsApp templates over global defaults
        resolvedTemplates: {
          ...WHATSAPP_TEMPLATES,
          ...(row.whatsapp_templates || {}),
        },
        // Parse listmonk_list_ids
        listmonkLists: row.listmonk_list_ids || {},
        // Parse agent configuration
        conversionRules: row.conversion_rules || {},
        agentIntervalMinutes: row.agent_interval_minutes || 5,
      };
      tenantsBySlug.set(row.slug, tenant);
      tenantsById.set(row.id, tenant);
    }

    logger.info("Tenants loaded", { count: rows.length });
    return rows.length;
  } catch (err) {
    logger.error("Failed to load tenants", { error: err.message });
    return 0;
  }
}

/**
 * Get a tenant by its URL slug.
 * @param {string} slug - e.g. "caroline", "clientx"
 * @returns {object|null}
 */
function getTenantBySlug(slug) {
  return tenantsBySlug.get(slug) || null;
}

/**
 * Get a tenant by its UUID.
 * @param {string} id
 * @returns {object|null}
 */
function getTenantById(id) {
  return tenantsById.get(id) || null;
}

/**
 * Get all loaded tenants.
 * @returns {object[]}
 */
function getAllTenants() {
  return Array.from(tenantsBySlug.values());
}

module.exports = {
  loadTenants,
  getTenantBySlug,
  getTenantById,
  getAllTenants,
};
