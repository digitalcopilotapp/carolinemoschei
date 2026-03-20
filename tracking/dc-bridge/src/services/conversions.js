const pool = require("../db/pool");
const logger = require("../utils/logger");

/**
 * Record a conversion from a Hotmart purchase event.
 * Idempotent: duplicate hotmart_tx_id is silently ignored.
 */
async function recordConversion(leadId, hotmartData, tenant) {
  const txId =
    hotmartData.transaction ||
    hotmartData.purchase?.transaction ||
    hotmartData.transaction_id;

  if (!txId) throw new Error("Missing Hotmart transaction ID");

  const product =
    hotmartData.product?.name ||
    hotmartData.prod?.name ||
    hotmartData.product_name ||
    "Unknown";
  const amount = parseFloat(
    hotmartData.purchase?.price?.value ||
      hotmartData.price?.value ||
      hotmartData.amount ||
      0
  );
  const currency =
    hotmartData.purchase?.price?.currency_code ||
    hotmartData.currency ||
    "BRL";
  const paymentMethod =
    hotmartData.purchase?.payment?.type || hotmartData.payment_type || null;
  const tenantId = tenant?.id || null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO conversions (tenant_id, lead_id, product, amount, currency, status, payment_method, hotmart_tx_id, event_id)
       VALUES ($1, $2, $3, $4, $5, 'approved', $6, $7, $7)
       ON CONFLICT (hotmart_tx_id) DO NOTHING
       RETURNING *`,
      [tenantId, leadId, product, amount, currency, paymentMethod, txId]
    );

    if (rows.length === 0) {
      logger.info("Duplicate conversion ignored", { hotmart_tx_id: txId });
      return null;
    }

    logger.info("Conversion recorded", {
      tenant: tenant?.slug,
      conversion_id: rows[0].id,
      hotmart_tx_id: txId,
      product,
      amount,
    });
    return rows[0];
  } catch (err) {
    logger.error("Failed to record conversion", {
      error: err.message,
      hotmart_tx_id: txId,
    });
    throw err;
  }
}

/**
 * Update a conversion status (e.g., refunded, canceled).
 */
async function updateConversionStatus(hotmartTxId, status) {
  const { rows } = await pool.query(
    `UPDATE conversions SET status = $1 WHERE hotmart_tx_id = $2 RETURNING *`,
    [status, hotmartTxId]
  );
  if (rows.length > 0) {
    logger.info("Conversion status updated", { hotmart_tx_id: hotmartTxId, status });
  }
  return rows[0] || null;
}

module.exports = { recordConversion, updateConversionStatus };
