/**
 * WhatsApp template mapping per Hotmart event type.
 * Template names must match those approved in Meta Business Suite.
 */

const WHATSAPP_TEMPLATES = {
  PURCHASE_APPROVED: {
    templateName: "purchase_confirmed",
    buildParams: (lead, meta) => ({
      product_name: meta.product || "seu produto",
      access_link: meta.accessLink || "",
    }),
  },
  PURCHASE_REFUNDED: {
    templateName: "refund_response",
    buildParams: () => ({}),
  },
  CART_ABANDONMENT: {
    templateName: "cart_abandoned",
    buildParams: (lead, meta) => ({
      product_name: meta.product || "seu produto",
      discount_link: meta.discountLink || "",
    }),
  },
  SUBSCRIPTION_CANCELLATION: {
    templateName: "subscription_canceled",
    buildParams: () => ({
      offer_link: "",
    }),
  },
};

module.exports = { WHATSAPP_TEMPLATES };
