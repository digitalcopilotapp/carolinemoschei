const LOCK_TIME_SECONDS = 20 * 60;
const PIX_API_ENDPOINT = "https://pixgo.org/api/v1/payment/create";
const PIX_API_KEY = "pk_8f1b009da7b63f74bb219a246c5d0c83b47b7f3499119bc0514334e3bb8b4a56";
const ORIGINAL_PRICE = 497.0;
const DISCOUNTED_PRICE = Number((ORIGINAL_PRICE * 0.2).toFixed(2));
const STRIPE_BACKEND_URL = "http://localhost:4242/create-checkout-session";

const state = {
  unlocked: localStorage.getItem("myoakUnlocked") === "true",
  contact: JSON.parse(localStorage.getItem("myoakContact") || "{}"),
  player: null,
  overlayShown: false,
  pixData: null,
};

const unlockOverlay = document.getElementById("unlockOverlay");
const unlockForm = document.getElementById("unlockForm");
const checkoutFlow = document.getElementById("checkoutFlow");
const stepPanels = document.querySelectorAll("[data-step-panel]");
const stepIndicators = document.querySelectorAll("[data-step-indicator]");
const proceedButton = document.getElementById("proceedToPayment");
const backToPayment = document.getElementById("backToPayment");
const pixButton = document.getElementById("pixButton");
const stripeButton = document.getElementById("stripeButton");
const toast = document.getElementById("toast");
const pixResult = document.getElementById("pixResult");
const pixQrImage = document.getElementById("pixQrImage");
const pixExpiration = document.getElementById("pixExpiration");
const pixCodeArea = document.getElementById("pixCode");
const copyPixButton = document.getElementById("copyPixCode");
const pixPriceLabel = document.getElementById("pixPrice");
const whatsappInput = document.getElementById("whatsapp");
const emailInput = document.getElementById("email");
const nameInput = document.getElementById("fullName");
const summaryName = document.getElementById("summaryName");
const summaryPhone = document.getElementById("summaryPhone");
const summaryEmail = document.getElementById("summaryEmail");
const stripeStatus = document.getElementById("stripeStatus");
const unlockStepsPanels = document.querySelectorAll("[data-unlock-step]");
const unlockIndicators = document.querySelectorAll("[data-unlock-indicator]");
const unlockNext = document.getElementById("unlockNext");
const unlockBack = document.getElementById("unlockBack");
const unlockSubmit = document.getElementById("unlockSubmit");
const unlockSummaryName = document.getElementById("unlockSummaryName");
const unlockSummaryPhone = document.getElementById("unlockSummaryPhone");
const unlockSummaryEmail = document.getElementById("unlockSummaryEmail");
let currentUnlockStep = 1;

if (pixPriceLabel) {
  pixPriceLabel.textContent = `R$ ${DISCOUNTED_PRICE.toFixed(2).replace(".", ",")}`;
}

prefillContactFields();
setUnlockStep(1);

if (state.unlocked) {
  checkoutFlow?.classList.remove("hidden");
  setStep(1);
  populateSummary();
}

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  state.player = new YT.Player("secretPlayer", {
    videoId: "bHnDKwd8oDw",
    playerVars: {
      rel: 0,
      modestbranding: 1,
      color: "white",
      playsinline: 1,
    },
    events: {
      onReady: handlePlayerReady,
      onStateChange: handleStateChange,
    },
  });
};

function handlePlayerReady() {
  if (state.unlocked) {
    checkoutFlow?.classList.remove("hidden");
    setStep(1);
  }
  startWatcher();
}

function handleStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    startWatcher();
  }
}

let watcherInterval = null;
function startWatcher() {
  if (watcherInterval) return;
  watcherInterval = setInterval(() => {
    if (!state.player || typeof state.player.getCurrentTime !== "function") return;
    const currentTime = state.player.getCurrentTime();
    if (!state.unlocked && currentTime >= LOCK_TIME_SECONDS) {
      pauseAndLock();
    }
  }, 1000);
}

function pauseAndLock() {
  if (state.overlayShown) return;
  state.player?.pauseVideo();
  unlockOverlay?.classList.remove("hidden");
  state.overlayShown = true;
  setUnlockStep(1);
}

function hideOverlay() {
  unlockOverlay?.classList.add("hidden");
  state.overlayShown = false;
  setUnlockStep(1);
}

unlockNext?.addEventListener("click", () => {
  if (currentUnlockStep === 1) {
    if (!nameInput.value.trim()) {
      showToast("Informe seu nome para avançar", true);
      return;
    }
    setUnlockStep(2);
    return;
  }
  if (currentUnlockStep === 2) {
    const digits = normalisePhone(whatsappInput.value).replace(/\D/g, "");
    if (digits.length < 12) {
      showToast("Digite um WhatsApp válido", true);
      return;
    }
    updateUnlockSummary();
    setUnlockStep(3);
  }
});

unlockBack?.addEventListener("click", () => {
  if (currentUnlockStep === 1) return;
  setUnlockStep(currentUnlockStep - 1);
});

unlockForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const fullName = nameInput.value.trim();
  const phone = normalisePhone(whatsappInput.value);
  const email = emailInput.value.trim();

  if (!fullName || phone.length < 12) {
    showToast("Preencha nome e telefone válidos", true);
    return;
  }

  state.contact = { name: fullName, phone, email };
  localStorage.setItem("myoakContact", JSON.stringify(state.contact));
  state.unlocked = true;
  localStorage.setItem("myoakUnlocked", "true");

  hideOverlay();
  checkoutFlow?.classList.remove("hidden");
  populateSummary();
  setStep(1);
  showToast("Acesso liberado. Continue assistindo!", false);
  state.player?.playVideo();
});

whatsappInput?.addEventListener("input", (event) => {
  const input = event.target;
  input.value = formatPhone(input.value);
});

proceedButton?.addEventListener("click", () => {
  if (!ensureContact()) {
    showToast("Confirme seus dados para avançar", true);
    pauseAndLock();
    return;
  }
  populateSummary();
  setStep(2);
});

backToPayment?.addEventListener("click", () => {
  resetCheckout();
  setStep(2);
});

pixButton?.addEventListener("click", async () => {
  if (!ensureContact()) {
    showToast("Informe seus dados para gerar o PIX", true);
    pauseAndLock();
    return;
  }
  await createPixPayment();
});

copyPixButton?.addEventListener("click", async () => {
  if (!state.pixData) return;
  try {
    await navigator.clipboard.writeText(state.pixData.qr_code);
    showToast("Código PIX copiado", false);
  } catch (error) {
    pixCodeArea.classList.remove("hidden");
    pixCodeArea.value = state.pixData.qr_code;
    pixCodeArea.select();
    document.execCommand("copy");
    pixCodeArea.classList.add("hidden");
    showToast("Código copiado", false);
  }
});

stripeButton?.addEventListener("click", async () => {
  if (!ensureContact()) {
    showToast("Informe seus dados para liberar o checkout", true);
    pauseAndLock();
    return;
  }
  setStep(3);
  stripeStatus?.classList.remove("hidden");
  stripeStatus.textContent = "Redirecionando para o checkout seguro da Stripe...";
  await redirectToStripe();
});

function ensureContact() {
  return Boolean(state.contact?.name && state.contact?.phone);
}

function populateSummary() {
  if (!state.contact) return;
  if (summaryName) summaryName.textContent = state.contact.name || "—";
  if (summaryPhone) summaryPhone.textContent = state.contact.phone ? formatPhone(state.contact.phone) : "—";
  if (summaryEmail) summaryEmail.textContent = state.contact.email || "—";
}

function resetCheckout() {
  pixResult?.classList.add("hidden");
  stripeStatus?.classList.add("hidden");
  stripeStatus && (stripeStatus.textContent = "");
}

function setStep(step) {
  stepIndicators.forEach((indicator) => {
    indicator.classList.toggle("is-active", indicator.dataset.stepIndicator === String(step));
  });
  stepPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.stepPanel === String(step));
  });
}

function setUnlockStep(step) {
  currentUnlockStep = Math.max(1, Math.min(step, 3));
  unlockStepsPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.unlockStep === String(currentUnlockStep));
  });
  unlockIndicators.forEach((indicator) => {
    indicator.classList.toggle("is-active", indicator.dataset.unlockIndicator === String(currentUnlockStep));
  });
  if (currentUnlockStep === 1) {
    unlockBack?.classList.add("hidden");
    unlockNext?.classList.remove("hidden");
    unlockSubmit?.classList.add("hidden");
  } else if (currentUnlockStep === 2) {
    unlockBack?.classList.remove("hidden");
    unlockNext?.classList.remove("hidden");
    unlockSubmit?.classList.add("hidden");
  } else {
    unlockBack?.classList.remove("hidden");
    unlockNext?.classList.add("hidden");
    unlockSubmit?.classList.remove("hidden");
    updateUnlockSummary();
  }
}

function updateUnlockSummary() {
  if (unlockSummaryName) unlockSummaryName.textContent = nameInput.value.trim() || "—";
  if (unlockSummaryPhone) unlockSummaryPhone.textContent = whatsappInput.value.trim() || "—";
  if (unlockSummaryEmail) unlockSummaryEmail.textContent = emailInput.value.trim() || "—";
}

async function createPixPayment() {
  showToast("⚠️ Oferta digital sem estorno. Gerando PIX...", false);
  resetCheckout();
  setStep(3);
  toggleLoading(pixButton, true);
  try {
    const response = await fetch(PIX_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PIX_API_KEY,
      },
      body: JSON.stringify({
        amount: DISCOUNTED_PRICE,
        description: "ManifestAI + Protocolo Lei da Atração",
        customer_name: state.contact.name,
        customer_phone: state.contact.phone,
        customer_email: state.contact.email || undefined,
        external_id: `myoak_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "Erro ao gerar pagamento PIX");
    }

    const { data } = await response.json();
    state.pixData = data;
    renderPixResult(data);
    showToast("PIX gerado com sucesso!", false);
  } catch (error) {
    console.error(error);
    showToast("Não foi possível gerar o PIX", true);
    setStep(2);
  } finally {
    toggleLoading(pixButton, false);
  }
}

function renderPixResult(data) {
  if (!pixResult) return;
  pixResult.classList.remove("hidden");
  stripeStatus?.classList.add("hidden");
  if (pixQrImage) {
    pixQrImage.src = data.qr_image_url;
  }
  if (pixExpiration) {
    const expires = new Date(data.expires_at);
    pixExpiration.textContent = `Expira em ${expires.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  if (pixCodeArea) {
    pixCodeArea.value = data.qr_code;
  }
}

async function redirectToStripe() {
  toggleLoading(stripeButton, true);
  try {
    const response = await fetch(STRIPE_BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: DISCOUNTED_PRICE,
        customer: state.contact,
      }),
    });
    if (!response.ok) {
      throw new Error("Erro ao iniciar checkout");
    }
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("Checkout indisponível");
    }
  } catch (error) {
    console.error(error);
    showToast("Checkout indisponível. Verifique o servidor Stripe.", true);
    setStep(2);
  } finally {
    toggleLoading(stripeButton, false);
  }
}

function toggleLoading(button, loading) {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = "Processando...";
    button.disabled = true;
    button.classList.add("is-loading");
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove("is-loading");
  }
}

function showToast(message, isError) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("toast--error", Boolean(isError));
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const trimmed = withCountry.slice(0, 13);
  return trimmed
    .replace(/^55(\d{2})(\d{5})(\d{4}).*/, "+55 ($1) $2-$3")
    .replace(/^55(\d{2})(\d{4})(\d{0,4})$/, "+55 ($1) $2-$3")
    .replace(/^55(\d{0,2})$/, "+55 ($1")
    .replace(/\(\)$/, "")
    .replace(/\-$/, "");
}

function normalisePhone(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

function prefillContactFields() {
  if (state.contact?.phone) {
    whatsappInput.value = formatPhone(state.contact.phone);
  }
  if (state.contact?.name) {
    nameInput.value = state.contact.name;
  }
  if (state.contact?.email) {
    emailInput.value = state.contact.email;
  }
  updateUnlockSummary();
}

window.addEventListener("online", () => showToast("Conexão restaurada", false));
window.addEventListener("offline", () => showToast("Você está offline", true));

[nameInput, whatsappInput, emailInput].forEach((field) => {
  field?.addEventListener("input", () => {
    updateUnlockSummary();
  });
});
