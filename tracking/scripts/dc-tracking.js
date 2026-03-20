/**
 * Digital Copilot — WordPress Tracking Helper
 * Instalar em cada site WordPress via GTM Custom HTML ou diretamente no tema.
 *
 * Funcoes:
 * 1. Gera event_id unico para deduplicacao Pixel ↔ CAPI
 * 2. Persiste email/phone capturado em formularios (localStorage)
 * 3. Enriquece links de checkout Hotmart com dados do lead
 * 4. Dispara eventos DataLayer para GTM
 */
(function () {
  'use strict';

  var DC = window.DC_Tracking || {};
  window.DC_Tracking = DC;
  window.dataLayer = window.dataLayer || [];

  // =========================================================================
  // Utilidades
  // =========================================================================

  DC.generateEventId = function (eventName) {
    var ts = Date.now();
    var rand = Math.random().toString(36).substring(2, 10);
    return eventName + '_' + ts + '_' + rand;
  };

  DC.getStoredUserData = function () {
    return {
      email: localStorage.getItem('dc_lead_email') || undefined,
      phone: localStorage.getItem('dc_lead_phone') || undefined,
      first_name: localStorage.getItem('dc_lead_name') || undefined
    };
  };

  DC.storeUserData = function (data) {
    if (data.email) localStorage.setItem('dc_lead_email', data.email);
    if (data.phone) localStorage.setItem('dc_lead_phone', data.phone);
    if (data.name) localStorage.setItem('dc_lead_name', data.name);
  };

  // =========================================================================
  // Eventos
  // =========================================================================

  /**
   * ViewContent — chamar em paginas de produto/oferta
   * Uso: DC_Tracking.viewContent({ name: 'Curso X', id: '123', value: 297 })
   */
  DC.viewContent = function (product) {
    var eventId = DC.generateEventId('ViewContent');
    dataLayer.push({
      event: 'view_content',
      event_id: eventId,
      content_name: product.name || '',
      content_id: product.id || '',
      content_type: 'product',
      content_category: product.category || 'curso',
      value: product.value || 0,
      currency: product.currency || 'BRL',
      user_data: DC.getStoredUserData()
    });
  };

  /**
   * Lead — chamar apos captura de email em formulario
   * Uso: DC_Tracking.lead({ email: 'x@y.com', phone: '+55...', name: 'Nome', source: 'popup' })
   */
  DC.lead = function (data) {
    DC.storeUserData(data);

    var eventId = DC.generateEventId('Lead');
    dataLayer.push({
      event: 'generate_lead',
      event_id: eventId,
      content_name: data.source || 'lead_capture',
      user_data: {
        email: data.email,
        phone: data.phone || undefined,
        first_name: data.name || undefined
      }
    });
  };

  /**
   * InitiateCheckout — chamado automaticamente ao clicar em links Hotmart
   * Tambem pode ser chamado manualmente:
   * DC_Tracking.initiateCheckout({ name: 'Curso X', id: '123', value: 297, url: 'https://pay.hotmart.com/...' })
   */
  DC.initiateCheckout = function (product) {
    var eventId = DC.generateEventId('InitiateCheckout');
    dataLayer.push({
      event: 'begin_checkout',
      event_id: eventId,
      content_name: product.name || '',
      content_id: product.id || '',
      content_type: 'product',
      value: product.value || 0,
      currency: product.currency || 'BRL',
      user_data: DC.getStoredUserData()
    });
  };

  // =========================================================================
  // Enriquecimento de Links Hotmart
  // =========================================================================

  DC.enrichHotmartUrl = function (baseUrl) {
    try {
      var url = new URL(baseUrl);
      var userData = DC.getStoredUserData();

      if (userData.email) url.searchParams.set('email', userData.email);
      if (userData.phone) url.searchParams.set('phone', userData.phone);
      if (userData.first_name) url.searchParams.set('name', userData.first_name);

      // Passar UTMs da URL atual
      var params = new URLSearchParams(window.location.search);
      var utmSource = params.get('utm_source');
      var utmCampaign = params.get('utm_campaign');
      if (utmSource) url.searchParams.set('src', utmSource);
      if (utmCampaign) url.searchParams.set('sck', utmCampaign);

      return url.toString();
    } catch (e) {
      return baseUrl;
    }
  };

  // =========================================================================
  // Auto-setup: interceptar cliques em links Hotmart
  // =========================================================================

  function setupHotmartLinks() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href*="pay.hotmart.com"], a[href*="hotmart.com/product"]');
      if (!link) return;

      e.preventDefault();

      // Disparar InitiateCheckout
      DC.initiateCheckout({
        name: link.dataset.productName || link.textContent.trim().substring(0, 50) || 'Produto',
        id: link.dataset.productId || '',
        value: parseFloat(link.dataset.price) || 0,
        currency: 'BRL',
        url: link.href
      });

      // Enriquecer URL e redirecionar (delay para o evento ser enviado)
      var enrichedUrl = DC.enrichHotmartUrl(link.href);
      setTimeout(function () {
        window.location.href = enrichedUrl;
      }, 300);
    });
  }

  // =========================================================================
  // Inicializacao
  // =========================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHotmartLinks);
  } else {
    setupHotmartLinks();
  }
})();
