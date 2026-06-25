-- =============================================================================
-- Migration 004: Remove Design Number Auto-Generation
-- Change design_no from auto-generated to user-entered
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Drop the trigger that auto-generates design_no
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_generate_design_no ON designs;

-- -----------------------------------------------------------------------------
-- 2. Drop the trigger function
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS generate_design_no();

-- -----------------------------------------------------------------------------
-- 3. Drop the sequence (optional - keep if you want to resume numbering later)
-- -----------------------------------------------------------------------------
-- Uncomment the line below if you want to completely remove the sequence:
-- DROP SEQUENCE IF EXISTS designs_design_no_seq;

-- -----------------------------------------------------------------------------
-- Note: The design_no column in the designs table remains unchanged.
-- It's still TEXT UNIQUE NOT NULL, but now users must provide the value.
-- -----------------------------------------------------------------------------
