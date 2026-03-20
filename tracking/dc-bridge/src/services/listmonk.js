const pool = require("../db/pool");
const logger = require("../utils/logger");
const { addToRetryQueue } = require("./retryQueue");

function listmonkAuth() {
  const user = process.env.LISTMONK_API_USER || "admin";
  const pass = process.env.LISTMONK_API_PASSWORD || "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

function listmonkUrl(path) {
  const base = process.env.LISTMONK_API_URL || "http://listmonk:9000";
  return `${base}/api${path}`;
}

/**
 * Get the pos-venda list ID for a tenant.
 */
function getPosvendaListId(tenant) {
  return tenant?.listmonkLists?.posvenda
    || parseInt(process.env.LISTMONK_POSVENDA_LIST_ID || "2", 10);
}

/**
 * Add a subscriber to the Pos-Venda list.
 */
async function addSubscriber(lead, metadata = {}, tenant = null) {
  const listId = getPosvendaListId(tenant);

  try {
    const res = await fetch(listmonkUrl("/subscribers"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: listmonkAuth(),
      },
      body: JSON.stringify({
        email: lead.email,
        name: lead.name || lead.email,
        status: "enabled",
        lists: [listId],
        attribs: {
          product: metadata.product || null,
          purchase_date: new Date().toISOString(),
          tenant: tenant?.slug || "default",
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const subscriberId = data.data?.id;
      if (subscriberId) {
        await pool.query(
          "UPDATE leads SET listmonk_subscriber_id = $1 WHERE id = $2",
          [subscriberId, lead.id]
        );
      }
      logger.info("Listmonk subscriber added", {
        tenant: tenant?.slug,
        lead_id: lead.id,
        subscriber_id: subscriberId,
        list_id: listId,
      });
    } else if (res.status === 409) {
      logger.info("Listmonk subscriber exists, updating lists", {
        email: logger.maskEmail(lead.email),
      });
      await addExistingSubscriberToList(lead.email, listId);
    } else {
      const body = await res.text();
      throw new Error(`Listmonk API error: ${res.status} ${body}`);
    }
  } catch (err) {
    logger.error("Listmonk sync failed", {
      tenant: tenant?.slug,
      lead_id: lead.id,
      error: err.message,
    });
    await addToRetryQueue("listmonk", {
      lead_id: lead.id,
      action: "add",
      metadata,
      tenant_id: tenant?.id,
    });
  }
}

async function addExistingSubscriberToList(email, listId) {
  const searchRes = await fetch(
    listmonkUrl(`/subscribers?query=subscribers.email='${encodeURIComponent(email)}'`),
    { headers: { Authorization: listmonkAuth() } }
  );

  if (!searchRes.ok) return;

  const searchData = await searchRes.json();
  const subscriber = searchData.data?.results?.[0];
  if (!subscriber) return;

  const currentListIds = (subscriber.lists || []).map((l) => l.id);
  if (currentListIds.includes(listId)) return;

  await fetch(listmonkUrl(`/subscribers/${subscriber.id}/lists`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: listmonkAuth(),
    },
    body: JSON.stringify({ lists: [listId], action: "add" }),
  });
}

/**
 * Remove a subscriber from the Pos-Venda list.
 */
async function removeSubscriber(lead, tenant = null) {
  const listId = getPosvendaListId(tenant);

  try {
    if (!lead.listmonk_subscriber_id) {
      logger.info("No Listmonk subscriber ID, skipping removal", { lead_id: lead.id });
      return;
    }

    await fetch(
      listmonkUrl(`/subscribers/${lead.listmonk_subscriber_id}/lists`),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: listmonkAuth(),
        },
        body: JSON.stringify({ lists: [listId], action: "remove" }),
      }
    );

    logger.info("Listmonk subscriber removed", {
      tenant: tenant?.slug,
      lead_id: lead.id,
      list_id: listId,
    });
  } catch (err) {
    logger.error("Listmonk removal failed", { lead_id: lead.id, error: err.message });
    await addToRetryQueue("listmonk", {
      lead_id: lead.id,
      action: "remove",
      tenant_id: tenant?.id,
    });
  }
}

module.exports = { addSubscriber, removeSubscriber };
