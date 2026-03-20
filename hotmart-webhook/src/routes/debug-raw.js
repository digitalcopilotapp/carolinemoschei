// Middleware temporário para logar payload raw
const logger = require("../utils/logger");

function logRawPayload(req, res, next) {
  if (req.path.includes("/webhook/hotmart") && req.method === "POST") {
    const body = req.body || {};
    // Logar campos de tracking
    const data = body.data || {};
    logger.info("RAW TRACKING DEBUG", {
      src_root: body.src || "VAZIO",
      sck_root: body.sck || "VAZIO",
      src_data: data.src || "VAZIO",
      sck_data: data.sck || "VAZIO",
      utm_source: data.utm_source || body.utm_source || "VAZIO",
      utm_campaign: data.utm_campaign || body.utm_campaign || "VAZIO",
      has_purchase_src: !!(data.purchase && data.purchase.src),
      all_root_keys: Object.keys(body).filter(k => k !== "data" && k !== "hottok").join(","),
      all_data_keys: Object.keys(data).join(","),
    });
  }
  next();
}

module.exports = logRawPayload;
