/**
 * Structured JSON logger with PII masking.
 */

function maskEmail(email) {
  if (!email) return "[none]";
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user[0]}***@${domain.substring(0, 4)}...`;
}

function maskPhone(phone) {
  if (!phone) return "[none]";
  if (phone.length < 6) return "***";
  return `${phone.substring(0, 4)}***${phone.slice(-2)}`;
}

function log(level, message, meta = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  const out = level === "error" ? process.stderr : process.stdout;
  out.write(JSON.stringify(entry) + "\n");
}

module.exports = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta),
  maskEmail,
  maskPhone,
};
