-- =============================================================================
-- Migration 006: Update shared_folders table - replace return_date with sent_date
-- =============================================================================

-- Add sent_date column (date when folder was shared)
ALTER TABLE shared_folders
  ADD COLUMN sent_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Remove return_date column (no longer needed)
ALTER TABLE shared_folders
  DROP COLUMN return_date;
