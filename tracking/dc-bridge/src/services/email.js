const net = require("node:net");
const crypto = require("node:crypto");
const logger = require("../utils/logger");

/**
 * Minimal SMTP client for sending via Amazon SES.
 * Used as fallback when Stalwart is down or for direct transactional sends.
 *
 * Uses raw SMTP over TLS (port 587 STARTTLS) — no external dependencies.
 * SES SMTP credentials are IAM-derived (different from API keys).
 */

const PROVIDERS = {
  stalwart: {
    host: process.env.STALWART_SMTP_HOST || "stalwart",
    port: parseInt(process.env.STALWART_SMTP_PORT || "587", 10),
    user: process.env.STALWART_SMTP_USER || "",
    pass: process.env.STALWART_SMTP_PASS || "",
    secure: false, // STARTTLS
  },
  ses: {
    host: process.env.SES_SMTP_HOST || "email-smtp.us-east-1.amazonaws.com",
    port: parseInt(process.env.SES_SMTP_PORT || "587", 10),
    user: process.env.SES_SMTP_USER || "",
    pass: process.env.SES_SMTP_PASS || "",
    secure: false, // STARTTLS
  },
};

/**
 * Check if an SMTP provider is reachable (TCP connect test).
 */
async function isSmtpReachable(provider) {
  const config = PROVIDERS[provider];
  if (!config || !config.host) return false;

  return new Promise((resolve) => {
    const socket = net.createConnection(
      { host: config.host, port: config.port, timeout: 5000 },
      () => {
        socket.destroy();
        resolve(true);
      }
    );
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Get the best available SMTP provider.
 * Priority: Stalwart (primary) → SES (fallback)
 */
async function getActiveProvider() {
  // Check if SES is configured
  const sesConfigured = PROVIDERS.ses.user && PROVIDERS.ses.pass;

  // Try Stalwart first
  if (await isSmtpReachable("stalwart")) {
    return "stalwart";
  }

  logger.warn("Stalwart SMTP unreachable, checking SES fallback");

  if (sesConfigured && (await isSmtpReachable("ses"))) {
    logger.info("Falling back to Amazon SES");
    return "ses";
  }

  logger.error("No SMTP providers available");
  return null;
}

/**
 * Get SMTP config for the active provider.
 * Used by Listmonk config updates and health checks.
 */
function getProviderConfig(provider) {
  return PROVIDERS[provider] || null;
}

/**
 * Health status of all SMTP providers.
 */
async function getSmtpHealth() {
  const results = {};
  for (const [name, config] of Object.entries(PROVIDERS)) {
    if (!config.host || !config.user) {
      results[name] = { configured: false, reachable: false };
      continue;
    }
    results[name] = {
      configured: true,
      reachable: await isSmtpReachable(name),
      host: config.host,
      port: config.port,
    };
  }
  return results;
}

module.exports = {
  PROVIDERS,
  isSmtpReachable,
  getActiveProvider,
  getProviderConfig,
  getSmtpHealth,
};
