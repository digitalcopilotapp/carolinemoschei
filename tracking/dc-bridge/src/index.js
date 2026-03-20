const express = require("express");
const logger = require("./utils/logger");
const healthRouter = require("./routes/health");
const hotmartRouter = require("./routes/hotmart");
const adminRouter = require("./routes/admin");
const trackingRouter = require("./routes/tracking");
const { processDueMessages } = require("./services/scheduler");
const { processRetryQueue } = require("./services/retryQueue");
const { runAgentForAllTenants } = require("./services/chatwootAgent");
const { loadTenants, getTenantById } = require("./config/tenantStore");

// Retry handlers — resolve tenant from payload for each retry
function getRetryHandlers() {
  const { sendPurchase } = require("./services/metaCapi");
  const { syncToChatwoot, sendWhatsAppTemplate } = require("./services/chatwoot");
  const { addSubscriber, removeSubscriber } = require("./services/listmonk");
  const pool = require("./db/pool");

  return {
    meta_capi: async (payload) => {
      const tenant = payload.tenant_id ? getTenantById(payload.tenant_id) : null;
      const { rows: leads } = await pool.query(
        "SELECT * FROM leads WHERE id = $1",
        [payload.lead_id]
      );
      const { rows: conversions } = await pool.query(
        "SELECT * FROM conversions WHERE id = $1",
        [payload.conversion_id]
      );
      if (leads[0] && conversions[0]) {
        await sendPurchase(leads[0], conversions[0], {}, tenant);
      }
    },
    chatwoot: async (payload) => {
      const tenant = payload.tenant_id ? getTenantById(payload.tenant_id) : null;
      const { rows: leads } = await pool.query(
        "SELECT * FROM leads WHERE id = $1",
        [payload.lead_id]
      );
      if (leads[0]) {
        await syncToChatwoot(leads[0], payload.event_type, payload.metadata, tenant);
      }
    },
    whatsapp: async (payload) => {
      const tenant = payload.tenant_id ? getTenantById(payload.tenant_id) : null;
      await sendWhatsAppTemplate(
        payload.chatwoot_contact_id,
        payload.template_name,
        payload.template_params,
        tenant
      );
    },
    listmonk: async (payload) => {
      const tenant = payload.tenant_id ? getTenantById(payload.tenant_id) : null;
      const { rows: leads } = await pool.query(
        "SELECT * FROM leads WHERE id = $1",
        [payload.lead_id]
      );
      if (!leads[0]) return;
      if (payload.action === "remove") {
        await removeSubscriber(leads[0], tenant);
      } else {
        await addSubscriber(leads[0], payload.metadata || {}, tenant);
      }
    },
  };
}

const app = express();

// Raw body capture for HMAC validation
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Routes
app.use(healthRouter);
app.use(hotmartRouter);
app.use(adminRouter);
app.use(trackingRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 3100;
app.listen(PORT, async () => {
  logger.info("dc-bridge started", { port: PORT });

  // Run migrations on startup
  const { runMigrations } = require("./db/migrate");
  try {
    await runMigrations();
  } catch (err) {
    logger.error("Migration failed on startup", { error: err.message });
  }

  // Load tenant configs into memory
  await loadTenants();

  // Cron: Process scheduled messages every 60 seconds
  setInterval(async () => {
    try {
      await processDueMessages();
    } catch (err) {
      logger.error("Scheduled message processor error", {
        error: err.message,
      });
    }
  }, 60_000);

  // Cron: Process retry queue every 60 seconds
  setInterval(async () => {
    try {
      await processRetryQueue(getRetryHandlers());
    } catch (err) {
      logger.error("Retry queue processor error", { error: err.message });
    }
  }, 60_000);

  // Cron: Chatwoot conversion analysis agent every 5 minutes
  setInterval(async () => {
    try {
      await runAgentForAllTenants();
    } catch (err) {
      logger.error("Chatwoot agent error", { error: err.message });
    }
  }, 300_000);
});
