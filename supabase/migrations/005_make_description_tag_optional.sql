-- =============================================================================
-- Migration 005: Make description and tag fields optional (nullable)
-- =============================================================================

-- Make description nullable
ALTER TABLE designs 
  ALTER COLUMN description DROP NOT NULL;

-- Make tag nullable
ALTER TABLE designs 
  ALTER COLUMN tag DROP NOT NULL;
