-- =============================================================================
-- Migration 010: Add rate column to shared_folders
--   Stores the customer-specific rate quoted when sharing a folder.
--   Nullable so existing rows are unaffected.
-- =============================================================================

ALTER TABLE shared_folders
  ADD COLUMN rate NUMERIC(10, 2) DEFAULT NULL;
