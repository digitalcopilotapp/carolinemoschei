# PRD: Digital Copilot — Self-Hosted Email, Campaigns, CRM & Tracking Infrastructure

## Introduction

Build a complete self-hosted marketing infrastructure on a single Hostinger KVM 2 server (2 vCPU, 8GB RAM, 100GB NVMe) for Digital Copilot. The system replaces $300-500+/month in SaaS tools with an integrated stack covering: email server with multi-domain support (Stalwart Mail), webmail client (SnappyMail), campaign/newsletter platform (Listmonk), CRM with WhatsApp automation (Chatwoot), server-side conversion tracking (sGTM via Stape.io + Meta CAPI), and a custom webhook bridge (dc-bridge) that ties Hotmart purchases into the entire funnel. Total target cost: ~$33-48/month.

**Domain:** mail.digitalcopilot.app
**Platform:** Hostinger KVM 2 (Ubuntu 22.04 LTS)
**Prepared for:** Nathan | Digital Copilot

---

## Goals

- Deploy all services via Docker Compose on a single KVM 2 server with Caddy as reverse proxy
- Provide a fully functional multi-domain email server with DKIM/SPF/DMARC and webmail access
- Enable campaign management with list segmentation, templates, and scheduled sends
- Integrate Chatwoot CRM with WhatsApp Business API for automated event-driven messaging
- Capture 90%+ of conversions via server-side tracking (Meta Conversions API)
- Automatically sync Hotmart purchases, refunds, cancellations, and cart abandonments across all systems
- Maintain total RAM usage under 6GB with all services running
- Achieve 99.5%+ uptime with monitoring, alerting, and automated backups

---

## User Stories

---

### PHASE 1 — Infrastructure Base

---

#### US-001: Provision and Harden the KVM 2 Server
**Description:** As Nathan, I want a secure, Docker-ready Ubuntu 22.04 server so that all services have a stable foundation.

**Acceptance Criteria:**
- [ ] Ubuntu 22.04 LTS installed on Hostinger KVM 2
- [ ] SSH access configured with key-based authentication (password auth disabled)
- [ ] `ufw` firewall active — only ports 22, 25, 80, 443, 465, 587, 993 open
- [ ] `fail2ban` installed and configured for SSH protection
- [ ] `unattended-upgrades` enabled for automatic security patches
- [ ] Swap file configured (2-4GB) as safety net for RAM spikes
- [ ] Docker Engine and Docker Compose v2 installed and running
- [ ] Server timezone set to UTC

---

#### US-002: Create the Docker Compose Foundation
**Description:** As Nathan, I want a single `docker-compose.yml` that defines all services so I can deploy the entire stack with one command.

**Acceptance Criteria:**
- [ ] `docker-compose.yml` at project root defines all services: caddy, stalwart, postgres, redis, listmonk, snappymail, chatwoot (web + sidekiq), dc-bridge, uptime-kuma
- [ ] All services share an internal Docker network (`dc-network`)
- [ ] Named volumes defined for persistent data: postgres, stalwart, redis, caddy-data, caddy-config, uptime-kuma
- [ ] `.env.example` file with all required environment variables documented
- [ ] `.env` file excluded from git via `.gitignore`
- [ ] Secrets (passwords, API keys) loaded from `.env`, not hardcoded
- [ ] `docker compose up -d` starts all services without errors
- [ ] `docker compose down` stops all services cleanly

---

#### US-003: Deploy and Configure PostgreSQL 15
**Description:** As Nathan, I want a PostgreSQL 15 instance shared by Listmonk, Chatwoot, and dc-bridge so that all data is centralized.

**Acceptance Criteria:**
- [ ] PostgreSQL 15 container running with persistent volume at `/var/lib/postgresql/data`
- [ ] Three separate databases created: `listmonk`, `chatwoot`, `dcbridge`
- [ ] Dedicated database users created for each service with minimal required privileges
- [ ] `shared_buffers` set to 512MB, `work_mem` to 4MB (optimized for 8GB server)
- [ ] Health check configured in docker-compose (`pg_isready`)
- [ ] Connection accessible from other containers via `postgres:5432` on internal network
- [ ] PostgreSQL logs available via `docker compose logs postgres`

---

#### US-004: Deploy and Configure Redis
**Description:** As Nathan, I want a Redis instance for Chatwoot's caching and background job processing.

**Acceptance Criteria:**
- [ ] Redis container running with persistent volume
- [ ] `maxmemory` set to 256MB with `allkeys-lru` eviction policy
- [ ] Health check configured (`redis-cli ping`)
- [ ] Accessible from Chatwoot containers via `redis:6379` on internal network
- [ ] RDB snapshots enabled for persistence

---

#### US-005: Deploy and Configure Caddy as Reverse Proxy
**Description:** As Nathan, I want Caddy to handle HTTPS and route traffic to all web services so I get automatic SSL certificates.

**Acceptance Criteria:**
- [ ] Caddy container running with volumes for data and config
- [ ] `Caddyfile` configures reverse proxy for all subdomains:
  - `campaigns.digitalcopilot.app` → listmonk:9000
  - `webmail.digitalcopilot.app` → snappymail:8888
  - `crm.digitalcopilot.app` → chatwoot:3000
  - `webhook.digitalcopilot.app` → dc-bridge:3100
  - `status.digitalcopilot.app` → uptime-kuma:3001
- [ ] HTTPS certificates auto-provisioned by Caddy (Let's Encrypt)
- [ ] HTTP → HTTPS redirect enabled for all subdomains
- [ ] Ports 80 and 443 exposed to host
- [ ] Each subdomain responds with correct service over HTTPS

---

#### US-006: Configure DNS Records
**Description:** As Nathan, I want all required DNS records configured so that email deliverability and web services work correctly.

**Acceptance Criteria:**
- [ ] A records for: mail, campaigns, webmail, crm, webhook, status — all pointing to KVM IP
- [ ] MX record for digitalcopilot.app pointing to mail.digitalcopilot.app (priority 10)
- [ ] SPF TXT record: `v=spf1 a mx ip4:[IP] ~all`
- [ ] DMARC TXT record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@digitalcopilot.app`
- [ ] DKIM CNAME record as generated by Stalwart
- [ ] PTR/rDNS record requested from Hostinger support (ticket opened)
- [ ] All records verified via `dig` or MXToolbox
- [ ] Documentation of all DNS records saved in `docs/dns-records.md`

---

#### US-007: Deploy and Configure Stalwart Mail Server
**Description:** As Nathan, I want a fully functional email server with multi-domain support so that all projects can send and receive email.

**Acceptance Criteria:**
- [ ] Stalwart Mail container running with persistent volume at `/opt/stalwart`
- [ ] Ports 25, 587, 465, 993 exposed to host (not through Caddy — direct TCP)
- [ ] Admin panel accessible (via Caddy or direct port)
- [ ] DKIM keys auto-generated for digitalcopilot.app
- [ ] SPF validation enabled for inbound email
- [ ] DMARC policy enforcement active
- [ ] Antispam filters enabled (built-in sieve)
- [ ] TLS certificates configured (either via Caddy or Stalwart's built-in ACME)
- [ ] Test email sent from `nathan@digitalcopilot.app` to external address — arrives in inbox (not spam)
- [ ] Test email received from external address — arrives in Stalwart mailbox

---

### PHASE 2 — Email & Campaigns

---

#### US-008: Create Initial Email Accounts in Stalwart
**Description:** As Nathan, I want email accounts created for Digital Copilot so each has a dedicated inbox.

**Acceptance Criteria:**
- [ ] Account created: `nathan@digitalcopilot.app` (admin)
- [ ] Account created: `contato@digitalcopilot.app` (general reception)
- [ ] Account created: `noreply@digitalcopilot.app` (campaign sends via Listmonk)
- [ ] Each account has a secure password stored in password manager
- [ ] Storage quotas configured per account (e.g., 2GB each)
- [ ] Aliases configured as needed (e.g., `admin@` → `nathan@`)
- [ ] All accounts accessible via IMAP (port 993) and SMTP (port 587)

---

#### US-009: Deploy and Configure SnappyMail Webmail
**Description:** As Nathan, I want a modern webmail client so I can read and send email from any browser.

**Acceptance Criteria:**
- [ ] SnappyMail container running on internal port 8888
- [ ] Accessible via `webmail.digitalcopilot.app` (HTTPS through Caddy)
- [ ] IMAP connection configured: `stalwart:993` (internal Docker network, TLS)
- [ ] SMTP connection configured: `stalwart:587` (internal Docker network, STARTTLS)
- [ ] Admin panel accessible for configuration
- [ ] Login with `nathan@digitalcopilot.app` — can send and receive email
- [ ] Multiple identities support enabled (send from any configured domain)
- [ ] Theme/branding customized if desired

---

#### US-010: Deploy and Configure Listmonk
**Description:** As Nathan, I want a campaign management platform so I can send newsletters and manage subscriber lists.

**Acceptance Criteria:**
- [ ] Listmonk container running on internal port 9000
- [ ] Accessible via `campaigns.digitalcopilot.app` (HTTPS through Caddy)
- [ ] Connected to PostgreSQL database `listmonk`
- [ ] SMTP configured: host=stalwart, port=587, user=noreply@digitalcopilot.app, STARTTLS
- [ ] Admin login configured with secure credentials
- [ ] Rate limit set to 5 emails/minute (initial Hostinger limit)
- [ ] Test campaign sent to a test list — email delivered successfully
- [ ] Bounce handling configured via Stalwart webhooks

---

#### US-011: Create Initial Listmonk Lists and Templates
**Description:** As Nathan, I want organized lists and email templates ready so I can start sending campaigns per project.

**Acceptance Criteria:**
- [ ] List created: "Digital Copilot — Newsletter" (double opt-in)
- [ ] List created: "Digital Copilot — Pos-Venda" (single opt-in, for Hotmart buyers)
- [ ] List created: "Digital Copilot — Onboarding" (single opt-in)
- [ ] Default transactional template created (clean, responsive HTML)
- [ ] Default newsletter template created (branded, responsive HTML)
- [ ] Unsubscribe link works correctly in test emails
- [ ] List-specific opt-in pages accessible via Listmonk public URLs

---

#### US-012: Email Warm-Up Plan Execution
**Description:** As Nathan, I want a documented warm-up schedule so the server IP builds reputation gradually.

**Acceptance Criteria:**
- [ ] Warm-up schedule documented in `docs/email-warmup.md`
- [ ] Week 1: max 100 emails/day (engaged contacts + transactional/cart abandonment)
- [ ] Week 2: max 200 emails/day, monitoring bounce rates
- [ ] Week 3: max 500 emails/day, checking Google Postmaster Tools
- [ ] Week 4+: gradual increase, request Hostinger limit increase
- [ ] MXToolbox blacklist check clean after each week
- [ ] mail-tester.com score of 8+/10 on test emails
- [ ] Listmonk rate limiting configured to match current warm-up stage

---

### PHASE 3 — CRM & WhatsApp

---

#### US-013: Deploy Chatwoot (Web + Sidekiq)
**Description:** As Nathan, I want Chatwoot running so I have a CRM with omnichannel messaging.

**Acceptance Criteria:**
- [ ] Chatwoot web container running on internal port 3000
- [ ] Chatwoot sidekiq container running (background jobs) — limited to 2 workers
- [ ] Connected to PostgreSQL database `chatwoot`
- [ ] Connected to Redis at `redis:6379`
- [ ] Accessible via `crm.digitalcopilot.app` (HTTPS through Caddy)
- [ ] Admin account created with secure credentials
- [ ] Total Chatwoot RAM usage under 2GB (`docker stats`)
- [ ] Chatwoot logs accessible via `docker compose logs chatwoot-web` and `chatwoot-sidekiq`

---

#### US-014: Configure WhatsApp Cloud API Channel in Chatwoot
**Description:** As Nathan, I want WhatsApp connected to Chatwoot so I can send and receive WhatsApp messages from the CRM.

**Acceptance Criteria:**
- [ ] WhatsApp Business account approved in Meta Business Suite
- [ ] Phone number verified and registered for WhatsApp Business API
- [ ] WhatsApp Cloud API channel created in Chatwoot via Embedded Signup
- [ ] Test message sent from Chatwoot to a personal WhatsApp number — received
- [ ] Incoming WhatsApp message appears in Chatwoot inbox
- [ ] Channel documented in `docs/whatsapp-setup.md`

---

#### US-015: Create and Approve WhatsApp Message Templates
**Description:** As Nathan, I want pre-approved WhatsApp templates so dc-bridge can send automated messages.

**Acceptance Criteria:**
- [ ] Template created and approved: "purchase_confirmed" — purchase congratulation + product access link
- [ ] Template created and approved: "cart_abandoned" — reminder with discount link
- [ ] Template created and approved: "refund_response" — empathy message + support offer
- [ ] Template created and approved: "subscription_canceled" — win-back offer (30% OFF)
- [ ] Template created and approved: "reengagement_7days" — reengagement for cancellations after 7 days
- [ ] All template names documented in `docs/whatsapp-templates.md`
- [ ] Templates comply with Meta's messaging policy (no excessive promotional language)

---

#### US-016: Configure Email Channel in Chatwoot
**Description:** As Nathan, I want inbound emails appearing in Chatwoot so all customer communication is in one place.

**Acceptance Criteria:**
- [ ] Email channel created in Chatwoot connected to Stalwart (IMAP/SMTP)
- [ ] Inbound email to `contato@digitalcopilot.app` creates a conversation in Chatwoot
- [ ] Reply from Chatwoot sends email via Stalwart
- [ ] Email threading works correctly (replies show in same conversation)

---

#### US-017: Configure Chatwoot Automations
**Description:** As Nathan, I want native automations in Chatwoot so contacts are automatically organized by labels.

**Acceptance Criteria:**
- [ ] Automation rule: new contact with label "cliente" → assign to "Clientes" team
- [ ] Automation rule: new contact with label "carrinho_abandonado" → assign to "Recovery" team
- [ ] Automation rule: contact label changed to "refund" → notify admin
- [ ] Custom attributes created: `produto`, `hotmart_tx_id`, `source`, `purchase_amount`
- [ ] Labels created: `cliente`, `refund`, `cancelado`, `carrinho_abandonado`, `ex-assinante`
- [ ] Test: manually assign a label → automation triggers correctly

---

### PHASE 4 — Tracking & Integrations (dc-bridge)

---

#### US-018: Scaffold dc-bridge Node.js Project
**Description:** As Nathan, I want a clean Node.js project structure for dc-bridge so the codebase is organized and maintainable.

**Acceptance Criteria:**
- [ ] `dc-bridge/` directory at project root with `package.json`
- [ ] Dependencies: `express`, `pg` (node-postgres), `node-fetch` or native fetch, `crypto` (built-in), `dotenv`
- [ ] Dev dependencies: `nodemon` for development
- [ ] `Dockerfile` for production build (Node 20 Alpine)
- [ ] `.dockerignore` excluding node_modules, .env, tests
- [ ] Entry point: `src/index.js` (or `src/index.ts` if TypeScript preferred)
- [ ] Structured folders: `src/routes/`, `src/services/`, `src/db/`, `src/utils/`
- [ ] ESLint or Biome configured for code quality
- [ ] `npm start` runs the server; `npm run dev` runs with nodemon

---

#### US-019: Create PostgreSQL Schema for Leads & Conversions
**Description:** As Nathan, I want database tables for leads, conversions, and automation queues so all data is persisted and queryable.

**Acceptance Criteria:**
- [ ] Migration file created: `dc-bridge/src/db/migrations/001_initial_schema.sql`
- [ ] Table `leads`: id (UUID), email, phone, name, source, chatwoot_contact_id, listmonk_subscriber_id, created_at, updated_at
- [ ] Table `conversions`: id (UUID), lead_id (FK), product, amount, currency, status, hotmart_tx_id (unique), sent_to_meta (boolean), event_id, created_at
- [ ] Table `meta_events`: id (UUID), conversion_id (FK), event_name, event_id, response_code, response_body, sent_at
- [ ] Table `scheduled_messages`: id (UUID), lead_id (FK), channel (whatsapp/email), template_name, template_params (JSONB), scheduled_for (timestamp), sent (boolean), canceled (boolean), created_at
- [ ] Table `retry_queue`: id (UUID), event_type, payload (JSONB), attempts (int, default 0), max_attempts (int, default 5), next_retry (timestamp), last_error (text), created_at
- [ ] Table `subscriptions`: id (UUID), lead_id (FK), plan, status, hotmart_subscription_id, next_billing, canceled_at, created_at
- [ ] Indexes on: leads.email, leads.phone, conversions.hotmart_tx_id, scheduled_messages.scheduled_for, retry_queue.next_retry
- [ ] Migration runs successfully against PostgreSQL: `npm run migrate`

---

#### US-020: Implement Health Check Endpoint
**Description:** As Nathan, I want a `/health` endpoint so Uptime Kuma can monitor dc-bridge.

**Acceptance Criteria:**
- [ ] `GET /health` returns `200 OK` with JSON: `{ "status": "ok", "uptime": <seconds>, "timestamp": "<ISO>" }`
- [ ] If PostgreSQL connection fails, returns `503` with `{ "status": "error", "db": "disconnected" }`
- [ ] Response time under 100ms
- [ ] Endpoint requires no authentication

---

#### US-021: Implement Hotmart Webhook Receiver with HMAC Validation
**Description:** As Nathan, I want a secure webhook endpoint that receives and validates Hotmart events.

**Acceptance Criteria:**
- [ ] `POST /hotmart` endpoint accepts Hotmart webhook payloads
- [ ] HMAC-SHA256 signature validated against `HOTMART_WEBHOOK_SECRET` from env
- [ ] Invalid signature returns `401 Unauthorized` with no processing
- [ ] Missing signature header returns `400 Bad Request`
- [ ] Valid requests return `200 OK` immediately (processing happens async)
- [ ] Raw payload logged to structured JSON logs for debugging
- [ ] Supported events: `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CANCELED`, `CART_ABANDONMENT`, `SUBSCRIPTION_CANCELLATION`
- [ ] Unsupported events logged and ignored (return 200 to avoid Hotmart retries)

---

#### US-022: Implement Lead Upsert Service
**Description:** As Nathan, I want incoming Hotmart data to create or update leads in the database so I have a unified contact list.

**Acceptance Criteria:**
- [ ] Function `upsertLead(data)` accepts buyer data from Hotmart payload
- [ ] Email normalized to lowercase and trimmed
- [ ] Phone normalized to E.164 format (Brazilian numbers: +55...)
- [ ] Name split into first_name and last_name
- [ ] If lead with same email exists → update (UPSERT on email)
- [ ] If new lead → INSERT with source from event type
- [ ] Returns the lead record (including id) for downstream use
- [ ] Handles missing optional fields gracefully (phone, name)

---

#### US-023: Implement Conversion Recording Service
**Description:** As Nathan, I want each Hotmart purchase recorded in the conversions table for analytics and Meta CAPI.

**Acceptance Criteria:**
- [ ] Function `recordConversion(leadId, hotmartData)` inserts into `conversions` table
- [ ] Extracts: product name, amount, currency, payment method, status, hotmart_tx_id
- [ ] `hotmart_tx_id` is unique — duplicate transactions are rejected (idempotent)
- [ ] `event_id` generated as the `hotmart_tx_id` (for Meta deduplication)
- [ ] `sent_to_meta` defaults to `false`, updated after successful CAPI send
- [ ] Returns the conversion record for downstream use

---

#### US-024: Implement Meta Conversions API (CAPI) Service
**Description:** As Nathan, I want purchase events sent to Meta's Conversions API so the ad algorithm receives server-side conversion data.

**Acceptance Criteria:**
- [ ] Function `sendToMetaCAPI(lead, conversion)` sends Purchase event to Meta Graph API
- [ ] PII fields hashed with SHA256 before sending: email (em), phone (ph), first name (fn), last name (ln)
- [ ] Country code included when available
- [ ] `event_id` set to `hotmart_tx_id` for deduplication with Pixel
- [ ] `event_time` set to Hotmart transaction timestamp (Unix seconds)
- [ ] `action_source` set to `website`
- [ ] Uses `META_PIXEL_ID` and `META_ACCESS_TOKEN` from env
- [ ] HTTP POST to `https://graph.facebook.com/v21.0/{PIXEL_ID}/events`
- [ ] Response logged to `meta_events` table (event_name, event_id, response_code, response_body)
- [ ] On success: `conversions.sent_to_meta` updated to `true`
- [ ] On failure: event added to `retry_queue` with exponential backoff
- [ ] Only `PURCHASE_APPROVED` and `PURCHASE_COMPLETE` trigger Meta CAPI events

---

#### US-025: Implement Chatwoot Contact Sync Service
**Description:** As Nathan, I want leads automatically created/updated in Chatwoot so the CRM stays in sync.

**Acceptance Criteria:**
- [ ] Function `syncToChatwoot(lead, eventType, metadata)` creates or updates contact via Chatwoot API
- [ ] Uses Chatwoot API v1: `POST /api/v1/accounts/{id}/contacts` (create) and `PATCH` (update)
- [ ] Sets contact attributes: name, email, phone, custom attributes (produto, hotmart_tx_id, source, purchase_amount)
- [ ] Applies labels based on event type:
  - `PURCHASE_APPROVED` → add label `cliente`
  - `PURCHASE_REFUNDED` → remove `cliente`, add `refund`
  - `PURCHASE_CANCELED` → add `cancelado`
  - `CART_ABANDONMENT` → add `carrinho_abandonado`
  - `SUBSCRIPTION_CANCELLATION` → add `ex-assinante`
- [ ] Stores `chatwoot_contact_id` in leads table for future updates
- [ ] Uses `CHATWOOT_API_TOKEN` and `CHATWOOT_ACCOUNT_ID` from env
- [ ] On failure: event added to `retry_queue`

---

#### US-026: Implement WhatsApp Template Messaging via Chatwoot
**Description:** As Nathan, I want dc-bridge to send WhatsApp template messages through Chatwoot's API.

**Acceptance Criteria:**
- [ ] Function `sendWhatsAppTemplate(chatwootContactId, templateName, templateParams)` sends a template message
- [ ] Uses Chatwoot API to send template message on the WhatsApp channel
- [ ] Template name and parameters are configurable per event type
- [ ] Mapping defined in config:
  - `PURCHASE_APPROVED` → template `purchase_confirmed` with product name + access link
  - `PURCHASE_REFUNDED` → template `refund_response`
  - `CART_ABANDONMENT` → template `cart_abandoned` with product name + discount link
  - `SUBSCRIPTION_CANCELLATION` → template `subscription_canceled` with offer link
- [ ] Success/failure logged with contact ID and template name
- [ ] On failure: added to `retry_queue`

---

#### US-027: Implement Scheduled Message System (Cart Abandonment Delay)
**Description:** As Nathan, I want cart abandonment WhatsApp messages delayed by 20 minutes, with auto-cancellation if the user purchases.

**Acceptance Criteria:**
- [ ] On `CART_ABANDONMENT` event: insert into `scheduled_messages` with `scheduled_for = now + 20 minutes`
- [ ] Cron job runs every 60 seconds checking for due messages (`scheduled_for <= now AND sent = false AND canceled = false`)
- [ ] Due messages: call `sendWhatsAppTemplate` and mark `sent = true`
- [ ] On `PURCHASE_APPROVED`: check `scheduled_messages` for same lead with `sent = false` → set `canceled = true`
- [ ] Canceled messages are never sent
- [ ] All state changes logged for auditability
- [ ] Edge case: if lead has no phone number, skip WhatsApp and log warning

---

#### US-028: Implement Listmonk Subscriber Sync
**Description:** As Nathan, I want Hotmart buyers automatically added to the appropriate Listmonk list.

**Acceptance Criteria:**
- [ ] Function `syncToListmonk(lead, eventType)` manages subscribers via Listmonk API
- [ ] On `PURCHASE_APPROVED`: add subscriber to "Pos-Venda" list via `POST /api/subscribers`
- [ ] On `PURCHASE_REFUNDED`: remove subscriber from "Pos-Venda" list (or update status to blocklisted)
- [ ] Subscriber data: email, name, attributes (product, purchase_date)
- [ ] Uses `LISTMONK_API_USER` and `LISTMONK_API_PASSWORD` from env
- [ ] Duplicate subscribers handled gracefully (Listmonk returns 409 → treat as success)
- [ ] Stores `listmonk_subscriber_id` in leads table
- [ ] On failure: added to `retry_queue`

---

#### US-029: Implement Retry Queue Processor
**Description:** As Nathan, I want failed events retried automatically with exponential backoff so no data is lost.

**Acceptance Criteria:**
- [ ] Cron job runs every 60 seconds checking `retry_queue` for items where `next_retry <= now AND attempts < max_attempts`
- [ ] Each retry: increment `attempts`, execute the event, update `last_error` on failure
- [ ] Backoff schedule: 1min, 5min, 15min, 60min, 240min (exponential)
- [ ] After `max_attempts` (5): mark as permanently failed, log error alert
- [ ] Successful retry: delete from `retry_queue`
- [ ] `event_type` field determines which service to call (meta_capi, chatwoot, listmonk, whatsapp)
- [ ] `payload` JSONB contains all data needed to retry the operation

---

#### US-030: Implement Structured JSON Logging
**Description:** As Nathan, I want structured logs so I can debug issues and audit all webhook processing.

**Acceptance Criteria:**
- [ ] All log output in JSON format: `{ "level", "message", "timestamp", "event_type", "lead_id", "error", ... }`
- [ ] Log levels: `info`, `warn`, `error`
- [ ] Every webhook received: log event_type, hotmart_tx_id, lead email (masked)
- [ ] Every Meta CAPI call: log event_id, response_code
- [ ] Every Chatwoot sync: log contact_id, labels applied
- [ ] Every WhatsApp send: log template_name, contact_id, success/failure
- [ ] Every retry: log attempt number, event_type, error
- [ ] Logs written to stdout (Docker collects via `docker compose logs dc-bridge`)
- [ ] No PII (full email, phone) in logs — use masked versions (e.g., `n***@digital...`)

---

#### US-031: Wire Up the Hotmart Event Router
**Description:** As Nathan, I want a central router that orchestrates all services per event type so the full pipeline executes on each webhook.

**Acceptance Criteria:**
- [ ] Router function receives validated Hotmart payload and event type
- [ ] For `PURCHASE_APPROVED`:
  1. Upsert lead → 2. Record conversion → 3. Send to Meta CAPI → 4. Sync to Chatwoot (label: cliente) → 5. Send WhatsApp template → 6. Add to Listmonk
- [ ] For `PURCHASE_COMPLETE`:
  1. Upsert lead → 2. Record conversion (if not exists) → 3. Send to Meta CAPI (if not sent) → 4. Update Chatwoot labels
- [ ] For `PURCHASE_REFUNDED`:
  1. Upsert lead → 2. Update conversion status → 3. Update Chatwoot (label: refund) → 4. Send WhatsApp template → 5. Remove from Listmonk list
- [ ] For `PURCHASE_CANCELED`:
  1. Upsert lead → 2. Update conversion status → 3. Update Chatwoot (label: cancelado)
- [ ] For `CART_ABANDONMENT`:
  1. Upsert lead → 2. Sync to Chatwoot (label: carrinho_abandonado) → 3. Schedule WhatsApp (20min delay)
- [ ] For `SUBSCRIPTION_CANCELLATION`:
  1. Upsert lead → 2. Update subscription status → 3. Update Chatwoot (label: ex-assinante) → 4. Send WhatsApp template
- [ ] Each step is independent — failure in one does not block others (errors go to retry_queue)
- [ ] Processing is async — webhook returns 200 before pipeline completes

---

#### US-032: Add dc-bridge to Docker Compose
**Description:** As Nathan, I want dc-bridge running as a Docker container alongside all other services.

**Acceptance Criteria:**
- [ ] dc-bridge service added to `docker-compose.yml`
- [ ] Builds from `./dc-bridge/Dockerfile`
- [ ] Environment variables injected from `.env`
- [ ] Depends on: postgres, redis (if needed)
- [ ] Internal port 3100 exposed to Caddy network
- [ ] Health check configured: `GET /health`
- [ ] Restart policy: `unless-stopped`
- [ ] Memory limit set: 128MB (soft), 256MB (hard)
- [ ] `docker compose up dc-bridge` starts without errors
- [ ] Caddy routes `webhook.digitalcopilot.app` to dc-bridge

---

#### US-033: Configure Stape.io and sGTM Container
**Description:** As Nathan, I want server-side GTM running via Stape.io so web events reach Meta CAPI with anti-adblocker support.

**Acceptance Criteria:**
- [ ] Stape.io account created with Starter plan ($20/month)
- [ ] sGTM container provisioned on Stape.io
- [ ] Custom domain configured for first-party tracking (e.g., `t.digitalcopilot.app`)
- [ ] Custom Loader enabled (anti-adblocker)
- [ ] Cookie Keeper enabled (90+ day attribution)
- [ ] sGTM container responds to requests on custom domain
- [ ] Configuration documented in `docs/stape-setup.md`

---

#### US-034: Configure GTM Web Container for Meta Pixel + sGTM
**Description:** As Nathan, I want a GTM Web container that sends events both to Meta Pixel (client-side) and sGTM (server-side).

**Acceptance Criteria:**
- [ ] GTM Web container created in Google Tag Manager
- [ ] Meta Pixel base tag configured (client-side fallback)
- [ ] Transport URL set to sGTM custom domain (first-party)
- [ ] Events configured: PageView, ViewContent, InitiateCheckout, Lead
- [ ] DataLayer variables configured for: user email (hashed), user_id (when available)
- [ ] Consent Mode v2 implemented for LGPD compliance
- [ ] GTM container ID documented for WordPress integration
- [ ] Configuration documented in `docs/gtm-setup.md`

---

#### US-035: Configure sGTM Tags for Meta Conversions API
**Description:** As Nathan, I want sGTM to process web events and forward them to Meta CAPI with enriched data.

**Acceptance Criteria:**
- [ ] Meta CAPI tag configured in sGTM container
- [ ] Pixel ID and Access Token configured as sGTM variables
- [ ] Events forwarded: PageView, ViewContent, InitiateCheckout, Lead, Purchase
- [ ] Event deduplication enabled (event_id matching between Pixel and CAPI)
- [ ] User data parameters forwarded: em, ph, fbc, fbp, client_ip_address, client_user_agent
- [ ] Event Match Quality (EMQ) target: > 7.0
- [ ] Test events visible in Meta Events Manager with "Server" source
- [ ] Configuration documented in `docs/sgtm-meta-capi.md`

---

#### US-036: Integrate GTM with WordPress Sites
**Description:** As Nathan, I want GTM installed on WordPress sites so web tracking starts capturing events.

**Acceptance Criteria:**
- [ ] GTM4WP plugin (or equivalent) installed on target WordPress site
- [ ] GTM container ID configured in plugin settings
- [ ] PageView event firing on every page load (verified in GTM Preview mode)
- [ ] ViewContent event firing on product/sales pages
- [ ] DataLayer enhanced with logged-in user email (SHA256 hashed) when available
- [ ] Consent Mode v2 banner implemented (LGPD)
- [ ] Events appearing in Meta Events Manager from both Pixel (browser) and CAPI (server)
- [ ] Integration steps documented in `docs/wordpress-gtm-integration.md`

---

### PHASE 5 — Monitoring, Backups & Go-Live

---

#### US-037: Deploy Uptime Kuma Monitoring
**Description:** As Nathan, I want all services monitored so I get alerts when something goes down.

**Acceptance Criteria:**
- [ ] Uptime Kuma container running on internal port 3001
- [ ] Accessible via `status.digitalcopilot.app` (HTTPS through Caddy)
- [ ] Admin account created with secure credentials
- [ ] Health checks configured for:
  - Stalwart Mail (SMTP port 587)
  - Listmonk (`campaigns.digitalcopilot.app`)
  - SnappyMail (`webmail.digitalcopilot.app`)
  - Chatwoot (`crm.digitalcopilot.app`)
  - dc-bridge (`webhook.digitalcopilot.app/health`)
  - PostgreSQL (TCP port 5432)
  - Redis (TCP port 6379)
- [ ] Check interval: 60 seconds
- [ ] Alert notifications configured (email or Telegram or Discord)
- [ ] Public status page enabled (optional, for transparency)

---

#### US-038: Configure Automated Backups
**Description:** As Nathan, I want daily automated backups so I can recover from data loss.

**Acceptance Criteria:**
- [ ] Cron job: `pg_dump` for all three databases (listmonk, chatwoot, dcbridge) — daily at 03:00 UTC
- [ ] Cron job: backup Stalwart volume (`/opt/stalwart`) — daily at 03:30 UTC
- [ ] Cron job: Redis RDB snapshot — daily at 03:15 UTC
- [ ] Backups compressed with gzip
- [ ] Retention: PostgreSQL 30 days, Stalwart 14 days, Redis 7 days
- [ ] Old backups auto-deleted by cleanup cron
- [ ] Backup script: `scripts/backup.sh` (runs all backups)
- [ ] Restore script: `scripts/restore.sh` (restores from backup)
- [ ] Backup tested: dump → destroy → restore → verify data integrity
- [ ] Backup storage: local `/backups/` directory (consider offsite in future)

---

#### US-039: End-to-End Test — Purchase Flow
**Description:** As Nathan, I want to verify the complete purchase flow works from Hotmart webhook to all downstream systems.

**Acceptance Criteria:**
- [ ] Simulate `PURCHASE_APPROVED` webhook to `webhook.digitalcopilot.app/hotmart` with valid HMAC
- [ ] Lead created/updated in PostgreSQL `leads` table
- [ ] Conversion recorded in PostgreSQL `conversions` table
- [ ] Purchase event sent to Meta CAPI — visible in Meta Events Manager (test event)
- [ ] Contact created in Chatwoot with label `cliente` and custom attributes
- [ ] WhatsApp template `purchase_confirmed` sent via Chatwoot
- [ ] Subscriber added to Listmonk "Pos-Venda" list
- [ ] All steps logged in dc-bridge structured logs
- [ ] Total latency from webhook receipt to last action: < 30 seconds

---

#### US-040: End-to-End Test — Cart Abandonment Flow
**Description:** As Nathan, I want to verify the cart abandonment recovery flow including delayed WhatsApp and auto-cancellation.

**Acceptance Criteria:**
- [ ] Simulate `CART_ABANDONMENT` webhook → lead created, scheduled message inserted (20min delay)
- [ ] Wait 20 minutes → WhatsApp template `cart_abandoned` sent via Chatwoot
- [ ] Chatwoot contact has label `carrinho_abandonado`
- [ ] **Cancellation test:** Simulate `CART_ABANDONMENT` → then simulate `PURCHASE_APPROVED` within 20 minutes
- [ ] Verify: scheduled WhatsApp message is canceled (`canceled = true`)
- [ ] Verify: purchase flow executes normally (label changes from `carrinho_abandonado` to `cliente`)
- [ ] All state transitions logged

---

#### US-041: End-to-End Test — Refund and Cancellation Flows
**Description:** As Nathan, I want to verify refund and subscription cancellation flows update all systems correctly.

**Acceptance Criteria:**
- [ ] Simulate `PURCHASE_REFUNDED` → conversion status updated, Chatwoot label changed to `refund`, WhatsApp sent, Listmonk subscriber removed
- [ ] Simulate `PURCHASE_CANCELED` → conversion status updated, Chatwoot label `cancelado`
- [ ] Simulate `SUBSCRIPTION_CANCELLATION` → subscription record updated, Chatwoot label `ex-assinante`, WhatsApp sent
- [ ] Meta CAPI NOT called for refunds/cancellations (only purchases)
- [ ] All state transitions logged correctly

---

#### US-042: Verify Resource Usage Under Load
**Description:** As Nathan, I want to confirm the server stays under 6GB RAM with all services running.

**Acceptance Criteria:**
- [ ] All containers running simultaneously
- [ ] `docker stats` shows total RAM usage < 6GB
- [ ] Individual container limits respected (dc-bridge < 256MB, Redis < 256MB)
- [ ] Chatwoot (web + sidekiq) under 2GB combined
- [ ] CPU usage stable under 80% during normal operation
- [ ] Disk usage documented and under 50% of 100GB NVMe
- [ ] Resource snapshot saved in `docs/resource-baseline.md`

---

#### US-043: Create Operational Runbook
**Description:** As Nathan, I want a runbook documenting all maintenance procedures so I can operate the system confidently.

**Acceptance Criteria:**
- [ ] `docs/runbook.md` created covering:
  - How to start/stop/restart individual services
  - How to view logs for each service
  - How to add a new email domain to Stalwart
  - How to add a new email account
  - How to add a new Listmonk list/template
  - How to run database migrations for dc-bridge
  - How to manually trigger a backup and restore
  - How to check service health (Uptime Kuma + manual)
  - How to update Docker images
  - How to add a new Hotmart product to dc-bridge config
  - How to debug failed webhooks (check retry_queue)
  - How to check Meta CAPI event delivery
  - Common troubleshooting scenarios and solutions

---

#### US-044: Production Go-Live
**Description:** As Nathan, I want to cut over to production traffic after all tests pass.

**Acceptance Criteria:**
- [ ] All end-to-end tests passing (US-039, US-040, US-041)
- [ ] Resource usage within limits (US-042)
- [ ] Uptime Kuma showing all services green for 24+ hours
- [ ] Backups running and verified (US-038)
- [ ] Hotmart webhook URL configured in Hotmart dashboard pointing to `webhook.digitalcopilot.app/hotmart`
- [ ] WordPress sites tracking events via GTM (US-036)
- [ ] First real Hotmart transaction processed successfully end-to-end
- [ ] System stable for 48 hours with real traffic
- [ ] Go-live confirmed and documented

---

## Functional Requirements

- **FR-01:** All services run as Docker containers orchestrated by a single `docker-compose.yml`
- **FR-02:** Caddy reverse proxy handles HTTPS termination and subdomain routing for all web services
- **FR-03:** Stalwart Mail supports multi-domain email with DKIM/SPF/DMARC per domain
- **FR-04:** SnappyMail provides browser-based email access via IMAP/SMTP to Stalwart
- **FR-05:** Listmonk manages subscriber lists with segmentation, templates, and scheduled campaigns
- **FR-06:** Listmonk sends email via Stalwart SMTP with configurable rate limiting
- **FR-07:** Chatwoot provides CRM with contact profiles, labels, custom attributes, and conversation history
- **FR-08:** Chatwoot integrates with WhatsApp Cloud API for template messaging
- **FR-09:** dc-bridge receives Hotmart webhooks and validates HMAC signatures
- **FR-10:** dc-bridge normalizes buyer data (email lowercase, phone E.164, name split)
- **FR-11:** dc-bridge persists leads and conversions in PostgreSQL
- **FR-12:** dc-bridge sends Purchase events to Meta Conversions API with SHA256-hashed PII
- **FR-13:** dc-bridge uses `hotmart_tx_id` as `event_id` for Meta deduplication
- **FR-14:** dc-bridge syncs contacts to Chatwoot with event-appropriate labels
- **FR-15:** dc-bridge sends WhatsApp template messages via Chatwoot API per event type
- **FR-16:** dc-bridge schedules cart abandonment WhatsApp messages with 20-minute delay
- **FR-17:** dc-bridge cancels scheduled messages when a purchase occurs before the delay expires
- **FR-18:** dc-bridge adds/removes Listmonk subscribers based on purchase/refund events
- **FR-19:** dc-bridge implements a retry queue with exponential backoff for failed operations
- **FR-20:** dc-bridge produces structured JSON logs with masked PII
- **FR-21:** sGTM (Stape.io) forwards web events to Meta CAPI with deduplication
- **FR-22:** GTM Web fires PageView, ViewContent, InitiateCheckout, and Lead events on WordPress sites
- **FR-23:** Consent Mode v2 implemented on all WordPress sites for LGPD compliance
- **FR-24:** Uptime Kuma monitors health of all services with 60-second intervals
- **FR-25:** Automated daily backups for PostgreSQL (30-day retention), Stalwart (14 days), Redis (7 days)
- **FR-26:** Email warm-up follows a 4-week graduated schedule

---

## Non-Goals

- **No custom email client** — SnappyMail is used as-is, no custom frontend
- **No self-hosted sGTM** — Stape.io handles server-side GTM (no GCP containers)
- **No self-hosted WhatsApp API** — Using official WhatsApp Cloud API via Meta, not WAHA
- **No multi-tenant architecture** — Single-tenant, multi-project via lists/labels/domains
- **No A/B testing framework** — Campaign A/B testing is not in scope
- **No mobile app** — All interfaces are web-based
- **No custom analytics dashboard** — Meta Events Manager + Listmonk analytics + Chatwoot reports are sufficient
- **No automated scaling** — Single server, manual upgrade to KVM 4 if needed
- **No CI/CD pipeline** — Deployment via SSH + `docker compose up -d` (can be added later)
- **No payment processing** — Hotmart handles all payments; dc-bridge only receives webhook events

---

## Technical Considerations

- **RAM Budget:** Total target < 6GB of 8GB available. Chatwoot is the heaviest service (~1.5-2GB). Monitor closely.
- **Shared PostgreSQL:** Three databases on one instance. Tune `shared_buffers` (512MB) and `work_mem` (4MB) for shared use.
- **Port Conflicts:** Stalwart needs direct TCP access on ports 25/587/465/993 (not through Caddy). Web services go through Caddy on 443.
- **IP Reputation:** New IP requires warm-up. Check blacklists before provisioning. Request rDNS/PTR from Hostinger.
- **Hostinger Rate Limit:** Initial limit of ~5 emails/min. Plan warm-up accordingly and request increases.
- **Docker Networking:** All containers on a shared bridge network (`dc-network`). Services reference each other by container name.
- **Secrets Management:** All secrets in `.env` file, never committed to git. Docker secrets for production hardening (optional).
- **Timezone:** Server and all containers set to UTC. Timestamps stored in UTC.

---

## Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Email delivery rate | > 95% | Stalwart logs + Listmonk bounce rate |
| Meta Event Match Quality (EMQ) | > 7.0 / 10 | Meta Events Manager |
| Conversions captured vs actual | > 90% | Meta events vs Hotmart sales |
| Cart recovery rate | > 5% | Purchases after abandonment WA / total abandonments |
| Service uptime | > 99.5% | Uptime Kuma dashboard |
| Webhook-to-Meta latency | < 30 seconds | dc-bridge logs timestamps |
| Total RAM usage | < 6 GB | `docker stats` |
| Campaign send speed | < 5 min for 1000 emails | Listmonk logs |

---

## Open Questions

1. **Hotmart webhook secret:** Has the Hotmart webhook been configured with a secret for HMAC validation? What is the exact header name Hotmart uses for the signature?
2. **WhatsApp phone number:** Is there a dedicated phone number for WhatsApp Business API, or does one need to be acquired?
3. **Meta Business Manager:** Is the Meta Business Manager already approved and the Pixel created? What is the Pixel ID?
4. **WordPress sites:** How many WordPress sites need GTM integration initially? Are they on the same server or external hosting?
5. **Hotmart products:** How many products/offers are active? Does dc-bridge need product-specific routing (different templates per product)?
6. **Offsite backups:** Should backups be copied to an external location (S3, another server), or is local storage sufficient for now?
7. **Additional domains:** Are there specific project domains ready to be added to Stalwart in Phase 2, or just digitalcopilot.app initially?
8. **Stape.io account:** Is the Stape.io account already created, or does it need to be provisioned?
9. **Chatwoot agents:** How many support agents will use Chatwoot? This affects Sidekiq worker configuration.
