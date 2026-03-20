# WhatsApp Business API Setup

## Prerequisites

1. Meta Business Manager account (business.facebook.com)
2. A dedicated phone number for WhatsApp Business (cannot be used with regular WhatsApp)
3. Business verification approved in Meta Business Suite

## Step 1: Register for WhatsApp Cloud API

1. Go to developers.facebook.com
2. Create a new app (type: Business)
3. Add the WhatsApp product
4. Complete the Embedded Signup flow
5. Note your: Phone Number ID, WhatsApp Business Account ID, Access Token

## Step 2: Verify Phone Number

1. In Meta Business Suite → WhatsApp Manager → Phone Numbers
2. Add your business phone number
3. Verify via SMS or voice call
4. Set display name and profile

## Step 3: Connect to Chatwoot

1. In Chatwoot, go to Settings → Inboxes → Add Inbox
2. Select WhatsApp as the channel
3. Choose "WhatsApp Cloud" provider
4. Enter:
   - Phone Number ID
   - WhatsApp Business Account ID
   - API Key (access token)
5. Save and test with a message

## Step 4: Create Templates

Templates must be pre-approved by Meta before they can be sent.

### Required Templates

| Template Name | Category | Language | Content |
|---|---|---|---|
| purchase_confirmed | UTILITY | pt_BR | "Parabens pela compra de {{1}}! Acesse seu produto aqui: {{2}}" |
| cart_abandoned | MARKETING | pt_BR | "Oi {{1}}, voce esqueceu algo no carrinho! Finalize sua compra com desconto: {{2}}" |
| refund_response | UTILITY | pt_BR | "Seu reembolso para {{1}} foi processado. Como podemos ajudar? Responda esta mensagem." |
| subscription_canceled | MARKETING | pt_BR | "Sentimos sua falta! Que tal voltar com 30% OFF? Acesse: {{1}}" |
| reengagement_7days | MARKETING | pt_BR | "Faz uma semana que voce cancelou. Preparamos algo especial para voce: {{1}}" |

### How to Create Templates

1. Go to Meta Business Suite → WhatsApp Manager → Message Templates
2. Click "Create Template"
3. Select category and language
4. Write body with {{1}}, {{2}} placeholders
5. Submit for review (usually 1-24 hours)

### Guidelines for Approval

- Do not use excessive promotional language
- Include clear opt-out instructions
- Do not make false urgency claims
- Utility templates have higher approval rates than marketing
- Keep messages concise and relevant

## Pricing

WhatsApp Cloud API pricing (Brazil):
- **Utility conversations:** ~$0.035 per conversation (24h window)
- **Marketing conversations:** ~$0.065 per conversation (24h window)
- **Service conversations:** Free (first 1,000/month)

A "conversation" is a 24-hour window of messages. Multiple messages in the same window count as one conversation.
