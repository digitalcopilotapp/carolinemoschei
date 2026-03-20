const crypto = require("node:crypto");

/**
 * SHA256 hash for Meta CAPI PII fields.
 * Returns null if value is falsy.
 */
function sha256(value) {
  if (!value) return null;
  return crypto
    .createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex");
}

module.exports = { sha256 };
