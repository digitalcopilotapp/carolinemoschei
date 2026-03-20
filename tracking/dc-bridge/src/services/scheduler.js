const pool = require("../db/pool");
const logger = require("../utils/logger");
const { sendWhatsAppTemplate } = require("./chatwoot");
const { getTenantById } = require("../config/tenantStore");

/**
 * Schedule a WhatsApp message for delayed delivery.
 */
async function scheduleMessage(leadId, templateName, templateParams, delayMinutes, tenant = null) {
  await pool.query(
    `INSERT INTO scheduled_messages (tenant_id, lead_id, channel, template_name, template_params, scheduled_for)
     VALUES ($1, $2, 'whatsapp', $3, $4, NOW() + INTERVAL '${parseInt(delayMinutes, 10)} minutes')`,
    [tenant?.id || null, leadId, templateName, JSON.stringify(templateParams)]
  );
  logger.info("Message scheduled", {
    tenant: tenant?.slug,
    lead_id: leadId,
    template: templateName,
    delay_minutes: delayMinutes,
  });
}

/**
 * Cancel pending scheduled messages for a lead.
 */
async function cancelPendingMessages(leadId) {
  const { rowCount } = await pool.query(
    `UPDATE scheduled_messages
     SET canceled = TRUE
     WHERE lead_id = $1 AND sent = FALSE AND canceled = FALSE`,
    [leadId]
  );
  if (rowCount > 0) {
    logger.info("Canceled pending scheduled messages", {
      lead_id: leadId,
      count: rowCount,
    });
  }
}

/**
 * Process due scheduled messages. Called every 60 seconds by the cron.
 * Loads tenant config for each message to use correct Chatwoot credentials.
 */
async function processDueMessages() {
  const { rows } = await pool.query(
    `SELECT sm.*, l.chatwoot_contact_id, l.phone, sm.tenant_id
     FROM scheduled_messages sm
     JOIN leads l ON l.id = sm.lead_id
     WHERE sm.scheduled_for <= NOW()
       AND sm.sent = FALSE
       AND sm.canceled = FALSE
     ORDER BY sm.scheduled_for ASC
     LIMIT 10`
  );

  for (const msg of rows) {
    // Load tenant config for this message
    const tenant = msg.tenant_id ? getTenantById(msg.tenant_id) : null;

    if (!msg.chatwoot_contact_id) {
      logger.warn("Scheduled message has no Chatwoot contact, skipping", {
        id: msg.id,
        lead_id: msg.lead_id,
      });
      await pool.query(
        "UPDATE scheduled_messages SET canceled = TRUE WHERE id = $1",
        [msg.id]
      );
      continue;
    }

    if (!msg.phone) {
      logger.warn("Lead has no phone number, skipping WhatsApp", {
        id: msg.id,
        lead_id: msg.lead_id,
      });
      await pool.query(
        "UPDATE scheduled_messages SET canceled = TRUE WHERE id = $1",
        [msg.id]
      );
      continue;
    }

    await sendWhatsAppTemplate(
      msg.chatwoot_contact_id,
      msg.template_name,
      msg.template_params,
      tenant
    );

    await pool.query(
      "UPDATE scheduled_messages SET sent = TRUE WHERE id = $1",
      [msg.id]
    );

    logger.info("Scheduled message sent", {
      tenant: tenant?.slug,
      id: msg.id,
      lead_id: msg.lead_id,
      template: msg.template_name,
    });
  }
}

module.exports = { scheduleMessage, cancelPendingMessages, processDueMessages };
