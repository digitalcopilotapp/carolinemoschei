-- =============================================================================
-- dc-bridge: Enforce tenant_id NOT NULL after backfill
-- Run AFTER inserting default tenant and backfilling existing rows.
-- =============================================================================

-- Only enforce NOT NULL on tables that have been fully backfilled.
-- If any rows have NULL tenant_id, this migration will fail — that's intentional.

ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE conversions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE scheduled_messages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN tenant_id SET NOT NULL;

-- meta_events and retry_queue keep nullable for flexibility
