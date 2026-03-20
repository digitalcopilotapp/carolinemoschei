-- =============================================================================
-- dc-bridge: Initial Schema
-- Tables: leads, conversions, meta_events, scheduled_messages, retry_queue, subscriptions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Leads — Unified contact database
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    name VARCHAR(255),
    first_name VARCHAR(127),
    last_name VARCHAR(127),
    source VARCHAR(50),
    country VARCHAR(5),
    chatwoot_contact_id INTEGER,
    listmonk_subscriber_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads (phone);

-- ---------------------------------------------------------------------------
-- Conversions — Purchase history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    product VARCHAR(255),
    amount NUMERIC(12, 2),
    currency VARCHAR(5) DEFAULT 'BRL',
    status VARCHAR(30) NOT NULL DEFAULT 'approved',
    payment_method VARCHAR(50),
    hotmart_tx_id VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    sent_to_meta BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversions_hotmart_tx ON conversions (hotmart_tx_id);

-- ---------------------------------------------------------------------------
-- Meta Events — Log of events sent to Meta Conversions API
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversion_id UUID REFERENCES conversions(id) ON DELETE SET NULL,
    event_name VARCHAR(50) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    response_code INTEGER,
    response_body TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Scheduled Messages — Delayed WhatsApp/email sends
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    template_name VARCHAR(100) NOT NULL,
    template_params JSONB DEFAULT '{}',
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    canceled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_pending
    ON scheduled_messages (scheduled_for)
    WHERE sent = FALSE AND canceled = FALSE;

-- ---------------------------------------------------------------------------
-- Retry Queue — Failed operations with exponential backoff
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retry_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_retry TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retry_pending
    ON retry_queue (next_retry)
    WHERE attempts < max_attempts;

-- ---------------------------------------------------------------------------
-- Subscriptions — Recurring billing tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    plan VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    hotmart_subscription_id VARCHAR(100),
    next_billing TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
