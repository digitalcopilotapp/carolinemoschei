const { upsertLead } = require("./leads");
const { recordConversion, updateConversionStatus } = require("./conversions");
const { sendPurchase, sendSubscribe, sendContact } = require("./metaCapi");
const { syncToChatwoot, sendWhatsAppTemplate } = require("./chatwoot");
const { addSubscriber, removeSubscriber } = require("./listmonk");
const { scheduleMessage, cancelPendingMessages } = require("./scheduler");
const { WHATSAPP_TEMPLATES } = require("../config/templates");
const logger = require("../utils/logger");

/**
 * Extract buyer data from various Hotmart payload formats.
 */
function extractBuyerData(payload) {
  // Hotmart v2 payload format
  const buyer = payload.data?.buyer || payload.buyer || {};
  const purchase = payload.data?.purchase || payload.purchase || {};
  const product = payload.data?.product || payload.product || {};
  const subscription = payload.data?.subscription || payload.subscription || {};
  const address = buyer.address || payload.address || {};

  // Hotmart sends phone as object {ddd, number, country_code} or as string
  const rawPhone = buyer.checkout_phone || buyer.phone || payload.phone || payload.checkout_phone;
  const phone = rawPhone && typeof rawPhone === "object"
    ? `${rawPhone.country_code || "55"}${rawPhone.ddd || ""}${rawPhone.number || ""}`
    : rawPhone;

  return {
    buyer: {
      email: buyer.email || payload.email,
      name: buyer.name || payload.name,
      phone,
      country: address.country || buyer.country || payload.country,
      // Extra PII for Meta CAPI EMQ maximization
      city: address.city || buyer.city,
      state: address.state || buyer.state,
      zipcode: address.zip_code || address.zipcode || buyer.zip_code,
      gender: buyer.gender || payload.gender,
      birthdate: buyer.birthdate || buyer.birth_date || payload.birthdate,
      document: buyer.document || payload.document,
    },
    purchase: {
      transaction:
        purchase.transaction || payload.transaction || payload.transaction_id,
      price: purchase.price || payload.price || {},
      payment: purchase.payment || payload.payment || {},
      // UTM params from Hotmart (for attribution)
      src: purchase.sck?.src || payload.src,
      sck: purchase.sck?.sck || payload.sck,
    },
    product: {
      name: product.name || payload.product_name || "Unknown",
      id: product.id || product.ucode || payload.product_id,
      offerId: purchase.offer?.code || payload.offer_code,
    },
    subscription: {
      id:
        subscription.subscriber?.code ||
        subscription.id ||
        payload.subscription_id,
      plan: subscription.plan?.name || payload.plan_name,
      status: subscription.status || payload.subscription_status,
      nextBilling: subscription.next_charge_date,
    },
    raw: payload,
  };
}

/**
 * Route a Hotmart event through the appropriate pipeline.
 * Each step is independent — failure in one does not block others.
 */
async function routeEvent(eventType, payload, tenant = null) {
  const data = extractBuyerData(payload);
  const results = { steps: [], errors: [] };

  async function step(name, fn) {
    try {
      const result = await fn();
      results.steps.push(name);
      return result;
    } catch (err) {
      results.errors.push({ step: name, error: err.message });
      logger.error(`Pipeline step failed: ${name}`, {
        event_type: eventType,
        error: err.message,
      });
      return null;
    }
  }

  // Step 1: Always upsert lead
  const lead = await step("upsert_lead", () =>
    upsertLead(data.buyer, eventType, tenant)
  );

  if (!lead) {
    logger.error("Lead upsert failed, aborting pipeline", {
      event_type: eventType,
    });
    return results;
  }

  const metadata = {
    product: data.product.name,
    productId: data.product.id,
    hotmartTxId: data.purchase.transaction,
    amount: data.purchase.price?.value,
    accessLink: "",
    discountLink: "",
  };

  // Extra data for Meta CAPI (all available PII for maximum EMQ)
  const metaExtraData = {
    gender: data.buyer.gender,
    birthdate: data.buyer.birthdate,
    city: data.buyer.city,
    state: data.buyer.state,
    zipcode: data.buyer.zipcode,
    productId: data.product.id,
    subscriptionId: data.subscription.id,
    fbc: lead.fbc || undefined,
    fbp: lead.fbp || undefined,
  };

  // Resolve WhatsApp templates: per-tenant overrides or global defaults
  const templates = tenant?.resolvedTemplates || WHATSAPP_TEMPLATES;

  switch (eventType) {
    case "PURCHASE_APPROVED": {
      await step("cancel_pending", () => cancelPendingMessages(lead.id));

      const conversion = await step("record_conversion", () =>
        recordConversion(lead.id, {
          ...data.raw,
          transaction: data.purchase.transaction,
          product: data.product,
          purchase: data.purchase,
        }, tenant)
      );

      if (conversion) {
        await step("meta_capi", () => sendPurchase(lead, conversion, metaExtraData, tenant));
      }

      const contactId = await step("chatwoot_sync", () =>
        syncToChatwoot(lead, eventType, metadata, tenant)
      );

      if (contactId || lead.chatwoot_contact_id) {
        const template = templates[eventType];
        if (template) {
          await step("whatsapp", () =>
            sendWhatsAppTemplate(
              contactId || lead.chatwoot_contact_id,
              template.templateName,
              template.buildParams(lead, metadata),
              tenant
            )
          );
        }
      }

      await step("listmonk_add", () => addSubscriber(lead, metadata, tenant));
      break;
    }

    case "PURCHASE_COMPLETE": {
      const conversion = await step("record_conversion", () =>
        recordConversion(lead.id, {
          ...data.raw,
          transaction: data.purchase.transaction,
          product: data.product,
          purchase: data.purchase,
        }, tenant)
      );

      if (conversion && !conversion.sent_to_meta) {
        await step("meta_capi", () => sendPurchase(lead, conversion, metaExtraData, tenant));
      }

      await step("chatwoot_sync", () =>
        syncToChatwoot(lead, eventType, metadata, tenant)
      );
      break;
    }

    case "PURCHASE_REFUNDED": {
      await step("update_conversion", () =>
        updateConversionStatus(data.purchase.transaction, "refunded")
      );

      await step("chatwoot_sync", () =>
        syncToChatwoot(lead, eventType, metadata, tenant)
      );

      const refundTemplate = templates[eventType];
      if (refundTemplate && lead.chatwoot_contact_id) {
        await step("whatsapp", () =>
          sendWhatsAppTemplate(
            lead.chatwoot_contact_id,
            refundTemplate.templateName,
            refundTemplate.buildParams(lead, metadata),
            tenant
          )
        );
      }

      await step("listmonk_remove", () => removeSubscriber(lead, tenant));
      break;
    }

    case "PURCHASE_CANCELED": {
      await step("update_conversion", () =>
        updateConversionStatus(data.purchase.transaction, "canceled")
      );

      await step("chatwoot_sync", () =>
        syncToChatwoot(lead, eventType, metadata, tenant)
      );
      break;
    }

    case "CART_ABANDONMENT": {
      await step("chatwoot_sync", () =>
        syncToChatwoot(lead, eventType, metadata, tenant)
      );

      const cartTemplate = templates[eventType];
      if (cartTemplate) {
        await step("schedule_whatsapp", () =>
          scheduleMessage(
            lead.id,
            cartTemplate.templateName,
            cartTemplate.buildParams(lead, metadata),
            20,
            tenant
          )
        );
      }
      break;
    }

    case "SUBSCRIPTION_PURCHASE": {
      await step("cancel_pending", () => cancelPendingMessages(lead.id));

      const subConversion = await step("record_conversion", () =>
        recordConversion(lead.id, {
          ...data.raw,
          transaction: data.purchase.transaction,
          product: data.product,
          purchase: data.purchase,
        }, tenant)
      );

      if (subConversion) {
        await step("meta_capi_purchase", () =>
          sendPurchase(lead, subConversion, metaExtraData, tenant)
        );
      }

      await step("meta_capi_subscribe", () =>
        sendSubscribe(lead, {
          hotmart_subscription_id: data.subscription.id,
          plan: data.subscription.plan,
          amount: data.purchase.price?.value,
          currency: data.purchase.price?.currency_code || "BRL",
        }, metaExtraData, tenant)
      );

      await step("create_subscription", async () => {
        const pool = require("../db/pool");
        await pool.query(
          `INSERT INTO subscriptions (tenant_id, lead_id, plan, status, hotmart_subscription_id, next_billing)
           VALUES ($1, $2, $3, 'active', $4, $5)
           ON CONFLICT DO NOTHING`,
          [tenant?.id, lead.id, data.subscription.plan, data.subscription.id, data.subscription.nextBilling]
        );
      });

      const subContactId = await step("chatwoot_sync", () =>
        syncToChatwoot(lead, "PURCHASE_APPROVED", metadata, tenant)
      );

      if (subContactId || lead.chatwoot_contact_id) {
        const subTemplate = templates.PURCHASE_APPROVED;
        if (subTemplate) {
          await step("whatsapp", () =>
            sendWhatsAppTemplate(
              subContactId || lead.chatwoot_contact_id,
              subTemplate.templateName,
              subTemplate.buildParams(lead, metadata),
              tenant
            )
          );
        }
      }

      await step("listmonk_add", () => addSubscriber(lead, metadata, tenant));
      break;
    }

    case "SUBSCRIPTION_CANCELLATION": {
      await step("update_subscription", async () => {
        const pool = require("../db/pool");
        await pool.query(
          `UPDATE subscriptions SET status = 'canceled', canceled_at = NOW()
           WHERE lead_id = $1 AND hotmart_subscription_id = $2`,
          [lead.id, data.subscription.id]
        );
      });

      await step("chatwoot_sync", () =>
        syncToChatwoot(lead, eventType, metadata, tenant)
      );

      const cancelTemplate = templates[eventType];
      if (cancelTemplate && lead.chatwoot_contact_id) {
        await step("whatsapp", () =>
          sendWhatsAppTemplate(
            lead.chatwoot_contact_id,
            cancelTemplate.templateName,
            cancelTemplate.buildParams(lead, metadata),
            tenant
          )
        );
      }
      break;
    }

    default:
      logger.warn("Unhandled event type in router", { event_type: eventType });
  }

  logger.info("Pipeline complete", {
    tenant: tenant?.slug,
    event_type: eventType,
    lead_id: lead.id,
    steps_completed: results.steps,
    errors: results.errors.length,
  });

  return results;
}

module.exports = { routeEvent };
