/**
 * Data normalization utilities for Hotmart webhook payloads.
 */

/**
 * Normalize email: lowercase, trim whitespace.
 */
function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

/**
 * Normalize phone to E.164 format for Brazilian numbers.
 * Accepts various formats: (11)99999-9999, 11999999999, +5511999999999, etc.
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Already has country code
  if (digits.startsWith("55") && digits.length >= 12) {
    return `+${digits}`;
  }

  // Brazilian number without country code
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  // Has some other country code
  if (digits.length > 11) {
    return `+${digits}`;
  }

  return `+55${digits}`;
}

/**
 * Split a full name into first and last name.
 */
function splitName(fullName) {
  if (!fullName) return { firstName: null, lastName: null };
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

module.exports = { normalizeEmail, normalizePhone, splitName };
