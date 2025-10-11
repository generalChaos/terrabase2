-- Make flow_id nullable in debug_logs for system-level logging
ALTER TABLE debug_logs ALTER COLUMN flow_id DROP NOT NULL;
