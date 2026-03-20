-- =============================================================================
-- dc-bridge: Multi-Tenant Support
-- Adds tenants table and tenant_id FK to all data tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tenants — One row per client
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Hotmart
    hotmart_webhook_secret TEXT,
    hotmart_product_ids TEXT[],

    -- Meta CAPI
    meta_pixel_id VARCHAR(50),
    meta_access_token TEXT,

    -- Chatwoot
    chatwoot_account_id INTEGER,
    chatwoot_api_token TEXT,
    chatwoot_whatsapp_inbox_id INTEGER,

    -- Listmonk
    listmonk_list_ids JSONB DEFAULT '{}',

    -- WhatsApp templates (overrides global defaults; null = use defaults)
    whatsapp_templates JSONB,

    -- Email / Stalwart
    email_domain VARCHAR(255),
    sender_email VARCHAR(255),

    -- Stape / sGTM
    stape_custom_domain VARCHAR(255),
    gtm_container_id VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Add tenant_id to all data tables (nullable first for migration)
-- ---------------------------------------------------------------------------

ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE meta_events ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE scheduled_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE retry_queue ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- ---------------------------------------------------------------------------
-- Replace leads unique index: email is unique PER TENANT, not globally
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_leads_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_tenant_email ON leads (tenant_id, email);

-- ---------------------------------------------------------------------------
-- Add tenant_id indexes for filtered queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_conversions_tenant ON conversions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tenant ON scheduled_messages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_retry_tenant ON retry_queue (tenant_id);

-- ---------------------------------------------------------------------------
-- Note: After inserting the default tenant and backfilling existing rows,
-- run 003_enforce_tenant_notnull.sql to add NOT NULL constraints.
-- This is done in a separate migration to allow gradual rollout.
-- ---------------------------------------------------------------------------
