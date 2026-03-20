-- =============================================================================
-- dc-bridge: Chatwoot Conversion Analysis Agent
-- Adds agent cursors, conversion attributions, and agent config to tenants
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Agent cursors — watermark per tenant for conversation processing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_cursors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    last_processed_id BIGINT NOT NULL DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    items_processed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id)
);

-- ---------------------------------------------------------------------------
-- Conversion attributions — result of the agent analysis
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversion_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    conversion_id UUID NOT NULL REFERENCES conversions(id),
    lead_id UUID NOT NULL REFERENCES leads(id),
    conversation_id BIGINT,
    attribution_source VARCHAR(50) NOT NULL,
    detail JSONB DEFAULT '{}',
    meta_event_sent BOOLEAN NOT NULL DEFAULT FALSE,
    meta_event_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (conversion_id)
);

CREATE INDEX IF NOT EXISTS idx_attributions_tenant ON conversion_attributions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_attributions_lead ON conversion_attributions (lead_id);
CREATE INDEX IF NOT EXISTS idx_attributions_source ON conversion_attributions (attribution_source);

-- ---------------------------------------------------------------------------
-- New tenant columns for agent configuration
-- ---------------------------------------------------------------------------
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS conversion_rules JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS agent_interval_minutes INTEGER NOT NULL DEFAULT 5;
