-- Add fbc/fbp columns to leads table for Meta CAPI Click ID matching.
-- These are captured from browser cookies (_fbc, _fbp) during frontend events
-- and forwarded to server-side Hotmart webhook events via stored lead data.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS fbc VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fbp VARCHAR(255);
