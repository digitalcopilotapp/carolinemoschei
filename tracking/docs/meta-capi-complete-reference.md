# Meta Conversions API — Referencia Completa de Eventos e Parametros

## 1. Parametros do Servidor (Server Event)

Enviados na raiz de cada evento no array `data[]`:

| Parametro | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `event_name` | string | **SIM** | Nome do evento (ex: Purchase, Lead, ViewContent) |
| `event_time` | integer | **SIM** | Unix timestamp (segundos) de quando o evento ocorreu |
| `event_source_url` | string | **SIM (web)** | URL completa da pagina onde o evento aconteceu |
| `event_id` | string | Recomendado | ID unico para deduplicacao entre Pixel e CAPI |
| `action_source` | string | **SIM** | Origem: `website`, `app`, `phone_call`, `chat`, `email`, `physical_store`, `system_generated`, `business_messaging`, `other` |
| `opt_out` | boolean | Nao | Se `true`, Meta nao usa dados para otimizacao de anuncios |
| `data_processing_options` | array | Nao | Opcoes de processamento regional (ex: `["LDU"]` para LGPD) |
| `data_processing_options_country` | integer | Nao | Codigo do pais (0 = auto-detectar, 1 = EUA) |
| `data_processing_options_state` | integer | Nao | Codigo do estado (0 = auto-detectar, 1000 = California) |
| `referrer_url` | string | Nao | URL de referencia (de onde o usuario veio) |

---

## 2. Parametros do Usuario (user_data)

### 2.1 Dados Pessoais (REQUEREM SHA256 hash)

| Campo | Key | Formato Antes do Hash | Exemplo | Impacto EMQ |
|---|---|---|---|---|
| Email | `em` | Lowercase, trim | `joao@email.com` → SHA256 | **MUITO ALTO** |
| Telefone | `ph` | Digitos + codigo pais, sem simbolos | `5511999999999` → SHA256 | **MUITO ALTO** |
| Primeiro Nome | `fn` | Lowercase, a-z | `joao` → SHA256 | MEDIO |
| Sobrenome | `ln` | Lowercase, a-z | `silva` → SHA256 | MEDIO |
| Genero | `ge` | Letra unica: `m` ou `f` | `m` → SHA256 | BAIXO |
| Data Nascimento | `db` | Formato YYYYMMDD | `19900115` → SHA256 | MEDIO |
| Cidade | `ct` | Lowercase, sem pontuacao/espacos | `saopaulo` → SHA256 | BAIXO |
| Estado | `st` | 2 caracteres lowercase | `sp` → SHA256 | BAIXO |
| CEP | `zp` | Sem espacos/tracos | `01310100` → SHA256 | BAIXO |
| Pais | `country` | ISO 3166-1 alpha-2 lowercase | `br` → SHA256 | MEDIO |

> **Todos aceitam array** — voce pode enviar multiplos valores: `"em": ["hash1", "hash2"]`

### 2.2 Identificadores (NAO fazer hash)

| Campo | Key | Formato | Descricao | Impacto EMQ |
|---|---|---|---|---|
| IP do Cliente | `client_ip_address` | IPv4 ou IPv6 | IP do navegador do usuario | **ALTO** |
| User Agent | `client_user_agent` | String | User-Agent do navegador | **ALTO** |
| Click ID (Meta) | `fbc` | `fb.1.{timestamp}.{fbclid}` | Cookie gerado quando usuario clica no anuncio | **MUITO ALTO** |
| Browser ID (Meta) | `fbp` | `fb.1.{timestamp}.{random}` | Cookie do Pixel — identifica o navegador | **ALTO** |
| ID Externo | `external_id` | String (hash recomendado) | Seu ID de usuario/lead — **conecta pre e pos checkout** | **ALTO** |
| Lead ID (Meta) | `lead_id` | Integer | ID de lead do Meta Lead Ads | MEDIO |
| Facebook Login ID | `fb_login_id` | Integer | ID do usuario se logado via Facebook | ALTO |
| Subscription ID | `subscription_id` | String | ID da assinatura/transacao recorrente | BAIXO |
| WhatsApp Click ID | `ctwa_clid` | String | ID do clique em anuncio Click-to-WhatsApp | ALTO |
| Page ID | `page_id` | String | ID da pagina Facebook (para Messenger bots) | BAIXO |
| Page Scoped User ID | `page_scoped_user_id` | String | ID do usuario no contexto da pagina | MEDIO |
| Instagram Account ID | `ig_account_id` | String | ID da conta business do Instagram | BAIXO |
| Instagram Session ID | `ig_sid` | String | ID da sessao Instagram | MEDIO |
| Mobile Ad ID | `madid` | String | IDFA (iOS) ou Google Advertising ID | ALTO |
| Anonymous ID | `anon_id` | String | ID de instalacao do app (apenas app events) | BAIXO |

---

## 3. Dados Customizados (custom_data)

| Campo | Key | Tipo | Descricao |
|---|---|---|---|
| Valor | `value` | float | Valor monetario (ex: 297.00) — **obrigatorio para Purchase** |
| Moeda | `currency` | string | ISO 4217 (ex: `BRL`, `USD`) — **obrigatorio com value** |
| Nome do Conteudo | `content_name` | string | Nome do produto/oferta |
| Categoria | `content_category` | string | Categoria do produto (ex: "curso", "ebook") |
| IDs do Conteudo | `content_ids` | array[string] | IDs dos produtos (ex: `["HOTMART_123"]`) |
| Tipo de Conteudo | `content_type` | string | `product` ou `product_group` |
| Conteudos Detalhados | `contents` | array[object] | Detalhes dos itens (ver abaixo) |
| Qtd de Itens | `num_items` | integer | Numero de itens no carrinho/compra |
| ID do Pedido | `order_id` | string | ID unico da transacao |
| LTV Previsto | `predicted_ltv` | float | Valor de vida util previsto do cliente |
| Busca | `search_string` | string | Termo pesquisado (evento Search) |
| Status | `status` | string | Status do evento (ex: "completed", "failed") |
| Categoria de Entrega | `delivery_category` | string | `in_store`, `curbside`, `home_delivery` |
| Numero do Item | `item_number` | string | SKU/numero do produto |

### Formato do `contents` (array de objetos)

```json
"contents": [
  {
    "id": "HOTMART_PRODUCT_123",
    "quantity": 1,
    "item_price": 297.00,
    "title": "Curso Marketing Digital",
    "description": "Curso completo de marketing",
    "brand": "Digital Copilot",
    "category": "curso",
    "delivery_category": "digital"
  }
]
```

---

## 4. TODOS os Eventos Padrao da Meta

### 4.1 Eventos de Funil de Vendas (Nesta Ordem)

| # | Evento | Quando Disparar | Parametros Obrigatorios | Parametros Recomendados |
|---|---|---|---|---|
| 1 | **PageView** | Toda pagina carregada | action_source, event_time | event_source_url |
| 2 | **ViewContent** | Pagina de produto/oferta | action_source, event_time | content_name, content_ids, content_type, value, currency |
| 3 | **Search** | Busca no site | action_source, event_time | search_string, content_category, content_ids |
| 4 | **AddToCart** | Adiciona item ao carrinho | action_source, event_time | content_name, content_ids, content_type, value, currency, num_items |
| 5 | **AddToWishlist** | Salva produto nos favoritos | action_source, event_time | content_name, content_ids, value, currency |
| 6 | **InitiateCheckout** | Inicia o checkout | action_source, event_time | content_ids, content_type, value, currency, num_items |
| 7 | **AddPaymentInfo** | Preenche dados de pagamento | action_source, event_time | content_type, value, currency |
| 8 | **Purchase** | Compra finalizada | action_source, event_time, **value**, **currency** | content_name, content_ids, content_type, contents, num_items, order_id |

### 4.2 Eventos de Lead & Registro

| Evento | Quando Disparar | Parametros Recomendados |
|---|---|---|
| **Lead** | Formulario preenchido (isca digital, newsletter, quiz) | content_name, value, currency |
| **CompleteRegistration** | Cadastro/registro concluido | status, value, currency |
| **SubmitApplication** | Formulario de inscricao/candidatura enviado | content_name |
| **Contact** | Usuario entra em contato (chat, telefone) | — |

### 4.3 Eventos de Assinatura

| Evento | Quando Disparar | Parametros Recomendados |
|---|---|---|
| **Subscribe** | Assina servico recorrente | value, currency, predicted_ltv |
| **StartTrial** | Inicia periodo de teste | value, currency, predicted_ltv |

### 4.4 Eventos Especiais

| Evento | Quando Disparar | Parametros Recomendados |
|---|---|---|
| **CustomizeProduct** | Personaliza produto antes da compra | content_name, content_ids |
| **Donate** | Doacao realizada | value, currency |
| **FindLocation** | Busca localizacao de loja/escritorio | content_name |
| **Schedule** | Agendamento de consulta/reuniao | content_name |

---

## 5. Mapeamento Completo: Digital Copilot

### Quais eventos usar e onde

| Evento | Origem | Enviado Por | user_data Disponiveis |
|---|---|---|---|
| **PageView** | WordPress | sGTM (Stape) | _fbp, _fbc, IP, UA |
| **ViewContent** | WordPress (pagina produto) | sGTM (Stape) | _fbp, _fbc, IP, UA |
| **Lead** | WordPress (formulario) | sGTM (Stape) | _fbp, _fbc, IP, UA, **em**, ph, fn |
| **InitiateCheckout** | WordPress (click comprar) | sGTM (Stape) | _fbp, _fbc, IP, UA, em (se capturado) |
| **Purchase** | Hotmart webhook | dc-bridge | **em**, **ph**, fn, ln, country, external_id |
| **Subscribe** | Hotmart webhook (recorrente) | dc-bridge | em, ph, fn, ln, country |
| **CompleteRegistration** | WordPress (cadastro) | sGTM (Stape) | _fbp, _fbc, IP, UA, em |
| **Contact** | Chatwoot (novo contato WhatsApp) | dc-bridge | em, ph, fn |

---

## 6. Implementacao Atualizada no dc-bridge

### Novos eventos a adicionar no dc-bridge:

```
PURCHASE_APPROVED   →  Purchase
PURCHASE_COMPLETE   →  Purchase (se nao enviado)
SUBSCRIPTION_CREATE →  Subscribe      ← NOVO
CART_ABANDONMENT    →  (nao enviar para Meta — apenas WA)
PURCHASE_REFUNDED   →  (nao enviar)
```
