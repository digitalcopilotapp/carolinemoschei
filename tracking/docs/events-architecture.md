# Arquitetura de Eventos — Pre-Checkout + CAPI 100%

## O Problema

O usuario clica no anuncio Meta → chega no WordPress → navega → clica "Comprar" → sai para Hotmart.
Nesse caminho, existem **dois mundos**:

1. **Mundo WordPress** (pre-checkout): voce tem _fbp, _fbc, IP, User-Agent, mas **NAO tem email/telefone**
2. **Mundo Hotmart** (pos-checkout): voce tem email, telefone, nome, mas **NAO tem _fbp/_fbc**

A Meta precisa **conectar os dois mundos** para atribuir a conversao ao anuncio. Quanto mais dados voce enviar em cada evento, maior o EMQ e melhor a atribuicao.

## Solucao: Dados Que Conectam Tudo

| Parametro | Pre-Checkout (WordPress) | Pos-Checkout (Hotmart) | Quem Conecta |
|---|---|---|---|
| **_fbc** (click ID) | Capturado do `fbclid` na URL | NAO disponivel | sGTM captura e envia |
| **_fbp** (browser ID) | Cookie do Pixel | NAO disponivel | sGTM captura e envia |
| **client_ip** | Automatico via sGTM | NAO disponivel | sGTM captura |
| **client_user_agent** | Automatico via sGTM | NAO disponivel | sGTM captura |
| **email** | So se tiver formulario/login | Webhook Hotmart | dc-bridge envia |
| **phone** | So se tiver formulario | Webhook Hotmart | dc-bridge envia |
| **external_id** | Se logado no WP | hotmart_tx_id | Ambos |
| **event_id** | Gerado no DataLayer | hotmart_tx_id (Purchase) | Deduplicacao |

**A chave**: _fbc + _fbp no pre-checkout e email + phone no pos-checkout. A Meta faz o match entre os dois.

## Mapa Completo de Eventos

### Evento 1: PageView

**Quando:** Toda pagina carregada
**Dados disponiveis:** _fbp, _fbc, IP, UA, URL, referrer
**EMQ esperado:** 4-5/10 (sem PII, mas com _fbc e alto)

```javascript
// DataLayer push (automatico via GTM)
dataLayer.push({
  event: 'page_view',
  page_location: window.location.href,
  page_title: document.title,
  content_type: 'page'
});
```

**sGTM Tag Config:**
- Event: PageView
- User Data: _fbp (cookie), _fbc (cookie), client_ip (auto), user_agent (auto)
- Custom Data: page_location, page_title, content_type

---

### Evento 2: ViewContent

**Quando:** Usuario visita pagina de produto/oferta
**Dados disponiveis:** _fbp, _fbc, IP, UA + dados do produto
**EMQ esperado:** 4-5/10

```javascript
// DataLayer push — adicionar no template da pagina de produto (WordPress)
dataLayer.push({
  event: 'view_content',
  content_name: 'Nome do Curso/Produto',
  content_id: 'HOTMART_PRODUCT_ID',
  content_type: 'product',
  content_category: 'curso',
  value: 297.00,
  currency: 'BRL'
});
```

**sGTM Tag Config:**
- Event: ViewContent
- User Data: _fbp, _fbc, client_ip, user_agent
- Custom Data: content_name, content_id, content_type, value, currency

---

### Evento 3: Lead (Captura de Email — CRITICO)

**Quando:** Usuario preenche formulario (isca digital, newsletter, quiz, etc.)
**Dados disponiveis:** _fbp, _fbc, IP, UA + **EMAIL** (e possivelmente telefone!)
**EMQ esperado:** 7-9/10 (com email = salto enorme no EMQ)

```javascript
// DataLayer push — apos submit do formulario
dataLayer.push({
  event: 'generate_lead',
  content_name: 'Lead Magnet - [Nome]',
  user_data: {
    email: 'usuario@email.com',     // TEXTO PLANO — sGTM faz o hash
    phone: '+5511999999999',         // Se disponivel
    first_name: 'Nome',             // Se disponivel
    last_name: 'Sobrenome'          // Se disponivel
  }
});
```

**sGTM Tag Config:**
- Event: Lead
- User Data: em (email do DataLayer, hashed pelo tag), ph, fn, ln, _fbp, _fbc, client_ip, user_agent
- Custom Data: content_name

> **IMPORTANTISSIMO:** Este e o evento mais valioso pre-checkout. Se voce captura o email ANTES do checkout, a Meta consegue fazer match direto entre o Lead e o Purchase posterior. **Isso e o que separa EMQ 5 de EMQ 9.**

---

### Evento 4: InitiateCheckout

**Quando:** Usuario clica no botao de compra (antes de redirecionar para Hotmart)
**Dados disponiveis:** _fbp, _fbc, IP, UA + dados do produto + email (se ja capturado)
**EMQ esperado:** 5-9/10 (depende se tem email)

```javascript
// DataLayer push — no click do botao de compra
dataLayer.push({
  event: 'begin_checkout',
  content_name: 'Nome do Curso/Produto',
  content_id: 'HOTMART_PRODUCT_ID',
  content_type: 'product',
  value: 297.00,
  currency: 'BRL',
  // Se email ja foi capturado (Lead anterior), incluir aqui tambem:
  user_data: {
    email: localStorage.getItem('dc_lead_email') || undefined,
    phone: localStorage.getItem('dc_lead_phone') || undefined
  }
});
```

**sGTM Tag Config:**
- Event: InitiateCheckout
- User Data: em (se disponivel), ph (se disponivel), _fbp, _fbc, client_ip, user_agent
- Custom Data: content_name, content_id, value, currency

---

### Evento 5: Purchase (via dc-bridge — pos-checkout)

**Quando:** Webhook Hotmart PURCHASE_APPROVED
**Dados disponiveis:** email, phone, nome, valor, produto (SEM _fbp/_fbc)
**EMQ esperado:** 7-8/10 (PII forte, mas sem browser data)

**Enviado pelo dc-bridge** (ja implementado em `services/metaCapi.js`):
- Event: Purchase
- User Data: em (SHA256), ph (SHA256), fn (SHA256), ln (SHA256), country
- Custom Data: value, currency, content_name
- event_id: hotmart_tx_id (para deduplicacao)

---

## Estrategia de Captura de Email Pre-Checkout

### Por que isso importa?

Sem email pre-checkout, a Meta precisa fazer match apenas por _fbc/_fbp + IP + UA. Com email:

| Cenario | EMQ Medio | Atribuicao |
|---|---|---|
| Sem email, sem _fbc | 2-3 | ~30% match |
| Com _fbc, sem email | 5-6 | ~60% match |
| Com _fbc + email | 8-9 | ~95% match |
| Com _fbc + email + phone | 9-10 | ~99% match |

### Taticas para Capturar Email ANTES do Checkout

1. **Pop-up de Lead Magnet:** "Baixe o guia gratuito" → captura email → redireciona para pagina de vendas
2. **Formulario inline na pagina de vendas:** "Receba mais informacoes" ou "Tire suas duvidas"
3. **Quiz/Assessment:** Quiz interativo que pede email ao final para ver resultado
4. **Checkout pre-preenchido:** Redirecionar para Hotmart com `?email=xxx&name=xxx` nos parametros (Hotmart suporta)
5. **Webinar/Aula:** Captura email para assistir conteudo → upsell na pagina

### Persistencia de Email no Browser

Quando o email e capturado (Lead event), salvar no localStorage para reutilizar no InitiateCheckout:

```javascript
// No submit do formulario de lead
function onLeadCapture(email, phone, name) {
  // Salvar para reutilizar em eventos futuros
  localStorage.setItem('dc_lead_email', email);
  if (phone) localStorage.setItem('dc_lead_phone', phone);
  if (name) localStorage.setItem('dc_lead_name', name);

  // Disparar evento
  dataLayer.push({
    event: 'generate_lead',
    user_data: { email, phone, first_name: name }
  });
}
```

---

## Passagem de Parametros para Hotmart

A Hotmart suporta parametros UTM e dados pre-preenchidos na URL de checkout:

```
https://pay.hotmart.com/PRODUCT_ID?email=usuario@email.com&name=Nome&phone=5511999999999&src=facebook&sck=campaign_name
```

Parametros importantes:
- `email` — Pre-preenche email no checkout (reduz friccao + garante match)
- `name` — Pre-preenche nome
- `phone` — Pre-preenche telefone
- `src` — Source (para atribuicao no Hotmart)
- `sck` — Source Key (para rastrear campanha especifica)

### Implementacao no Botao de Compra

```javascript
// Enriquecer link de compra com dados do lead
function getEnrichedCheckoutUrl(baseUrl) {
  const email = localStorage.getItem('dc_lead_email');
  const phone = localStorage.getItem('dc_lead_phone');
  const name = localStorage.getItem('dc_lead_name');

  const url = new URL(baseUrl);
  if (email) url.searchParams.set('email', email);
  if (phone) url.searchParams.set('phone', phone);
  if (name) url.searchParams.set('name', name);

  // UTM params da URL atual
  const currentParams = new URLSearchParams(window.location.search);
  if (currentParams.get('utm_source')) url.searchParams.set('src', currentParams.get('utm_source'));
  if (currentParams.get('utm_campaign')) url.searchParams.set('sck', currentParams.get('utm_campaign'));

  return url.toString();
}

// Aplicar em todos os botoes de compra
document.querySelectorAll('a[href*="pay.hotmart.com"]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();

    // Disparar InitiateCheckout
    dataLayer.push({
      event: 'begin_checkout',
      content_name: this.dataset.productName || 'Produto',
      content_id: this.dataset.productId || '',
      value: parseFloat(this.dataset.price) || 0,
      currency: 'BRL',
      user_data: {
        email: localStorage.getItem('dc_lead_email') || undefined,
        phone: localStorage.getItem('dc_lead_phone') || undefined
      }
    });

    // Redirecionar com dados enriquecidos
    const enrichedUrl = getEnrichedCheckoutUrl(this.href);

    // Pequeno delay para garantir que o evento foi enviado
    setTimeout(() => { window.location.href = enrichedUrl; }, 300);
  });
});
```

---

## Configuracao sGTM — Tags Detalhadas

### Variaveis do Server Container

| Variable Name | Type | Source |
|---|---|---|
| Meta Pixel ID | Constant | Seu Pixel ID |
| Meta Access Token | Constant | Token CAPI |
| Event ID | Event Data | event_id (do DataLayer) |
| User Email | Event Data | user_data.email |
| User Phone | Event Data | user_data.phone |
| User First Name | Event Data | user_data.first_name |
| User Last Name | Event Data | user_data.last_name |
| FBP Cookie | Event Data | x-fb-cookie._fbp |
| FBC Cookie | Event Data | x-fb-cookie._fbc |
| Content Name | Event Data | content_name ou items.0.item_name |
| Content ID | Event Data | content_id ou items.0.item_id |
| Value | Event Data | value |
| Currency | Event Data | currency |

### Tag: Meta CAPI — PageView

| Campo | Valor |
|---|---|
| Event Name | PageView |
| Action Source | website |
| Event ID | {{Event ID}} |
| **User Data** | |
| Client IP Address | {{Client IP}} (auto) |
| Client User Agent | {{Client User Agent}} (auto) |
| FBP | {{FBP Cookie}} |
| FBC | {{FBC Cookie}} |
| **Custom Data** | |
| content_type | page |

### Tag: Meta CAPI — ViewContent

| Campo | Valor |
|---|---|
| Event Name | ViewContent |
| Action Source | website |
| Event ID | {{Event ID}} |
| **User Data** | (mesmo que PageView) |
| **Custom Data** | |
| content_name | {{Content Name}} |
| content_ids | [{{Content ID}}] |
| content_type | product |
| value | {{Value}} |
| currency | {{Currency}} |

### Tag: Meta CAPI — Lead

| Campo | Valor |
|---|---|
| Event Name | Lead |
| Action Source | website |
| Event ID | {{Event ID}} |
| **User Data** | |
| Email (em) | {{User Email}} — **tag faz SHA256 automaticamente** |
| Phone (ph) | {{User Phone}} |
| First Name (fn) | {{User First Name}} |
| Client IP, UA, FBP, FBC | (mesmo que PageView) |
| **Custom Data** | |
| content_name | {{Content Name}} |

### Tag: Meta CAPI — InitiateCheckout

| Campo | Valor |
|---|---|
| Event Name | InitiateCheckout |
| Action Source | website |
| Event ID | {{Event ID}} |
| **User Data** | |
| Email (em) | {{User Email}} (se disponivel) |
| Phone (ph) | {{User Phone}} (se disponivel) |
| Client IP, UA, FBP, FBC | (mesmo que PageView) |
| **Custom Data** | |
| content_name | {{Content Name}} |
| content_ids | [{{Content ID}}] |
| value | {{Value}} |
| currency | {{Currency}} |

---

## Deduplicacao de Eventos

A Meta deduplica eventos com o mesmo `event_name` + `event_id` recebidos tanto do Pixel (browser) quanto do CAPI (server).

### Como Gerar event_id

```javascript
// Gerar event_id unico para cada evento
function generateEventId(eventName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${eventName}_${timestamp}_${random}`;
}

// Usar no DataLayer
dataLayer.push({
  event: 'view_content',
  event_id: generateEventId('ViewContent'),  // Este ID vai para o Pixel E para o sGTM
  content_name: 'Produto X',
  value: 297.00,
  currency: 'BRL'
});
```

**Para Purchase (Hotmart):** O `event_id` e o `hotmart_transaction_id` — gerado pela Hotmart e enviado pelo dc-bridge. Se o Pixel tambem disparar Purchase na thank-you page, usar o mesmo tx_id.

---

## Fluxo Visual Completo

```
[Usuario clica anuncio Meta]
       |
       | fbclid na URL → _fbc cookie criado
       |
[WordPress — Pagina de destino]
       |
       |→ PageView (Pixel + sGTM CAPI)
       |   dados: _fbp, _fbc, IP, UA
       |
[Navega para pagina de produto]
       |
       |→ ViewContent (Pixel + sGTM CAPI)
       |   dados: _fbp, _fbc, IP, UA, produto, valor
       |
[Preenche formulario de lead] ← MOMENTO CRITICO
       |
       |→ Lead (Pixel + sGTM CAPI)
       |   dados: _fbp, _fbc, IP, UA, EMAIL, telefone, nome
       |   (email salvo no localStorage)
       |
[Clica "Comprar" → redireciona para Hotmart]
       |
       |→ InitiateCheckout (Pixel + sGTM CAPI)
       |   dados: _fbp, _fbc, IP, UA, email (do localStorage), produto, valor
       |   URL Hotmart enriquecida: ?email=xxx&phone=xxx&src=facebook
       |
[Hotmart — Checkout]
       |
       | (fora do seu controle — tracking da Hotmart)
       |
[Compra aprovada → Webhook]
       |
       |→ dc-bridge recebe webhook
       |→ Purchase (Meta CAPI direto)
       |   dados: email, phone, nome, valor, produto
       |   event_id: hotmart_tx_id
       |
[Meta faz o match]
       |
       | _fbc do pre-checkout + email do pos-checkout
       | = MATCH PERFEITO = atribuicao ao anuncio
```

---

## Checklist de Implementacao

### WordPress (por site)
- [ ] GTM4WP plugin instalado com Custom Loader do Stape
- [ ] DataLayer push para PageView (automatico via GTM)
- [ ] DataLayer push para ViewContent em paginas de produto
- [ ] Formulario de lead com captura de email + DataLayer push
- [ ] Email salvo no localStorage apos captura
- [ ] Botoes de compra enriquecidos com dados do lead
- [ ] InitiateCheckout dispara antes do redirect para Hotmart
- [ ] event_id unico gerado para cada evento
- [ ] Consent Mode v2 (LGPD) implementado

### Stape.io / sGTM
- [ ] Container ativo com custom domain (t.digitalcopilot.app)
- [ ] Custom Loader habilitado
- [ ] Cookie Keeper habilitado
- [ ] GA4 Client configurado
- [ ] Tag Meta CAPI — PageView
- [ ] Tag Meta CAPI — ViewContent
- [ ] Tag Meta CAPI — Lead
- [ ] Tag Meta CAPI — InitiateCheckout
- [ ] Todas as tags com: _fbp, _fbc, client_ip, user_agent
- [ ] Tags Lead e InitiateCheckout com email/phone quando disponivel
- [ ] event_id configurado em todas as tags (para deduplicacao)
- [ ] Test Events verificado no Meta Events Manager

### dc-bridge (ja implementado)
- [x] Purchase event via CAPI com SHA256 hashed PII
- [x] event_id = hotmart_tx_id
- [x] Deduplicacao automatica pela Meta
