const HOTMART_EVENTS = {
  PURCHASE_COMPLETE: "purchase_complete",
  PURCHASE_APPROVED: "purchase_approved",
  PURCHASE_REFUNDED: "purchase_refunded",
  PURCHASE_CANCELED: "purchase_canceled",
  PURCHASE_CHARGEBACK: "purchase_chargeback",
  PURCHASE_DISPUTE: "purchase_dispute",
  PURCHASE_BILLET_PRINTED: "purchase_billet_printed",
  PURCHASE_WAITING_PAYMENT: "purchase_waiting_payment",
  PURCHASE_PIX_WAITING: "purchase_pix_waiting",
  PURCHASE_OUT_OF_SHOPPING_CART: "purchase_out_of_shopping_cart",
  ABANDONED_CART: "abandoned_cart",
  SUBSCRIPTION_CANCELLATION: "subscription_cancellation",
  SUBSCRIPTION_REACTIVATION: "subscription_reactivation",
  PURCHASE_DELAYED: "purchase_delayed",
  PURCHASE_PROTEST: "purchase_protest",
  PURCHASE_STATUS_CHANGED: "purchase_status_changed",
};

function categorizeEvent(event) {
  const e = (event || "").toLowerCase();
  if (["purchase_complete", "purchase_approved"].includes(e)) return "PURCHASE";
  if (["purchase_refunded", "purchase_canceled"].includes(e)) return "REFUND";
  if (["purchase_chargeback", "purchase_dispute"].includes(e)) return "CHARGEBACK";
  if (["purchase_delayed", "purchase_protest"].includes(e)) return "DELAYED";
  if (["purchase_billet_printed", "purchase_waiting_payment", "purchase_pix_waiting"].includes(e)) return "WAITING_PAYMENT";
  if (["purchase_out_of_shopping_cart", "abandoned_cart"].includes(e)) return "ABANDONED";
  if (["subscription_cancellation"].includes(e)) return "SUBSCRIPTION_CANCEL";
  if (["subscription_reactivation"].includes(e)) return "SUBSCRIPTION_REACTIVATE";
  return "OTHER";
}

function extractHotmartData(body) {
  // Formato novo (v2) com body.data
  if (body.data) {
    const data = body.data;
    const buyer = data.buyer || {};
    const product = data.product || {};
    const purchase = data.purchase || {};
    const subscription = data.subscription || {};
    const producer = data.producer || {};

    // UTM / Tracking - a Hotmart envia src e sck no nível raiz ou dentro de data
    const src = data.src || body.src || "";
    const sck = data.sck || body.sck || "";

    // Alguns payloads trazem utm_source dentro de purchase ou como query params
    const utmSource = data.utm_source || purchase.utm_source || src || "";
    const utmMedium = data.utm_medium || purchase.utm_medium || "";
    const utmCampaign = data.utm_campaign || purchase.utm_campaign || sck || "";
    const utmContent = data.utm_content || purchase.utm_content || "";
    const utmTerm = data.utm_term || purchase.utm_term || "";

    return {
      event: body.event || data.status || "",
      buyer: {
        email: buyer.email || "",
        name: buyer.name || "",
        firstName: (buyer.name || "").split(" ")[0] || "",
        lastName: (buyer.name || "").split(" ").slice(1).join(" ") || "",
        phone: buyer.checkout_phone || buyer.phone || "",
        document: buyer.document || "",
        address: buyer.address || {},
      },
      product: {
        id: product.id || product.ucode || "",
        name: product.name || "",
        ucode: product.ucode || "",
      },
      purchase: {
        transaction: purchase.transaction || "",
        status: purchase.status || "",
        price: purchase.price || purchase.original_offer_price || 0,
        currency: purchase.payment?.currency_value || "BRL",
        paymentMethod: purchase.payment?.type || "",
        paymentType: purchase.payment?.method || "",
        offerCode: purchase.offer?.code || "",
        orderId: purchase.order_date || "",
        approvedDate: purchase.approved_date || "",
        warranty_expire_date: purchase.warranty_expire_date || "",
        recurrence_number: purchase.recurrence_number || 0,
        is_subscription: !!subscription.plan,
        installments: purchase.payment?.installments_number || 1,
      },
      tracking: {
        src: src,
        sck: sck,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
      },
      subscription: {
        plan: subscription.plan?.name || "",
        status: subscription.status || "",
        subscriberCode: subscription.subscriber?.code || "",
      },
      producer: { name: producer.name || "" },
      raw: body,
    };
  }

  // Formato legado (v1)
  const src = body.src || "";
  const sck = body.sck || "";

  return {
    event: body.event || body.status || "",
    buyer: {
      email: body.email || body.buyer_email || "",
      name: body.name || body.buyer_name || "",
      firstName: (body.name || body.buyer_name || "").split(" ")[0] || "",
      lastName: (body.name || body.buyer_name || "").split(" ").slice(1).join(" ") || "",
      phone: body.phone || body.phone_number || "",
      document: body.doc || "",
      address: {},
    },
    product: {
      id: body.prod || body.product_id || "",
      name: body.prod_name || body.product_name || "",
      ucode: body.product_ucode || "",
    },
    purchase: {
      transaction: body.transaction || body.trans || "",
      status: body.status || "",
      price: body.price || body.purchase_price || 0,
      currency: body.currency || "BRL",
      paymentMethod: body.payment_type || "",
      paymentType: body.payment_method || "",
      offerCode: body.off || "",
      orderId: "",
      approvedDate: "",
      is_subscription: false,
      installments: body.installments_number || 1,
    },
    tracking: {
      src: src,
      sck: sck,
      utm_source: src,
      utm_medium: "",
      utm_campaign: sck,
      utm_content: "",
      utm_term: "",
    },
    subscription: { plan: "", status: "", subscriberCode: "" },
    producer: { name: "" },
    raw: body,
  };
}

module.exports = { HOTMART_EVENTS, categorizeEvent, extractHotmartData };
