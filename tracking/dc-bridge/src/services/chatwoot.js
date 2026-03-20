const pool = require("../db/pool");
const logger = require("../utils/logger");
const { addToRetryQueue } = require("./retryQueue");

const LABEL_MAP = {
  PURCHASE_APPROVED: { add: ["cliente"], remove: ["carrinho_abandonado"] },
  PURCHASE_COMPLETE: { add: ["cliente"], remove: [] },
  PURCHASE_REFUNDED: { add: ["refund"], remove: ["cliente"] },
  PURCHASE_CANCELED: { add: ["cancelado"], remove: [] },
  CART_ABANDONMENT: { add: ["carrinho_abandonado"], remove: [] },
  SUBSCRIPTION_PURCHASE: { add: ["cliente", "assinante"], remove: ["carrinho_abandonado"] },
  SUBSCRIPTION_CANCELLATION: { add: ["ex-assinante"], remove: ["assinante"] },
  SUBSCRIPTION_REACTIVATION: { add: ["assinante"], remove: ["ex-assinante"] },
};

function chatwootHeaders(tenant) {
  return {
    "Content-Type": "application/json",
    api_access_token: tenant?.chatwoot_api_token || process.env.CHATWOOT_API_TOKEN,
  };
}

function chatwootUrl(path, tenant) {
  const base = process.env.CHATWOOT_BASE_URL || "http://chatwoot-web:3000";
  const accountId = tenant?.chatwoot_account_id || process.env.CHATWOOT_ACCOUNT_ID || "1";
  return `${base}/api/v1/accounts/${accountId}${path}`;
}

/**
 * Create or update a contact in Chatwoot.
 * Uses tenant-specific Chatwoot credentials.
 */
async function syncToChatwoot(lead, eventType, metadata = {}, tenant = null) {
  try {
    let contactId = lead.chatwoot_contact_id;

    if (!contactId) {
      const searchRes = await fetch(
        chatwootUrl(`/contacts/search?q=${encodeURIComponent(lead.email)}`, tenant),
        { headers: chatwootHeaders(tenant) }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const existing = searchData.payload?.find(
          (c) => c.email === lead.email
        );
        if (existing) contactId = existing.id;
      }
    }

    const contactPayload = {
      name: lead.name || lead.email,
      email: lead.email,
      phone_number: lead.phone || undefined,
      custom_attributes: {
        produto: metadata.product || undefined,
        hotmart_tx_id: metadata.hotmartTxId || undefined,
        source: lead.source || undefined,
        purchase_amount: metadata.amount || undefined,
      },
    };

    if (contactId) {
      await fetch(chatwootUrl(`/contacts/${contactId}`, tenant), {
        method: "PATCH",
        headers: chatwootHeaders(tenant),
        body: JSON.stringify(contactPayload),
      });
    } else {
      const res = await fetch(chatwootUrl("/contacts", tenant), {
        method: "POST",
        headers: chatwootHeaders(tenant),
        body: JSON.stringify(contactPayload),
      });
      if (res.ok) {
        const contact = await res.json();
        contactId = contact.payload?.contact?.id || contact.id;
      }
    }

    if (contactId) {
      await pool.query(
        "UPDATE leads SET chatwoot_contact_id = $1 WHERE id = $2",
        [contactId, lead.id]
      );

      // Apply labels
      const labelConfig = LABEL_MAP[eventType];
      if (labelConfig) {
        const labelRes = await fetch(
          chatwootUrl(`/contacts/${contactId}/labels`, tenant),
          { headers: chatwootHeaders(tenant) }
        );
        let currentLabels = [];
        if (labelRes.ok) {
          const labelData = await labelRes.json();
          currentLabels = labelData.payload || [];
        }

        const updatedLabels = [
          ...currentLabels.filter((l) => !labelConfig.remove.includes(l)),
          ...labelConfig.add.filter((l) => !currentLabels.includes(l)),
        ];

        await fetch(chatwootUrl(`/contacts/${contactId}/labels`, tenant), {
          method: "POST",
          headers: chatwootHeaders(tenant),
          body: JSON.stringify({ labels: updatedLabels }),
        });
      }

      logger.info("Chatwoot synced", {
        tenant: tenant?.slug,
        contact_id: contactId,
        event_type: eventType,
        labels_applied: LABEL_MAP[eventType]?.add,
      });
    }

    return contactId;
  } catch (err) {
    logger.error("Chatwoot sync failed", {
      tenant: tenant?.slug,
      lead_id: lead.id,
      error: err.message,
    });
    await addToRetryQueue("chatwoot", {
      lead_id: lead.id,
      event_type: eventType,
      metadata,
      tenant_id: tenant?.id,
    });
    return null;
  }
}

/**
 * Send a WhatsApp template message via Chatwoot's API.
 * Uses tenant-specific WhatsApp inbox.
 */
async function sendWhatsAppTemplate(chatwootContactId, templateName, templateParams = {}, tenant = null) {
  if (!chatwootContactId) {
    logger.warn("No Chatwoot contact ID, skipping WhatsApp send", {
      template: templateName,
    });
    return;
  }

  const inboxId = tenant?.chatwoot_whatsapp_inbox_id || process.env.CHATWOOT_WHATSAPP_INBOX_ID;
  if (!inboxId) {
    logger.warn("WhatsApp inbox ID not configured, skipping");
    return;
  }

  try {
    const convRes = await fetch(chatwootUrl("/conversations", tenant), {
      method: "POST",
      headers: chatwootHeaders(tenant),
      body: JSON.stringify({
        contact_id: chatwootContactId,
        inbox_id: parseInt(inboxId, 10),
      }),
    });

    if (!convRes.ok) {
      const errBody = await convRes.text();
      throw new Error(`Conversation creation failed: ${convRes.status} ${errBody}`);
    }

    const convData = await convRes.json();
    const conversationId = convData.id;

    const msgRes = await fetch(
      chatwootUrl(`/conversations/${conversationId}/messages`, tenant),
      {
        method: "POST",
        headers: chatwootHeaders(tenant),
        body: JSON.stringify({
          content: "",
          message_type: "template",
          template_params: {
            name: templateName,
            ...templateParams,
          },
        }),
      }
    );

    if (msgRes.ok) {
      logger.info("WhatsApp template sent", {
        tenant: tenant?.slug,
        contact_id: chatwootContactId,
        template: templateName,
      });
    } else {
      const errBody = await msgRes.text();
      throw new Error(`Message send failed: ${msgRes.status} ${errBody}`);
    }
  } catch (err) {
    logger.error("WhatsApp send failed", {
      tenant: tenant?.slug,
      contact_id: chatwootContactId,
      template: templateName,
      error: err.message,
    });
    await addToRetryQueue("whatsapp", {
      chatwoot_contact_id: chatwootContactId,
      template_name: templateName,
      template_params: templateParams,
      tenant_id: tenant?.id,
    });
  }
}

module.exports = { syncToChatwoot, sendWhatsAppTemplate, chatwootHeaders, chatwootUrl };
