# Hotmart → Brevo + Meta | Webhook Server

Sistema de webhook que recebe eventos da Hotmart e sincroniza automaticamente com o Brevo (listas, atributos) e Meta Conversions API.

## Arquitetura

```
Hotmart (webhook) → webhook.carolinemoschei.site → Node.js Server
                                                      ├── Brevo API (contatos, listas, atributos)
                                                      └── Meta Conversions API (Purchase, InitiateCheckout, Lead)
```

## Eventos processados

| Evento Hotmart | Brevo | Meta |
|---|---|---|
| Compra aprovada | Adiciona à lista "Compradores" + atributos do produto | Purchase |
| Carrinho abandonado | Adiciona à lista "Abandonaram Checkout" | InitiateCheckout + ViewContent |
| Boleto/PIX gerado | Adiciona à lista "Abandonaram Checkout" (aguardando) | InitiateCheckout + Lead |
| Reembolso | Move para lista "Reembolsados" | — (não enviado) |
| Cancelamento assinatura | Move para lista "Reembolsados" | — |

## Atributos salvos no Brevo (por contato)

- `HOTMART_STATUS` — Status atual (COMPRADOR, ABANDONOU_CHECKOUT, REEMBOLSADO, etc.)
- `HOTMART_PRODUCTS` — Lista de todos os produtos comprados (separados por vírgula)
- `HOTMART_LAST_PRODUCT` — Último produto comprado
- `HOTMART_TOTAL_PURCHASES` — Quantidade de produtos comprados
- `HOTMART_PURCHASE_DATE` — Data da última compra
- `HOTMART_PRICE` — Valor da última compra
- `HOTMART_PAYMENT_METHOD` — Método de pagamento
- `HOTMART_INTEREST_PRODUCT` — Produto que demonstrou interesse (abandonou/boleto)
- E mais (ver `scripts/setup-brevo-attributes.js` para lista completa)

---

## Passo a passo para Deploy

### 1. Preparar o DNS

Certifique-se de que `webhook.carolinemoschei.site` aponta para o IP da VPS (registro A no DNS).

### 2. Copiar projeto para a VPS

```bash
# Do seu computador:
scp -r hotmart-webhook-brevo/ usuario@IP_DA_VPS:/home/usuario/hotmart-webhook-brevo
```

### 3. Configurar variáveis de ambiente

```bash
cd /home/usuario/hotmart-webhook-brevo
cp .env.example .env
nano .env
```

Preencher:
- `HOTMART_HOTTOK` — Token do webhook da Hotmart (Painel Hotmart > Configurações > Webhooks)
- `BREVO_API_KEY` — API Key do Brevo (SMTP & API > API Keys)
- `META_PIXEL_ID` — ID do Pixel (Events Manager > Data Sources)
- `META_ACCESS_TOKEN` — Token da Conversions API (Events Manager > Settings)

### 4. Rodar o deploy

```bash
bash scripts/deploy.sh
```

### 5. Configurar proxy reverso no CyberPanel

**Opção A — Pelo CyberPanel (mais fácil):**
1. Criar website: `webhook.carolinemoschei.site`
2. Ativar SSL (Let's Encrypt)
3. Em **vHost Conf**, adicionar proxy reverso para `http://127.0.0.1:3001`

**Opção B — Config nginx manual:**
Copiar `nginx-webhook.conf` para `/etc/nginx/conf.d/` e reiniciar nginx.

### 6. Criar atributos e listas no Brevo

```bash
docker compose exec webhook node scripts/setup-brevo-attributes.js
```

Anotar os IDs das listas criadas e atualizar o `.env`.

### 7. Configurar webhook na Hotmart

1. Acesse: **Hotmart > Ferramentas > Webhooks**
2. URL: `https://webhook.carolinemoschei.site/webhook/hotmart`
3. Marque **todos os eventos**
4. Copie o **hottok** e coloque no `.env`

### 8. Testar

```bash
# Teste local
bash scripts/test-webhook.sh https://webhook.carolinemoschei.site

# Ver logs em tempo real
docker compose logs -f
```

---

## Comandos úteis

```bash
# Ver logs
docker compose logs -f

# Reiniciar
docker compose restart

# Parar
docker compose down

# Rebuild após alterações
docker compose up -d --build

# Ver status
docker compose ps
```

## Meta Conversions API + Utmify

Você já usa o Utmify para enviar eventos client-side. Este webhook adiciona eventos **server-side** via Conversions API, o que:
- Não é bloqueado por ad-blockers
- Melhora a atribuição de conversões
- A Meta faz **deduplicação automática** baseada no `event_id`

Para testar os eventos na Meta:
1. Events Manager > Test Events
2. Coloque o `META_TEST_EVENT_CODE` no `.env`
3. Envie um teste e verifique se aparece
4. Depois de confirmar, remova o test code do `.env`
