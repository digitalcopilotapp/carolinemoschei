const pool = require("../db/pool");
const { sha256 } = require("../utils/hash");
const logger = require("../utils/logger");
const { addToRetryQueue } = require("./retryQueue");

const META_API_VERSION = "v21.0";

/**
 * Build the full user_data object with ALL available parameters.
 * Hashes PII fields with SHA256 per Meta specs.
 * Maximizes EMQ by sending every data point available.
 */
function buildUserData(lead, extraData = {}) {
  const userData = {};

  // --- PII fields (SHA256 hashed) ---
  if (lead.email) userData.em = [sha256(lead.email)];
  if (lead.phone) userData.ph = [sha256(lead.phone.replace(/\D/g, ""))];
  if (lead.first_name) userData.fn = [sha256(lead.first_name.toLowerCase())];
  if (lead.last_name) userData.ln = [sha256(lead.last_name.toLowerCase())];
  if (lead.country) userData.country = [sha256(lead.country.toLowerCase())];

  // Gender: m or f
  if (extraData.gender) {
    const g = extraData.gender.toLowerCase().charAt(0);
    if (g === "m" || g === "f") userData.ge = [sha256(g)];
  }

  // Date of birth: YYYYMMDD
  if (extraData.birthdate) {
    const db = extraData.birthdate.replace(/\D/g, "");
    if (db.length === 8) userData.db = [sha256(db)];
  }

  // City: lowercase, no punctuation, no spaces
  if (extraData.city) {
    const ct = extraData.city
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "");
    userData.ct = [sha256(ct)];
  }

  // State: 2-char lowercase
  if (extraData.state) {
    const st = extraData.state.toLowerCase().substring(0, 2);
    userData.st = [sha256(st)];
  }

  // Zip/CEP: digits only
  if (extraData.zipcode) {
    const zp = extraData.zipcode.replace(/\D/g, "");
    if (zp) userData.zp = [sha256(zp)];
  }

  // --- Identifier fields (NOT hashed) ---

  // external_id: your internal lead ID (hash recommended by Meta)
  if (lead.id) userData.external_id = [sha256(lead.id)];

  // subscription_id: for recurring purchases
  if (extraData.subscriptionId) {
    userData.subscription_id = extraData.subscriptionId;
  }

  // ctwa_clid: Click-to-WhatsApp click ID
  if (extraData.ctwaClid) {
    userData.ctwa_clid = extraData.ctwaClid;
  }

  // fbc and fbp: only available from browser (pre-checkout events via sGTM)
  // For Hotmart webhooks, these are NOT available — Meta matches via email/phone
  if (extraData.fbc) userData.fbc = extraData.fbc;
  if (extraData.fbp) userData.fbp = extraData.fbp;

  // client_ip_address and client_user_agent: from browser requests only
  if (extraData.clientIp) userData.client_ip_address = extraData.clientIp;
  if (extraData.clientUserAgent) userData.client_user_agent = extraData.clientUserAgent;

  return userData;
}

/**
 * Build the full custom_data object with ALL relevant parameters.
 */
function buildCustomData(eventName, conversion, extraData = {}) {
  const customData = {};

  // Value and currency (required for Purchase, recommended for others)
  if (conversion.amount) customData.value = parseFloat(conversion.amount);
  customData.currency = conversion.currency || "BRL";

  // Product info
  if (conversion.product) {
    customData.content_name = conversion.product;
    customData.content_ids = [extraData.productId || conversion.product];
    customData.content_type = "product";
  }

  // Detailed contents array
  if (conversion.product) {
    customData.contents = [
      {
        id: extraData.productId || conversion.product,
        quantity: 1,
        item_price: parseFloat(conversion.amount) || 0,
        title: conversion.product,
        delivery_category: "digital",
      },
    ];
  }

  customData.num_items = extraData.numItems || 1;

  // Order ID (hotmart_tx_id)
  if (conversion.hotmart_tx_id) {
    customData.order_id = conversion.hotmart_tx_id;
  }

  // Payment method as status
  if (conversion.payment_method) {
    customData.status = "completed";
  }

  // Predicted LTV (if available from your analytics)
  if (extraData.predictedLtv) {
    customData.predicted_ltv = parseFloat(extraData.predictedLtv);
  }

  return customData;
}

/**
 * Send an event to Meta Conversions API.
 * Supports: Purchase, Subscribe, Contact, Lead, CompleteRegistration
 */
async function sendEvent(eventName, lead, eventData = {}, tenant = null) {
  const pixelId = tenant?.meta_pixel_id || process.env.META_PIXEL_ID;
  const accessToken = tenant?.meta_access_token || process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    logger.warn("Meta CAPI not configured, skipping", {
      event_name: eventName,
      tenant: tenant?.slug,
    });
    return null;
  }

  const eventId = eventData.eventId || `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const payload = {
    event_name: eventName,
    event_time: eventData.eventTime || Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: eventData.actionSource || "website",
    user_data: buildUserData(lead, eventData),
    custom_data: eventData.customData || {},
  };

  // event_source_url (required for web action_source)
  if (eventData.sourceUrl) {
    payload.event_source_url = eventData.sourceUrl;
  }

  // Data processing options (LGPD compliance)
  if (process.env.META_DATA_PROCESSING_OPTIONS) {
    payload.data_processing_options = ["LDU"];
    payload.data_processing_options_country = 0;
    payload.data_processing_options_state = 0;
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [payload],
        access_token: accessToken,
      }),
    });

    const body = await res.text();

    // Log to meta_events table
    await pool.query(
      `INSERT INTO meta_events (conversion_id, event_name, event_id, response_code, response_body)
       VALUES ($1, $2, $3, $4, $5)`,
      [eventData.conversionId || null, eventName, eventId, res.status, body]
    );

    if (res.ok) {
      logger.info("Meta CAPI event sent", {
        event_name: eventName,
        event_id: eventId,
        response_code: res.status,
      });
      return { success: true, eventId, responseCode: res.status };
    }

    logger.error("Meta CAPI rejected event", {
      event_name: eventName,
      event_id: eventId,
      response_code: res.status,
      response_body: body,
    });

    await addToRetryQueue("meta_capi", {
      event_name: eventName,
      lead_id: lead.id,
      event_data: eventData,
      tenant_id: tenant?.id,
    });

    return { success: false, eventId, responseCode: res.status };
  } catch (err) {
    logger.error("Meta CAPI request failed", {
      event_name: eventName,
      event_id: eventId,
      error: err.message,
    });

    await addToRetryQueue("meta_capi", {
      event_name: eventName,
      lead_id: lead.id,
      event_data: eventData,
      tenant_id: tenant?.id,
    });

    return { success: false, eventId, error: err.message };
  }
}

// =========================================================================
// Convenience functions for each event type
// =========================================================================

/**
 * Purchase — compra aprovada na Hotmart
 */
async function sendPurchase(lead, conversion, extraData = {}, tenant = null) {
  const result = await sendEvent("Purchase", lead, {
    eventId: conversion.event_id,
    eventTime: Math.floor(new Date(conversion.created_at).getTime() / 1000),
    conversionId: conversion.id,
    customData: buildCustomData("Purchase", conversion, extraData),
    ...extraData,
  }, tenant);

  if (result?.success) {
    await pool.query(
      "UPDATE conversions SET sent_to_meta = TRUE WHERE id = $1",
      [conversion.id]
    );
  }

  return result;
}

/**
 * Subscribe — assinatura recorrente criada na Hotmart
 */
async function sendSubscribe(lead, subscriptionData, extraData = {}, tenant = null) {
  return sendEvent("Subscribe", lead, {
    eventId: `sub_${subscriptionData.hotmart_subscription_id || Date.now()}`,
    customData: {
      value: parseFloat(subscriptionData.amount) || 0,
      currency: subscriptionData.currency || "BRL",
      content_name: subscriptionData.plan || "Assinatura",
      content_type: "product",
      predicted_ltv: subscriptionData.predictedLtv || undefined,
      order_id: subscriptionData.hotmart_subscription_id || undefined,
    },
    ...extraData,
  }, tenant);
}

/**
 * Contact — novo contato via WhatsApp/Chatwoot
 */
async function sendContact(lead, extraData = {}, tenant = null) {
  return sendEvent("Contact", lead, {
    actionSource: extraData.actionSource || "business_messaging",
    customData: {
      content_name: extraData.channel || "whatsapp",
    },
    ...extraData,
  }, tenant);
}

/**
 * Lead — captura de lead server-side (ex: via Hotmart cart_abandonment com email)
 */
async function sendLead(lead, extraData = {}, tenant = null) {
  return sendEvent("Lead", lead, {
    customData: {
      content_name: extraData.source || "hotmart",
      value: extraData.value || 0,
      currency: extraData.currency || "BRL",
    },
    ...extraData,
  }, tenant);
}

/**
 * CompleteRegistration — registro/cadastro completado
 */
async function sendCompleteRegistration(lead, extraData = {}, tenant = null) {
  return sendEvent("CompleteRegistration", lead, {
    customData: {
      content_name: extraData.source || "registration",
      status: "completed",
      value: extraData.value || 0,
      currency: extraData.currency || "BRL",
    },
    ...extraData,
  }, tenant);
}

// Legacy export for backward compatibility
async function sendToMetaCAPI(lead, conversion) {
  return sendPurchase(lead, conversion);
}

module.exports = {
  sendEvent,
  sendPurchase,
  sendSubscribe,
  sendContact,
  sendLead,
  sendCompleteRegistration,
  sendToMetaCAPI,
  buildUserData,
  buildCustomData,
};
