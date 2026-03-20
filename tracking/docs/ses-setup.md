# Amazon SES — Email Fallback Setup

## Arquitetura de Redundancia

```
[Listmonk / Chatwoot / dc-bridge]
         |
    [Stalwart Mail] ← Primario (self-hosted, gratuito)
         |
    (se falhar)
         |
    [Amazon SES]    ← Fallback (pago por volume)
```

## Por que SES como fallback?

- Se o Stalwart cair, os emails continuam saindo via SES
- Se o IP do KVM entrar em blacklist, o SES tem reputacao propria
- SES tem entregabilidade de 99.9%+ (infraestrutura da AWS)
- Custo: $0.10 por 1000 emails (baratissimo)

## Step 1: Criar Conta AWS (se nao tiver)

1. Acesse aws.amazon.com e crie uma conta
2. Ative o AWS Free Tier (inclui 62,000 emails/mes gratuitos se enviar de EC2, ou 1000/mes gratuitos)

## Step 2: Configurar SES

### 2.1 Verificar Dominio

1. AWS Console → SES → Verified Identities → Create Identity
2. Selecione "Domain"
3. Digite: `digitalcopilot.app`
4. Ative "Easy DKIM" (2048-bit)
5. AWS vai fornecer 3 registros CNAME para DKIM — adicione ao DNS:

| Tipo | Nome | Valor |
|---|---|---|
| CNAME | `xxx._domainkey.digitalcopilot.app` | `xxx.dkim.amazonses.com` |
| CNAME | `yyy._domainkey.digitalcopilot.app` | `yyy.dkim.amazonses.com` |
| CNAME | `zzz._domainkey.digitalcopilot.app` | `zzz.dkim.amazonses.com` |

6. Aguarde verificacao (minutos a horas)

### 2.2 Sair do Sandbox

Por padrao, SES esta em "sandbox" — so envia para emails verificados.

1. AWS Console → SES → Account Dashboard
2. Clique "Request Production Access"
3. Preencha:
   - Mail type: Transactional
   - Website URL: digitalcopilot.app
   - Use case: "We send transactional emails (purchase confirmations, cart abandonment recovery) and newsletters to opt-in subscribers. We use double opt-in and have unsubscribe links in every email."
4. Aguarde aprovacao (24-48h)

### 2.3 Criar Credenciais SMTP

**IMPORTANTE:** Credenciais SMTP do SES NAO sao suas AWS Access Keys!

1. AWS Console → SES → SMTP Settings
2. Clique "Create SMTP Credentials"
3. Um usuario IAM sera criado automaticamente
4. Copie o **SMTP Username** e **SMTP Password** gerados
5. Adicione ao `.env`:

```env
SES_SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USER=AKIAIOSFODNN7EXAMPLE
SES_SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SES_REGION=us-east-1
```

### 2.4 Verificar Regiao

| Regiao AWS | Endpoint SMTP |
|---|---|
| us-east-1 (Virginia) | email-smtp.us-east-1.amazonaws.com |
| us-west-2 (Oregon) | email-smtp.us-west-2.amazonaws.com |
| eu-west-1 (Ireland) | email-smtp.eu-west-1.amazonaws.com |
| sa-east-1 (Sao Paulo) | email-smtp.sa-east-1.amazonaws.com |

**Recomendacao:** `sa-east-1` (Sao Paulo) para menor latencia com destinatarios brasileiros.

## Step 3: Configurar nos Servicos

### Listmonk

No `listmonk-config.toml`, o SES ja esta configurado como segundo SMTP (`[smtp.ses]`).

O Listmonk usa o primeiro SMTP disponivel por padrao. Para configurar fallback na UI:
1. Acesse campaigns.digitalcopilot.app
2. Settings → SMTP → verifica que ambos (stalwart e ses) estao configurados
3. Ao criar campanha, selecione qual SMTP usar

### Chatwoot

O Chatwoot usa SMTP do Stalwart por padrao. Para fallback SES:
1. Se o Stalwart cair, atualize temporariamente as env vars do Chatwoot no docker-compose
2. Ou configure um relay no Stalwart que aponta para SES (ver abaixo)

### Stalwart (Relay via SES)

Configurar o Stalwart para usar SES como relay para envios externos:

No painel admin do Stalwart (Configuracao SMTP):
- Relay Host: `email-smtp.sa-east-1.amazonaws.com`
- Relay Port: 587
- Relay Auth: plain
- Relay User: SES SMTP Username
- Relay Pass: SES SMTP Password
- Relay TLS: STARTTLS

Assim, o Stalwart continua sendo o ponto central de envio, mas relayeia para o SES.
Isso mantem DKIM/SPF alinhados e adiciona a infraestrutura de entrega do SES.

## Step 4: Monitorar Entregas

### SES Dashboard
- AWS Console → SES → Dashboard
- Monitore: Send Rate, Bounces, Complaints
- Configure SNS notifications para bounces e complaints

### Alarmes Recomendados
- Bounce rate > 5% → alarme (SES suspende acima de 10%)
- Complaint rate > 0.1% → alarme (SES suspende acima de 0.5%)

## Custos

| Faixa | Custo |
|---|---|
| 0-62,000 emails/mes (Free Tier EC2) | Gratuito |
| 1-1000 emails/mes (Free Tier geral) | Gratuito |
| Acima do Free Tier | $0.10 por 1000 emails |
| Dados anexos | $0.12 por GB |

Para 100 emails/dia = ~3000/mes = **~$0.30/mes** como fallback.

## Verificacao

```bash
# Testar envio via SES SMTP (de dentro do container dc-bridge)
docker compose exec dc-bridge wget -qO- http://localhost:3100/health/detailed | jq .smtp

# Deve mostrar:
# {
#   "active_provider": "stalwart",
#   "providers": {
#     "stalwart": { "configured": true, "reachable": true },
#     "ses":      { "configured": true, "reachable": true }
#   }
# }
```
