const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
const { categorizeEvent, extractHotmartData } = require("../utils/hotmart-events");
const brevo = require("../services/brevo");
const meta = require("../services/meta");
const db = require("../services/database");

router.post("/hotmart", async (req, res) => {
  try {
    const body = req.body;
    const hottok = body.hottok || req.query.hottok || req.headers["x-hotmart-hottok"];
    if (process.env.HOTMART_HOTTOK && hottok !== process.env.HOTMART_HOTTOK) {
      logger.warn("Webhook: hottok invalido", { ip: req.ip });
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hotmartData = extractHotmartData(body);
    const category = categorizeEvent(hotmartData.event);

    logger.info("Webhook: " + hotmartData.event + " (" + category + ")", {
      email: hotmartData.buyer.email ? hotmartData.buyer.email.substring(0, 3) + "***" : "N/A",
      product: hotmartData.product.name,
      transaction: hotmartData.purchase.transaction,
    });

    // Registrar no banco de dados
    const dbRecord = db.logEvent({ ...hotmartData, category });

    const promises = [];

    // BREVO
    const brevoHandler = {
      PURCHASE: () => brevo.handlePurchase(hotmartData),
      ABANDONED: () => brevo.handleAbandoned(hotmartData),
      REFUND: () => brevo.handleRefund(hotmartData),
      CHARGEBACK: () => brevo.handleChargeback(hotmartData),
      WAITING_PAYMENT: () => brevo.handleWaitingPayment(hotmartData),
      SUBSCRIPTION_CANCEL: () => brevo.handleSubscriptionCancel(hotmartData),
      SUBSCRIPTION_REACTIVATE: () => brevo.handleSubscriptionReactivate(hotmartData),
      DELAYED: () => brevo.handleDelayed(hotmartData),
    }[category];

    if (brevoHandler) {
      promises.push(
        brevoHandler()
          .then(r => { db.updateEventResult(dbRecord.id, "brevo", "ok"); return r; })
          .catch(err => { db.updateEventResult(dbRecord.id, "brevo", "error: " + err.message); logger.error("Brevo " + category + ":", { error: err.message }); })
      );
    } else {
      promises.push(
        brevo.upsertContact(hotmartData.buyer.email, {
          FIRSTNAME: hotmartData.buyer.firstName || "",
          LASTNAME: hotmartData.buyer.lastName || "",
          HOTMART_STATUS: hotmartData.event.toUpperCase(),
          HOTMART_LAST_EVENT: hotmartData.event,
          HOTMART_LAST_EVENT_DATE: new Date().toISOString().split("T")[0],
        }).then(() => db.updateEventResult(dbRecord.id, "brevo", "ok"))
          .catch(err => { db.updateEventResult(dbRecord.id, "brevo", "error: " + err.message); })
      );
    }

    // META
    const metaHandlers = {
      PURCHASE: [() => meta.sendPurchaseEvent(hotmartData)],
      ABANDONED: [() => meta.sendInitiateCheckoutEvent(hotmartData), () => meta.sendViewContentEvent(hotmartData)],
      WAITING_PAYMENT: [() => meta.sendInitiateCheckoutEvent(hotmartData), () => meta.sendLeadEvent(hotmartData)],
    }[category] || [];

    for (const handler of metaHandlers) {
      promises.push(
        handler()
          .then(r => { db.updateEventResult(dbRecord.id, "meta", "ok"); return r; })
          .catch(err => { db.updateEventResult(dbRecord.id, "meta", "error: " + err.message); logger.error("Meta:", { error: err.message }); })
      );
    }

    await Promise.allSettled(promises);
    res.status(200).json({ success: true, event: hotmartData.event, category, event_id: dbRecord.id, processed_at: new Date().toISOString() });
  } catch (error) {
    logger.error("Erro webhook:", { error: error.message, stack: error.stack });
    res.status(200).json({ success: false, error: "Processed with errors" });
  }
});

// API de consulta de eventos
router.get("/stats", (req, res) => {
  res.json(db.getStats());
});

router.get("/events", (req, res) => {
  const filters = {};
  if (req.query.email) filters.email = req.query.email;
  if (req.query.event) filters.event = req.query.event;
  if (req.query.product_id) filters.product_id = req.query.product_id;
  filters.limit = parseInt(req.query.limit) || 100;
  res.json(db.getEvents(filters));
});

router.get("/contact/:email", (req, res) => {
  const contact = db.getContact(req.params.email);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

router.get("/hotmart", (req, res) => {
  const stats = db.getStats();
  res.json({ status: "online", message: "Webhook Hotmart ativo", ...stats, timestamp: new Date().toISOString() });
});

module.exports = router;

// Endpoint para importação em massa (só banco de dados, sem Brevo/Meta)
router.post("/import-batch", async (req, res) => {
  try {
    const hottok = req.body.hottok || req.headers["x-hotmart-hottok"];
    if (process.env.HOTMART_HOTTOK && hottok !== process.env.HOTMART_HOTTOK) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const events = req.body.events || [];
    let imported = 0;
    for (const evt of events) {
      const hotmartData = require("../utils/hotmart-events").extractHotmartData(evt);
      const category = require("../utils/hotmart-events").categorizeEvent(hotmartData.event);
      db.logEvent({ ...hotmartData, category });
      imported++;
    }
    db.flush();
    res.json({ success: true, imported, total_events: db.getStats().total_events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
