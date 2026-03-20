const axios = require("axios");
const logger = require("../utils/logger");

const BREVO_API_URL = "https://api.brevo.com/v3";
const API_KEY = process.env.BREVO_API_KEY;
const MASTER_LIST_ID = parseInt(process.env.BREVO_LIST_ALL) || 344;

const brevoApi = axios.create({
  baseURL: BREVO_API_URL,
  headers: { "api-key": API_KEY, "Content-Type": "application/json", Accept: "application/json" },
});

function formatPhone(phone) {
  if (!phone) return "";
  let c = phone.replace(/\D/g, "");
  if (!c || c.length < 8) return "";
  if (c.startsWith("00")) c = c.substring(2);
  if (c.length === 10 || c.length === 11) { const ddd = parseInt(c.substring(0, 2)); if (ddd >= 11 && ddd <= 99) c = "55" + c; }
  return "+" + c;
}

function categorizeProduct(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("preset") || n.includes("pack")) return "Presets e Packs";
  if (n.includes("combo")) return "Combos";
  if (n.includes("guia")) return "Guias";
  if (n.includes("curso") || n.includes("aula") || n.includes("masterclass") || n.includes("método") || n.includes("acelere") || n.includes("tratamento")) return "Cursos e Aulas";
  if (n.includes("workshop") || n.includes("presencial")) return "Workshop Presencial";
  if (n.includes("fotografia de celular") || n.includes("celular")) return "Fotografia Mobile";
  return "Outros";
}

function today() { return new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).split(" ")[0]; }

function trackingAttrs(tracking) {
  if (!tracking) return {};
  const a = {};
  if (tracking.utm_source) a.UTM_SOURCE = tracking.utm_source;
  if (tracking.utm_medium) a.UTM_MEDIUM = tracking.utm_medium;
  if (tracking.utm_campaign) a.UTM_CAMPAIGN = tracking.utm_campaign;
  if (tracking.utm_content) a.UTM_CONTENT = tracking.utm_content;
  if (tracking.utm_term) a.UTM_TERM = tracking.utm_term;
  if (tracking.src) a.CONTENT_SOURCE = tracking.src;
  return a;
}

async function upsertContact(email, attributes) {
  if (!email) { logger.warn("Brevo: Tentativa de upsert sem email"); return null; }
  const cleanEmail = email.toLowerCase().trim();
  const payload = { email: cleanEmail, attributes, listIds: [MASTER_LIST_ID], updateEnabled: true };
  try {
    await brevoApi.post("/contacts", payload);
    logger.info("Brevo: Contato salvo: " + cleanEmail, { status: attributes.HOTMART_STATUS, product: attributes.HOTMART_LAST_PRODUCT || attributes.HOTMART_INTEREST_PRODUCT || "" });
    return { success: true };
  } catch (error) {
    const msg = error.response?.data?.message || "";
    if (error.response?.status === 400 && msg.includes("already exist")) return updateContact(cleanEmail, attributes);
    if (error.response?.status === 400 && msg.includes("SMS is already associated")) {
      const phone = attributes.SMS; delete attributes.SMS; attributes.HOTMART_PHONE = phone;
      try { await brevoApi.post("/contacts", { ...payload, attributes }); return { success: true, smsSkipped: true }; }
      catch (e2) { if (e2.response?.status === 400 && (e2.response?.data?.message || "").includes("already exist")) return updateContact(cleanEmail, attributes); throw e2; }
    }
    logger.error("Brevo: Erro upsert " + cleanEmail + ": " + msg); throw error;
  }
}

async function updateContact(email, attributes) {
  const enc = encodeURIComponent(email);
  try {
    await brevoApi.put("/contacts/" + enc, { attributes });
    try { await brevoApi.post("/contacts/lists/" + MASTER_LIST_ID + "/contacts/add", { emails: [email] }); } catch (_) {}
    logger.info("Brevo: Contato atualizado: " + email);
    return { success: true, updated: true };
  } catch (error) {
    const msg = error.response?.data?.message || "";
    if (msg.includes("SMS is already associated")) {
      const phone = attributes.SMS; delete attributes.SMS; attributes.HOTMART_PHONE = phone;
      await brevoApi.put("/contacts/" + enc, { attributes });
      return { success: true, smsSkipped: true };
    }
    throw error;
  }
}

async function getContact(email) {
  try { const r = await brevoApi.get("/contacts/" + encodeURIComponent(email.toLowerCase().trim())); return r.data; }
  catch (e) { if (e.response?.status === 404) return null; throw e; }
}

async function handlePurchase(data) {
  const { buyer, product, purchase, tracking } = data;
  const category = categorizeProduct(product.name);
  let existingProducts = "", existingCategories = "", totalSpent = 0, totalPurchases = 0, firstDate = today();
  try {
    const existing = await getContact(buyer.email);
    if (existing?.attributes) {
      existingProducts = existing.attributes.HOTMART_PRODUCTS || "";
      existingCategories = existing.attributes.HOTMART_ALL_CATEGORIES || "";
      totalSpent = parseFloat(existing.attributes.HOTMART_TOTAL_SPENT) || 0;
      totalPurchases = parseInt(existing.attributes.HOTMART_TOTAL_PURCHASES) || 0;
      firstDate = existing.attributes.HOTMART_FIRST_PURCHASE_DATE || today();
    }
  } catch (_) {}
  const pList = existingProducts ? existingProducts.split(", ") : [];
  if (!pList.includes(product.name)) pList.push(product.name);
  const cList = existingCategories ? existingCategories.split(", ") : [];
  if (!cList.includes(category)) cList.push(category);
  const price = parseFloat(purchase.price) || 0;
  return upsertContact(buyer.email, {
    FIRSTNAME: buyer.firstName || "", LASTNAME: buyer.lastName || "", SMS: formatPhone(buyer.phone),
    HOTMART_STATUS: "COMPRADOR", HOTMART_PAYMENT_STATUS: "APROVADO",
    HOTMART_LAST_PRODUCT: product.name, HOTMART_LAST_PRODUCT_ID: String(product.id), HOTMART_PRODUCT_CATEGORY: category,
    HOTMART_PRODUCTS: pList.join(", "), HOTMART_ALL_CATEGORIES: cList.join(", "),
    HOTMART_TOTAL_PURCHASES: totalPurchases + 1, HOTMART_TOTAL_SPENT: totalSpent + price, HOTMART_FIRST_PURCHASE_DATE: firstDate,
    HOTMART_PURCHASE_DATE: today(), HOTMART_TRANSACTION: purchase.transaction, HOTMART_PRICE: price,
    HOTMART_CURRENCY: purchase.currency || "BRL", HOTMART_PAYMENT_METHOD: purchase.paymentMethod || "",
    HOTMART_OFFER_CODE: purchase.offerCode || "", HOTMART_INSTALLMENTS: purchase.installments || 1,
    HOTMART_IS_SUBSCRIPTION: purchase.is_subscription ? "SIM" : "NAO", HOTMART_RECURRENCE_NUMBER: purchase.recurrence_number || 0,
    HOTMART_LAST_EVENT: "PURCHASE_COMPLETE", HOTMART_LAST_EVENT_DATE: today(),
    ...trackingAttrs(tracking),
  });
}

async function handleAbandoned(data) {
  const { buyer, product, tracking } = data;
  return upsertContact(buyer.email, {
    FIRSTNAME: buyer.firstName || "", LASTNAME: buyer.lastName || "", SMS: formatPhone(buyer.phone),
    HOTMART_STATUS: "ABANDONOU_CHECKOUT", HOTMART_PAYMENT_STATUS: "NAO_COMPROU",
    HOTMART_INTEREST_PRODUCT: product.name, HOTMART_INTEREST_PRODUCT_ID: String(product.id),
    HOTMART_PRODUCT_CATEGORY: categorizeProduct(product.name), HOTMART_ABANDONED_DATE: today(),
    HOTMART_LAST_EVENT: "ABANDONED_CART", HOTMART_LAST_EVENT_DATE: today(),
    ...trackingAttrs(tracking),
  });
}

async function handleWaitingPayment(data) {
  const { buyer, product, purchase, tracking } = data;
  return upsertContact(buyer.email, {
    FIRSTNAME: buyer.firstName || "", LASTNAME: buyer.lastName || "", SMS: formatPhone(buyer.phone),
    HOTMART_STATUS: "AGUARDANDO_PAGAMENTO", HOTMART_PAYMENT_STATUS: "PENDENTE",
    HOTMART_INTEREST_PRODUCT: product.name, HOTMART_INTEREST_PRODUCT_ID: String(product.id),
    HOTMART_PRODUCT_CATEGORY: categorizeProduct(product.name), HOTMART_PAYMENT_METHOD: purchase.paymentMethod || "BOLETO",
    HOTMART_PRICE: parseFloat(purchase.price) || 0, HOTMART_WAITING_DATE: today(),
    HOTMART_LAST_EVENT: "WAITING_PAYMENT", HOTMART_LAST_EVENT_DATE: today(),
    ...trackingAttrs(tracking),
  });
}

async function handleRefund(data) {
  const { buyer, product, purchase, tracking } = data;
  return upsertContact(buyer.email, {
    FIRSTNAME: buyer.firstName || "", LASTNAME: buyer.lastName || "",
    HOTMART_STATUS: "REEMBOLSADO", HOTMART_PAYMENT_STATUS: "REEMBOLSADO",
    HOTMART_REFUND_PRODUCT: product.name, HOTMART_REFUND_DATE: today(), HOTMART_REFUND_TRANSACTION: purchase.transaction,
    HOTMART_LAST_EVENT: "PURCHASE_REFUNDED", HOTMART_LAST_EVENT_DATE: today(),
    ...trackingAttrs(tracking),
  });
}

async function handleChargeback(data) {
  const { buyer, product, purchase, tracking } = data;
  return upsertContact(buyer.email, {
    FIRSTNAME: buyer.firstName || "", LASTNAME: buyer.lastName || "",
    HOTMART_STATUS: "CHARGEBACK", HOTMART_PAYMENT_STATUS: "CHARGEBACK", HOTMART_DISPUTE_STATUS: "ABERTA",
    HOTMART_CHARGEBACK_DATE: today(), HOTMART_REFUND_PRODUCT: product.name, HOTMART_REFUND_TRANSACTION: purchase.transaction,
    HOTMART_LAST_EVENT: "CHARGEBACK", HOTMART_LAST_EVENT_DATE: today(),
    ...trackingAttrs(tracking),
  });
}

async function handleSubscriptionCancel(data) {
  const { buyer, product, subscription, tracking } = data;
  return upsertContact(buyer.email, {
    FIRSTNAME: buyer.firstName || "", LASTNAME: buyer.lastName || "",
    HOTMART_STATUS: "ASSINATURA_CANCELADA", HOTMART_SUBSCRIPTION_STATUS: "CANCELADA",
    HOTMART_CANCEL_DATE: today(), HOTMART_CANCEL_PRODUCT: product.name, HOTMART_SUBSCRIPTION_PLAN: subscription.plan || "",
    HOTMART_LAST_EVENT: "SUBSCRIPTION_CANCELLATION", HOTMART_LAST_EVENT_DATE: today(),
    ...trackingAttrs(tracking),
  });
}

async function handleDelayed(data) {
  const { buyer, product, purchase, tracking } = data;
  return upsertContact(buyer.email, {
    FIRSTNAME: buyer.firstName || "", LASTNAME: buyer.lastName || "",
    HOTMART_STATUS: "PAGAMENTO_ATRASADO", HOTMART_PAYMENT_STATUS: "ATRASADO",
    HOTMART_LAST_PRODUCT: product.name, HOTMART_TRANSACTION: purchase.transaction,
    HOTMART_LAST_EVENT: "PURCHASE_DELAYED", HOTMART_LAST_EVENT_DATE: today(),
    ...trackingAttrs(tracking),
  });
}

async function handleSubscriptionReactivate(data) {
  const { buyer, product, subscription, tracking } = data;
  return upsertContact(buyer.email, {
    FIRSTNAME: buyer.firstName || "", LASTNAME: buyer.lastName || "",
    HOTMART_STATUS: "COMPRADOR", HOTMART_SUBSCRIPTION_STATUS: "ATIVA",
    HOTMART_LAST_PRODUCT: product.name, HOTMART_SUBSCRIPTION_PLAN: subscription.plan || "",
    HOTMART_LAST_EVENT: "SUBSCRIPTION_REACTIVATION", HOTMART_LAST_EVENT_DATE: today(),
    ...trackingAttrs(tracking),
  });
}

module.exports = { handlePurchase, handleAbandoned, handleWaitingPayment, handleRefund, handleChargeback, handleSubscriptionCancel, handleDelayed, handleSubscriptionReactivate, upsertContact, getContact, MASTER_LIST_ID };
