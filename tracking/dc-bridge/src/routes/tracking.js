const express = require("express");
const pool = require("../db/pool");
const logger = require("../utils/logger");
const { sendLead } = require("../services/metaCapi");
const { getTenantBySlug } = require("../config/tenantStore");

const router = express.Router();

// CORS middleware for tracking routes (called cross-origin from site)
router.use("/track", (req, res, next) => {
  const origin = req.headers.origin || "";
  const allowed = [
    "carolinemoschei.com",
    "www.carolinemoschei.com",
  ];
  if (allowed.some((d) => origin.includes(d)) || !origin) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

/**
 * POST /track/event
 * Receives frontend events (Lead, ViewContent, etc.) and forwards to Meta CAPI.
 * Also stores fbc/fbp on the lead record for future Hotmart webhook events.
 *
 * Replaces the old Vercel-based /api/meta-orcamentos endpoint.
 *
 * Body: { event_id, event_name, event_source_url, attribution, fbc, fbp, email?, tenant_slug? }
 */
router.post("/track/event", async (req, res) => {
  const {
    event_id: eventId,
    event_name: eventName = "Lead",
    event_source_url: eventSourceUrl,
    attribution = {},
    fbc,
    fbp,
    email,
    tenant_slug: tenantSlug,
  } = req.body || {};

  const tenant = tenantSlug ? getTenantBySlug(tenantSlug) : null;

  const clientUserAgent = req.headers["user-agent"] || "";
  const forwardedFor = req.headers["x-forwarded-for"] || "";
  const clientIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor).split(",")[0].trim();

  // Build a minimal lead-like object for metaCapi.sendLead
  const leadData = { email: email || null };

  try {
    const result = await sendLead(leadData, {
      eventId,
      sourceUrl: eventSourceUrl,
      fbc: fbc || undefined,
      fbp: fbp || undefined,
      clientIp: clientIp || undefined,
      clientUserAgent: clientUserAgent || undefined,
      source: attribution.utm_source || "website",
      value: attribution.value || 0,
      currency: attribution.currency || "BRL",
      customData: { ...attribution },
    }, tenant);

    // Store fbc/fbp on the lead record (if email is known)
    if (email && (fbc || fbp)) {
      try {
        const updates = [];
        const values = [];
        let idx = 1;
        if (fbc) { updates.push(`fbc = $${idx++}`); values.push(fbc); }
        if (fbp) { updates.push(`fbp = $${idx++}`); values.push(fbp); }
        values.push(email.toLowerCase().trim());
        await pool.query(
          `UPDATE leads SET ${updates.join(", ")}, updated_at = NOW() WHERE LOWER(email) = $${idx}`,
          values
        );
      } catch (dbErr) {
        logger.error("Failed to store fbc/fbp on lead", { error: dbErr.message });
      }
    }

    res.status(200).json({ ok: true, result });
  } catch (err) {
    logger.error("Track event failed", { error: err.message, event_name: eventName });
    res.status(200).json({ ok: false, error: err.message });
  }
});

/**
 * POST /track/fbc
 * Lightweight endpoint — just stores fbc/fbp on an existing lead by email.
 * Use when fbc/fbp becomes available after the initial Lead event.
 *
 * Body: { email, fbc, fbp }
 */
router.post("/track/fbc", async (req, res) => {
  const { email, fbc, fbp } = req.body || {};

  if (!email || (!fbc && !fbp)) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    const updates = [];
    const values = [];
    let idx = 1;

    if (fbc) { updates.push(`fbc = $${idx++}`); values.push(fbc); }
    if (fbp) { updates.push(`fbp = $${idx++}`); values.push(fbp); }
    values.push(email.toLowerCase().trim());

    const result = await pool.query(
      `UPDATE leads SET ${updates.join(", ")}, updated_at = NOW() WHERE LOWER(email) = $${idx}`,
      values
    );

    logger.info("fbc/fbp updated on lead", {
      email: email.substring(0, 3) + "***",
      rows_updated: result.rowCount,
      has_fbc: !!fbc,
      has_fbp: !!fbp,
    });

    res.status(200).json({ ok: true, updated: result.rowCount });
  } catch (err) {
    logger.error("Failed to update fbc/fbp", { error: err.message });
    res.status(200).json({ ok: false });
  }
});

module.exports = router;
