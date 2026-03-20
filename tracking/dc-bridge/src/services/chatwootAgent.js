const pool = require("../db/pool");
const logger = require("../utils/logger");
const { chatwootHeaders, chatwootUrl } = require("./chatwoot");
const { sendEvent, buildCustomData } = require("./metaCapi");
const { getAllTenants } = require("../config/tenantStore");

const PAGE_SIZE = 25;
const RATE_LIMIT_MS = 250;
let isRunning = false;
let lastRunStats = null;

// Default conversion rules used when tenant has no custom rules
const DEFAULT_RULES = {
	attribution_window_hours: 72,
	sources: {
		whatsapp: {
			meta_event: "Purchase",
			action_source: "business_messaging",
			labels: ["converteu_whatsapp"],
		},
		email_campaign: {
			meta_event: "Purchase",
			action_source: "email",
			labels: ["converteu_email"],
		},
		organic: {
			meta_event: "Purchase",
			action_source: "website",
			labels: ["converteu_organico"],
		},
		paid_ads: {
			meta_event: "Purchase",
			action_source: "website",
			labels: ["converteu_ads"],
		},
	},
	keyword_patterns: {
		purchase_intent: ["comprei", "paguei", "pix", "boleto"],
	},
};

/**
 * Deep-merge tenant conversion_rules over DEFAULT_RULES.
 * Ensures partial tenant overrides don't lose default sources.
 */
function mergeRules(tenantRules) {
	const merged = { ...DEFAULT_RULES };
	if (!tenantRules || Object.keys(tenantRules).length === 0) return merged;

	if (tenantRules.attribution_window_hours != null) {
		merged.attribution_window_hours = tenantRules.attribution_window_hours;
	}
	if (tenantRules.sources) {
		merged.sources = { ...DEFAULT_RULES.sources };
		for (const [key, val] of Object.entries(tenantRules.sources)) {
			merged.sources[key] = { ...(DEFAULT_RULES.sources[key] || {}), ...val };
		}
	}
	if (tenantRules.keyword_patterns) {
		merged.keyword_patterns = {
			...DEFAULT_RULES.keyword_patterns,
			...tenantRules.keyword_patterns,
		};
	}
	return merged;
}

/**
 * Sleep helper for rate limiting.
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a single page of conversations from Chatwoot.
 * Returns all conversations on the page plus a flag for whether newer ones exist.
 * Chatwoot sorts by last_activity_at desc by default — we filter client-side by id > afterId.
 */
async function fetchConversationPage(tenant, page = 1) {
	const url = chatwootUrl(`/conversations?page=${page}`, tenant);
	const res = await fetch(url, { headers: chatwootHeaders(tenant) });

	if (res.status === 429) {
		const retryAfter = Number.parseInt(
			res.headers.get("retry-after") || "5",
			10,
		);
		logger.warn("chatwoot_agent: rate limited, waiting", {
			tenant: tenant.slug,
			retry_after: retryAfter,
		});
		await sleep(retryAfter * 1000);
		return fetchConversationPage(tenant, page);
	}

	if (!res.ok) {
		throw new Error(`Chatwoot conversations API: ${res.status}`);
	}

	const data = await res.json();
	const allConversations = data.data?.payload || [];

	return {
		conversations: allConversations,
		totalCount: data.data?.meta?.all_count || 0,
		hasMore: allConversations.length >= PAGE_SIZE,
	};
}

/**
 * Get or create the agent cursor for a tenant.
 */
async function getCursor(tenantId) {
	const { rows } = await pool.query(
		"SELECT * FROM agent_cursors WHERE tenant_id = $1",
		[tenantId],
	);

	if (rows[0]) return rows[0];

	const { rows: created } = await pool.query(
		`INSERT INTO agent_cursors (tenant_id) VALUES ($1)
     ON CONFLICT (tenant_id) DO NOTHING
     RETURNING *`,
		[tenantId],
	);

	return (
		created[0] ||
		(
			await pool.query("SELECT * FROM agent_cursors WHERE tenant_id = $1", [
				tenantId,
			])
		).rows[0]
	);
}

/**
 * Advance the cursor after processing.
 */
async function advanceCursor(tenantId, lastId, itemsProcessed) {
	await pool.query(
		`UPDATE agent_cursors
     SET last_processed_id = $2, last_run_at = NOW(),
         items_processed = items_processed + $3, updated_at = NOW()
     WHERE tenant_id = $1`,
		[tenantId, lastId, itemsProcessed],
	);
}

/**
 * Find the lead matching a Chatwoot conversation's contact.
 */
async function findLeadForConversation(conversation, tenantId) {
	const contact = conversation.meta?.sender;
	if (!contact) return null;

	const email = contact.email;
	const phone = contact.phone_number;

	if (email) {
		const { rows } = await pool.query(
			"SELECT * FROM leads WHERE tenant_id = $1 AND email = $2",
			[tenantId, email.toLowerCase().trim()],
		);
		if (rows[0]) return rows[0];
	}

	if (phone) {
		const cleaned = phone.replace(/\D/g, "");
		const { rows } = await pool.query(
			"SELECT * FROM leads WHERE tenant_id = $1 AND phone LIKE $2",
			[tenantId, `%${cleaned.slice(-9)}`],
		);
		if (rows[0]) return rows[0];
	}

	return null;
}

/**
 * Find unattributed conversions for a lead within the attribution window.
 */
async function findUnattributedConversions(leadId, windowHours) {
	const { rows } = await pool.query(
		`SELECT c.* FROM conversions c
     LEFT JOIN conversion_attributions ca ON ca.conversion_id = c.id
     WHERE c.lead_id = $1
       AND ca.id IS NULL
       AND c.created_at >= NOW() - INTERVAL '1 hour' * $2
       AND c.status != 'refunded'
     ORDER BY c.created_at ASC`,
		[leadId, windowHours],
	);
	return rows;
}

/**
 * Check if a lead received a Listmonk campaign within the attribution window.
 * Queries Listmonk API for campaign history on this subscriber.
 */
async function checkListmonkCampaign(lead, windowHours) {
	if (!lead.listmonk_subscriber_id) return null;

	try {
		const base = process.env.LISTMONK_API_URL || "http://listmonk:9000";
		const user = process.env.LISTMONK_API_USER || "admin";
		const pass = process.env.LISTMONK_API_PASSWORD || "";
		const auth = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

		const url = `${base}/api/subscribers/${lead.listmonk_subscriber_id}/campaigns`;
		const res = await fetch(url, { headers: { Authorization: auth } });

		if (!res.ok) return null;

		const data = await res.json();
		const campaigns = data.data?.results || data.data || [];
		const windowMs = windowHours * 60 * 60 * 1000;
		const cutoff = Date.now() - windowMs;

		const recent = campaigns.find((c) => {
			const sentAt = new Date(c.sent_at || c.updated_at).getTime();
			return sentAt >= cutoff;
		});

		return recent || null;
	} catch (err) {
		logger.warn("chatwoot_agent: listmonk campaign check failed", {
			lead_id: lead.id,
			error: err.message,
		});
		return null;
	}
}

/**
 * Classify the attribution source for a conversion based on conversation context.
 *
 * Priority:
 * 1. WhatsApp inbox → whatsapp
 * 2. Recent Listmonk campaign → email_campaign
 * 3. UTM from ads → paid_ads
 * 4. Else → organic
 */
async function classifyAttribution(conversation, lead, conversion, tenant) {
	const rules = mergeRules(tenant.conversionRules);
	const windowHours = rules.attribution_window_hours || 72;
	const detail = {};

	// 1. Check if conversation is from WhatsApp inbox
	const whatsappInboxId = tenant.chatwoot_whatsapp_inbox_id;
	if (
		conversation.inbox_id &&
		whatsappInboxId &&
		conversation.inbox_id === Number.parseInt(whatsappInboxId, 10)
	) {
		detail.inbox_id = conversation.inbox_id;
		detail.conversation_id = conversation.id;
		return { source: "whatsapp", detail };
	}

	// 2. Check for recent Listmonk campaign
	const campaign = await checkListmonkCampaign(lead, windowHours);
	if (campaign) {
		detail.campaign_id = campaign.id;
		detail.campaign_name = campaign.name || campaign.subject;
		detail.sent_at = campaign.sent_at || campaign.updated_at;
		return { source: "email_campaign", detail };
	}

	// 3. Check for UTM/ads source
	if (lead.source) {
		const src = lead.source.toLowerCase();
		if (
			src.includes("utm_") ||
			src.includes("fbclid") ||
			src.includes("gclid") ||
			src.includes("ads") ||
			src.includes("facebook") ||
			src.includes("instagram")
		) {
			detail.lead_source = lead.source;
			return { source: "paid_ads", detail };
		}
	}

	// 4. Default to organic
	detail.reason = "no_matching_attribution_signal";
	return { source: "organic", detail };
}

/**
 * Save attribution and send Meta CAPI event with correct action_source.
 */
async function sendAttributedConversion(attribution, lead, conversion, tenant) {
	const rules = mergeRules(tenant.conversionRules);
	const sourceConfig =
		rules.sources?.[attribution.source] || rules.sources?.organic;

	const eventName = sourceConfig?.meta_event || "Purchase";
	const actionSource = sourceConfig?.action_source || "website";

	// Save attribution (idempotent via UNIQUE on conversion_id)
	const { rows } = await pool.query(
		`INSERT INTO conversion_attributions
       (tenant_id, conversion_id, lead_id, conversation_id, attribution_source, detail)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (conversion_id) DO NOTHING
     RETURNING id`,
		[
			tenant.id,
			conversion.id,
			lead.id,
			attribution.detail.conversation_id || null,
			attribution.source,
			JSON.stringify(attribution.detail),
		],
	);

	// If already attributed (conflict), skip sending
	if (!rows[0]) {
		logger.info("chatwoot_agent: conversion already attributed, skipping", {
			conversion_id: conversion.id,
		});
		return;
	}

	const attributionId = rows[0].id;

	// Send Meta CAPI with attributed action_source
	const result = await sendEvent(
		eventName,
		lead,
		{
			eventId: `attr_${conversion.id}_${attribution.source}`,
			eventTime: Math.floor(new Date(conversion.created_at).getTime() / 1000),
			conversionId: conversion.id,
			actionSource,
			customData: buildCustomData(eventName, conversion, {}),
		},
		tenant,
	);

	// Mark as sent if successful
	if (result?.success) {
		await pool.query(
			`UPDATE conversion_attributions
       SET meta_event_sent = TRUE, meta_event_id = $2
       WHERE id = $1`,
			[attributionId, result.eventId],
		);
	}

	logger.info("chatwoot_agent: attributed conversion sent", {
		tenant: tenant.slug,
		conversion_id: conversion.id,
		source: attribution.source,
		action_source: actionSource,
		meta_success: result?.success,
	});
}

/**
 * Update Chatwoot contact with attribution labels.
 */
async function updateChatwootContactAttribution(lead, attribution, tenant) {
	const rules = mergeRules(tenant.conversionRules);
	const sourceConfig = rules.sources?.[attribution.source];
	const labelsToAdd = sourceConfig?.labels || [];

	if (!lead.chatwoot_contact_id || labelsToAdd.length === 0) return;

	try {
		// Fetch current labels
		const labelRes = await fetch(
			chatwootUrl(`/contacts/${lead.chatwoot_contact_id}/labels`, tenant),
			{ headers: chatwootHeaders(tenant) },
		);

		let currentLabels = [];
		if (labelRes.ok) {
			const data = await labelRes.json();
			currentLabels = data.payload || [];
		}

		const updatedLabels = [
			...currentLabels,
			...labelsToAdd.filter((l) => !currentLabels.includes(l)),
		];

		await fetch(
			chatwootUrl(`/contacts/${lead.chatwoot_contact_id}/labels`, tenant),
			{
				method: "POST",
				headers: chatwootHeaders(tenant),
				body: JSON.stringify({ labels: updatedLabels }),
			},
		);

		// Update custom_attributes with attribution info
		await fetch(chatwootUrl(`/contacts/${lead.chatwoot_contact_id}`, tenant), {
			method: "PATCH",
			headers: chatwootHeaders(tenant),
			body: JSON.stringify({
				custom_attributes: {
					attribution_source: attribution.source,
					attribution_date: new Date().toISOString(),
				},
			}),
		});
	} catch (err) {
		logger.warn("chatwoot_agent: failed to update contact labels", {
			tenant: tenant.slug,
			contact_id: lead.chatwoot_contact_id,
			error: err.message,
		});
	}
}

/**
 * Run the agent for a single tenant.
 * Fetches conversations, filters for new ones (id > cursor), matches leads,
 * classifies attribution, sends events.
 *
 * Chatwoot returns conversations sorted by last_activity_at desc, so we page
 * through until we've seen all conversations with id > cursor. We stop when
 * an entire page has no new conversations (all ids <= cursor).
 */
async function runAgentForTenant(tenant) {
	const cursor = await getCursor(tenant.id);
	const rules = mergeRules(tenant.conversionRules);
	const windowHours = rules.attribution_window_hours || 72;
	let lastId = cursor.last_processed_id;
	let totalProcessed = 0;
	let page = 1;
	const MAX_PAGES = 20; // safety limit

	while (page <= MAX_PAGES) {
		const { conversations, hasMore } = await fetchConversationPage(
			tenant,
			page,
		);

		if (conversations.length === 0) break;

		// Filter for conversations newer than our cursor
		const newConversations = conversations.filter(
			(c) => c.id > cursor.last_processed_id,
		);

		for (const conversation of newConversations) {
			await sleep(RATE_LIMIT_MS);

			const lead = await findLeadForConversation(conversation, tenant.id);
			if (!lead) continue;

			const unattributed = await findUnattributedConversions(
				lead.id,
				windowHours,
			);
			if (unattributed.length === 0) continue;

			for (const conversion of unattributed) {
				const attribution = await classifyAttribution(
					conversation,
					lead,
					conversion,
					tenant,
				);
				await sendAttributedConversion(attribution, lead, conversion, tenant);
				await updateChatwootContactAttribution(lead, attribution, tenant);
				totalProcessed++;
			}

			if (conversation.id > lastId) {
				lastId = conversation.id;
			}
		}

		// If no new conversations on this page, all remaining pages are older — stop
		if (newConversations.length === 0) break;
		if (!hasMore) break;
		page++;
	}

	if (lastId > cursor.last_processed_id) {
		await advanceCursor(tenant.id, lastId, totalProcessed);
	}

	return { tenant: tenant.slug, processed: totalProcessed, lastId };
}

/**
 * Main entry point — run the agent for all enabled tenants.
 * Called by setInterval in index.js.
 */
async function runAgentForAllTenants() {
	if (isRunning) {
		logger.warn("chatwoot_agent: previous run still active, skipping");
		return;
	}

	isRunning = true;
	const startTime = Date.now();
	const results = [];

	try {
		const tenants = getAllTenants().filter((t) => t.agent_enabled);

		if (tenants.length === 0) {
			lastRunStats = {
				tenants: 0,
				duration_ms: 0,
				ran_at: new Date().toISOString(),
			};
			return;
		}

		logger.info("chatwoot_agent: starting run", {
			tenant_count: tenants.length,
		});

		for (const tenant of tenants) {
			try {
				const result = await runAgentForTenant(tenant);
				results.push(result);
			} catch (err) {
				logger.error("chatwoot_agent: tenant run failed", {
					tenant: tenant.slug,
					error: err.message,
				});
				results.push({ tenant: tenant.slug, error: err.message });
			}
		}

		const durationMs = Date.now() - startTime;
		lastRunStats = {
			tenants: tenants.length,
			results,
			duration_ms: durationMs,
			ran_at: new Date().toISOString(),
		};

		logger.info("chatwoot_agent: run completed", {
			tenants: tenants.length,
			duration_ms: durationMs,
			results,
		});
	} finally {
		isRunning = false;
	}
}

/**
 * Trigger the agent for a specific tenant by slug.
 */
async function triggerAgentForTenant(slug) {
	const { getTenantBySlug } = require("../config/tenantStore");
	const tenant = getTenantBySlug(slug);
	if (!tenant) throw new Error(`Tenant not found: ${slug}`);
	return runAgentForTenant(tenant);
}

/**
 * Get agent status for health/admin endpoints.
 */
function getAgentStatus() {
	return {
		is_running: isRunning,
		last_run: lastRunStats,
	};
}

module.exports = {
	runAgentForAllTenants,
	triggerAgentForTenant,
	getAgentStatus,
};
