const crypto = require("node:crypto");
const { Router } = require("express");
const { routeEvent } = require("../services/eventRouter");
const { getTenantBySlug } = require("../config/tenantStore");
const logger = require("../utils/logger");

const router = Router();

const SUPPORTED_EVENTS = [
  "PURCHASE_APPROVED",
  "PURCHASE_COMPLETE",
  "PURCHASE_REFUNDED",
  "PURCHASE_CANCELED",
  "PURCHASE_CHARGEBACK",
  "CART_ABANDONMENT",
  "SUBSCRIPTION_PURCHASE",
  "SUBSCRIPTION_CANCELLATION",
  "SUBSCRIPTION_REACTIVATION",
];

/**
 * Validate Hotmart HMAC-SHA256 signature against tenant-specific secret.
 */
function validateSignature(rawBody, signature, secret) {
  if (!secret) return true;

  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Shared handler for both multi-tenant and legacy routes.
 */
function handleHotmartWebhook(req, res, tenant) {
  // Signature validation using tenant-specific secret
  const signature =
    req.headers["x-hotmart-hottok"] ||
    req.headers["x-hotmart-signature"] ||
    req.headers["hottok"];

  if (!signature && tenant.hotmart_webhook_secret) {
    logger.warn("Missing webhook signature header", { tenant: tenant.slug });
    return res.status(400).json({ error: "Missing signature" });
  }

  if (signature && !validateSignature(req.rawBody, signature, tenant.hotmart_webhook_secret)) {
    logger.warn("Invalid webhook signature", { tenant: tenant.slug });
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Extract event type
  const eventType =
    req.body.event || req.body.data?.event || req.body.webhook_event;

  if (!eventType) {
    return res.status(400).json({ error: "Missing event type" });
  }

  // Optionally filter by product ID if tenant has product whitelist
  if (tenant.hotmart_product_ids && tenant.hotmart_product_ids.length > 0) {
    const productId =
      req.body.data?.product?.id?.toString() ||
      req.body.product?.id?.toString() ||
      req.body.product_id?.toString();

    if (productId && !tenant.hotmart_product_ids.includes(productId)) {
      logger.info("Product ID not in tenant whitelist, ignoring", {
        tenant: tenant.slug,
        product_id: productId,
      });
      return res.status(200).json({ received: true, filtered: true });
    }
  }

  // Return 200 immediately, process async
  res.status(200).json({ received: true });

  if (!SUPPORTED_EVENTS.includes(eventType)) {
    logger.info("Unsupported event type, ignoring", {
      tenant: tenant.slug,
      event_type: eventType,
    });
    return;
  }

  logger.info("Webhook received", {
    tenant: tenant.slug,
    event_type: eventType,
    email: logger.maskEmail(
      req.body.data?.buyer?.email || req.body.buyer?.email || req.body.email
    ),
  });

  // Process asynchronously with tenant context
  routeEvent(eventType, req.body, tenant).catch((err) => {
    logger.error("Event routing failed", {
      tenant: tenant.slug,
      event_type: eventType,
      error: err.message,
    });
  });
}

/**
 * Multi-tenant route: POST /hotmart/:tenantSlug
 * Each client gets their own webhook URL.
 */
router.post("/hotmart/:tenantSlug", (req, res) => {
  const tenant = getTenantBySlug(req.params.tenantSlug);
  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found" });
  }
  if (!tenant.active) {
    return res.status(403).json({ error: "Tenant is inactive" });
  }
  handleHotmartWebhook(req, res, tenant);
});

/**
 * Legacy route: POST /hotmart (uses "default" tenant for backward compatibility)
 */
router.post("/hotmart", (req, res) => {
  const tenant = getTenantBySlug("default");
  if (!tenant) {
    // Fallback to env-based config if no default tenant exists
    const fallbackTenant = {
      id: null,
      slug: "default",
      name: "Default",
      active: true,
      hotmart_webhook_secret: process.env.HOTMART_WEBHOOK_SECRET,
      meta_pixel_id: process.env.META_PIXEL_ID,
      meta_access_token: process.env.META_ACCESS_TOKEN,
      chatwoot_account_id: parseInt(process.env.CHATWOOT_ACCOUNT_ID || "1", 10),
      chatwoot_api_token: process.env.CHATWOOT_API_TOKEN,
      chatwoot_whatsapp_inbox_id: parseInt(process.env.CHATWOOT_WHATSAPP_INBOX_ID || "1", 10),
      listmonkLists: { posvenda: parseInt(process.env.LISTMONK_POSVENDA_LIST_ID || "2", 10) },
      resolvedTemplates: require("../config/templates").WHATSAPP_TEMPLATES,
    };
    return handleHotmartWebhook(req, res, fallbackTenant);
  }
  handleHotmartWebhook(req, res, tenant);
});

module.exports = router;
