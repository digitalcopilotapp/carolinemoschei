const { Router } = require("express");
const pool = require("../db/pool");
const { getSmtpHealth, getActiveProvider } = require("../services/email");
const { getAgentStatus } = require("../services/chatwootAgent");

const router = Router();
const startTime = Date.now();

router.get("/health", async (req, res) => {
  let dbStatus = "connected";
  try {
    await pool.query("SELECT 1");
  } catch {
    dbStatus = "disconnected";
  }

  const status = dbStatus === "connected" ? "ok" : "error";
  const code = status === "ok" ? 200 : 503;

  res.status(code).json({
    status,
    db: dbStatus,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

/** Detailed health check including SMTP providers */
router.get("/health/detailed", async (req, res) => {
  let dbStatus = "connected";
  try {
    await pool.query("SELECT 1");
  } catch {
    dbStatus = "disconnected";
  }

  const smtp = await getSmtpHealth();
  const activeSmtp = await getActiveProvider();

  // Check pending retries and scheduled messages
  let pendingRetries = 0;
  let pendingMessages = 0;
  try {
    const retryResult = await pool.query(
      "SELECT COUNT(*) FROM retry_queue WHERE attempts < max_attempts"
    );
    pendingRetries = parseInt(retryResult.rows[0].count, 10);

    const msgResult = await pool.query(
      "SELECT COUNT(*) FROM scheduled_messages WHERE sent = FALSE AND canceled = FALSE"
    );
    pendingMessages = parseInt(msgResult.rows[0].count, 10);
  } catch {
    // Tables may not exist yet
  }

  // Agent metrics
  const agentStatus = getAgentStatus();
  let pendingAttributions = 0;
  try {
    const attrResult = await pool.query(
      "SELECT COUNT(*) FROM conversion_attributions WHERE meta_event_sent = FALSE"
    );
    pendingAttributions = Number.parseInt(attrResult.rows[0].count, 10);
  } catch {
    // Table may not exist yet
  }

  res.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    db: dbStatus,
    smtp: {
      active_provider: activeSmtp,
      providers: smtp,
    },
    queues: {
      pending_retries: pendingRetries,
      pending_scheduled_messages: pendingMessages,
    },
    agent: {
      ...agentStatus,
      pending_attributions: pendingAttributions,
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
