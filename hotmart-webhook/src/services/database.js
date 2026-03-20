const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// Usar banco SQLite via arquivo JSON como fallback seguro (sem dependência nativa)
// Para produção real, usar better-sqlite3 ou PostgreSQL
const DB_PATH = path.join(__dirname, "../../data/events.json");
const DB_DIR = path.dirname(DB_PATH);

// Garantir diretório
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Carregar ou criar banco
let db = { events: [], contacts: {}, stats: { total_events: 0, total_purchases: 0, total_revenue: 0 } };
if (fs.existsSync(DB_PATH)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch (e) {
    logger.warn("DB: Arquivo corrompido, criando novo");
  }
}

// Buffer para writes (salvar a cada N eventos ou X segundos)
let dirty = false;
let saveTimer = null;

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    if (dirty) {
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 0));
        dirty = false;
      } catch (e) {
        logger.error("DB: Erro ao salvar", { error: e.message });
      }
    }
    saveTimer = null;
  }, 2000); // Salva 2s depois da última escrita
}

/**
 * Registrar evento recebido do webhook
 */
function logEvent(eventData) {
  const record = {
    id: db.stats.total_events + 1,
    timestamp: new Date().toISOString(),
    event: eventData.event || "",
    category: eventData.category || "",
    email: eventData.buyer?.email || "",
    name: eventData.buyer?.name || "",
    phone: eventData.buyer?.phone || "",
    document: eventData.buyer?.document || "",
    product_id: eventData.product?.id || "",
    product_name: eventData.product?.name || "",
    transaction: eventData.purchase?.transaction || "",
    status: eventData.purchase?.status || "",
    price: typeof eventData.purchase?.price === "object" 
      ? eventData.purchase.price.value || 0 
      : eventData.purchase?.price || 0,
    currency: eventData.purchase?.currency || "BRL",
    payment_method: eventData.purchase?.paymentMethod || "",
    payment_type: eventData.purchase?.paymentType || "",
    offer_code: eventData.purchase?.offerCode || "",
    brevo_result: null,
    meta_result: null, src: eventData.tracking?.src || "", sck: eventData.tracking?.sck || "", utm_source: eventData.tracking?.utm_source || "", utm_medium: eventData.tracking?.utm_medium || "", utm_campaign: eventData.tracking?.utm_campaign || "",
  };

  db.events.push(record);
  db.stats.total_events++;

  // Atualizar contato
  const email = record.email.toLowerCase();
  if (email) {
    if (!db.contacts[email]) {
      db.contacts[email] = {
        email,
        name: record.name,
        phone: record.phone,
        first_seen: record.timestamp,
        events: [],
        purchases: [],
        total_spent: 0,
        total_purchases: 0,
      };
    }
    const contact = db.contacts[email];
    if (record.name && !contact.name) contact.name = record.name;
    if (record.phone && !contact.phone) contact.phone = record.phone;
    contact.last_seen = record.timestamp;
    contact.events.push({
      event: record.event,
      product: record.product_name,
      price: record.price,
      transaction: record.transaction,
      timestamp: record.timestamp,
    });

    // Se é compra aprovada
    if (["PURCHASE_COMPLETE", "PURCHASE_APPROVED"].includes(record.event.toUpperCase())) {
      contact.purchases.push({
        product: record.product_name,
        price: record.price,
        transaction: record.transaction,
        timestamp: record.timestamp,
      });
      contact.total_spent += record.price;
      contact.total_purchases++;
      db.stats.total_purchases++;
      db.stats.total_revenue += record.price;
    }
  }

  dirty = true;
  scheduleSave();
  return record;
}

/**
 * Atualizar resultado do Brevo/Meta no evento
 */
function updateEventResult(eventId, service, result) {
  const event = db.events.find(e => e.id === eventId);
  if (event) {
    if (service === "brevo") event.brevo_result = result;
    if (service === "meta") event.meta_result = result;
    dirty = true;
    scheduleSave();
  }
}

/**
 * Buscar eventos (com filtros)
 */
function getEvents(filters = {}) {
  let events = db.events;
  if (filters.email) events = events.filter(e => e.email.toLowerCase() === filters.email.toLowerCase());
  if (filters.event) events = events.filter(e => e.event === filters.event);
  if (filters.product_id) events = events.filter(e => String(e.product_id) === String(filters.product_id));
  if (filters.limit) events = events.slice(-filters.limit);
  return events;
}

/**
 * Buscar contato por email
 */
function getContact(email) {
  return db.contacts[email.toLowerCase()] || null;
}

/**
 * Estatísticas
 */
function getStats() {
  return {
    ...db.stats,
    total_contacts: Object.keys(db.contacts).length,
    db_size_kb: Math.round(JSON.stringify(db).length / 1024),
  };
}

/**
 * Forçar salvamento
 */
function flush() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 0));
    dirty = false;
  } catch (e) {
    logger.error("DB: Erro flush", { error: e.message });
  }
}

// Salvar ao sair
process.on("SIGTERM", flush);
process.on("SIGINT", flush);

module.exports = { logEvent, updateEventResult, getEvents, getContact, getStats, flush };
