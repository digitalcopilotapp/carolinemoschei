const axios = require("axios");
const crypto = require("crypto");
const logger = require("../utils/logger");

const META_API_URL = "https://graph.facebook.com/v19.0";
const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

function hashData(value) {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.toString().toLowerCase().trim()).digest("hex");
}

function formatPhone(phone) {
  if (!phone) return undefined;
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 || cleaned.length === 11) cleaned = "55" + cleaned;
  return cleaned;
}

function extractPrice(price) {
  if (!price) return 0;
  if (typeof price === "number") return price;
  if (typeof price === "string") return parseFloat(price) || 0;
  if (typeof price === "object" && price.value !== undefined) return parseFloat(price.value) || 0;
  return 0;
}

async function sendEvent(eventName, eventData) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    logger.warn("Meta: PIXEL_ID ou ACCESS_TOKEN nao configurados.");
    return null;
  }

  const { email, phone, firstName, lastName, city, state, country, zipCode,
          value, currency, contentName, contentIds, contentType,
          eventSourceUrl, externalId, clientIpAddress, clientUserAgent,
          tracking } = eventData;

  const userData = {};
  if (email) userData.em = [hashData(email)];
  if (phone) userData.ph = [hashData(formatPhone(phone))];
  if (firstName) userData.fn = [hashData(firstName)];
  if (lastName) userData.ln = [hashData(lastName)];
  if (city) userData.ct = [hashData(city)];
  if (state) userData.st = [hashData(state)];
  if (country) userData.country = [hashData(country || "br")];
  if (zipCode) userData.zp = [hashData(zipCode)];
  if (externalId) userData.external_id = [hashData(externalId)];
  if (clientIpAddress) userData.client_ip_address = clientIpAddress;
  if (clientUserAgent) userData.client_user_agent = clientUserAgent;

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: "hotmart_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    action_source: "website",
    event_source_url: eventSourceUrl || "https://carolinemoschei.site",
    user_data: userData,
  };

  const numericValue = extractPrice(value);

  // Custom data com UTMs/SRC/SCK para o Utmify capturar
  event.custom_data = {};
  if (numericValue > 0) {
    event.custom_data.value = numericValue;
    event.custom_data.currency = currency || "BRL";
  }
  if (contentName) event.custom_data.content_name = contentName;
  if (contentIds) event.custom_data.content_ids = Array.isArray(contentIds) ? contentIds : [String(contentIds)];
  if (contentType) event.custom_data.content_type = contentType || "product";

  // UTMs e tracking no custom_data
  if (tracking) {
    if (tracking.src) event.custom_data.src = tracking.src;
    if (tracking.sck) event.custom_data.sck = tracking.sck;
    if (tracking.utm_source) event.custom_data.utm_source = tracking.utm_source;
    if (tracking.utm_medium) event.custom_data.utm_medium = tracking.utm_medium;
    if (tracking.utm_campaign) event.custom_data.utm_campaign = tracking.utm_campaign;
    if (tracking.utm_content) event.custom_data.utm_content = tracking.utm_content;
    if (tracking.utm_term) event.custom_data.utm_term = tracking.utm_term;
  }

  // Limpar custom_data vazio
  if (Object.keys(event.custom_data).length === 0) delete event.custom_data;

  const payload = { data: [event], access_token: ACCESS_TOKEN };
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

  try {
    const response = await axios.post(META_API_URL + "/" + PIXEL_ID + "/events", payload, { headers: { "Content-Type": "application/json" } });
    logger.info("Meta: Evento " + eventName + " enviado com sucesso", {
      eventId: event.event_id, email: email ? email.substring(0, 3) + "***" : "N/A",
      fbtrace_id: response.data?.fbtrace_id, events_received: response.data?.events_received,
      src: tracking?.src || "", sck: tracking?.sck || "",
    });
    return response.data;
  } catch (error) {
    const errData = error.response?.data?.error || {};
    logger.error("Meta: Erro ao enviar evento " + eventName + ": " + (errData.message || error.message), {
      status: error.response?.status, fbtrace_id: errData.fbtrace_id, error_subcode: errData.error_subcode,
    });
    throw error;
  }
}

async function sendPurchaseEvent(data) {
  const { buyer, product, purchase, tracking } = data;
  const price = extractPrice(purchase.price);
  return sendEvent("Purchase", {
    email: buyer.email, phone: buyer.phone, firstName: buyer.firstName, lastName: buyer.lastName,
    country: "br", value: price, currency: purchase.currency || "BRL",
    contentName: product.name, contentIds: [String(product.id)], contentType: "product",
    externalId: purchase.transaction, tracking,
  });
}

async function sendInitiateCheckoutEvent(data) {
  const { buyer, product, purchase, tracking } = data;
  const price = extractPrice(purchase.price);
  return sendEvent("InitiateCheckout", {
    email: buyer.email, phone: buyer.phone, firstName: buyer.firstName, lastName: buyer.lastName,
    country: "br", value: price, currency: purchase.currency || "BRL",
    contentName: product.name, contentIds: [String(product.id)], contentType: "product",
    externalId: purchase.transaction, tracking,
  });
}

async function sendViewContentEvent(data) {
  const { buyer, product, tracking } = data;
  return sendEvent("ViewContent", {
    email: buyer.email, phone: buyer.phone, firstName: buyer.firstName, lastName: buyer.lastName,
    country: "br", contentName: product.name, contentIds: [String(product.id)], contentType: "product",
    tracking,
  });
}

async function sendLeadEvent(data) {
  const { buyer, product, purchase, tracking } = data;
  const price = extractPrice(purchase.price);
  return sendEvent("Lead", {
    email: buyer.email, phone: buyer.phone, firstName: buyer.firstName, lastName: buyer.lastName,
    country: "br", value: price, currency: purchase.currency || "BRL",
    contentName: product.name, contentIds: [String(product.id)], contentType: "product",
    tracking,
  });
}

module.exports = { sendPurchaseEvent, sendInitiateCheckoutEvent, sendViewContentEvent, sendLeadEvent, sendEvent };
