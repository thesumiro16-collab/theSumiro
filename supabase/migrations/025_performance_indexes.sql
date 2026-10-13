-- =============================================================================
-- Migration 025: Performance & Query Optimization Indexes
-- Run this in Supabase Dashboard -> SQL Editor
-- =============================================================================

-- Enable pg_trgm for fast ILIKE / substring searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- 1. design_photos: Composite index for design detail and preview card queries
-- Accelerates: .eq('design_id', id).order('sort_order', { ascending: true })
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_design_photos_design_id_sort_order
  ON design_photos (design_id, sort_order ASC);

-- Foreign key index on created_by (prevents table scans on user deletion)
CREATE INDEX IF NOT EXISTS idx_design_photos_created_by
  ON design_photos (created_by);

-- -----------------------------------------------------------------------------
-- 2. shared_folders: Composite & Export indexes
-- Accelerates: .eq('status', filter).order('created_at', { ascending: false })
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shared_folders_status_created_at
  ON shared_folders (status, created_at DESC);

-- Accelerates CSV export date range filter and ordering: .order('sent_date').gte/lte('sent_date')
CREATE INDEX IF NOT EXISTS idx_shared_folders_sent_date
  ON shared_folders (sent_date DESC);

-- Foreign key index on created_by
CREATE INDEX IF NOT EXISTS idx_shared_folders_created_by
  ON shared_folders (created_by);

-- -----------------------------------------------------------------------------
-- 3. contact_messages: Inbox sorting index
-- Accelerates: .from('contact_messages').order('created_at', { ascending: false })
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON contact_messages (created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. user_profiles: User listing sort index
-- Accelerates: .from('user_profiles').order('created_at', { ascending: true })
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at
  ON user_profiles (created_at ASC);

-- -----------------------------------------------------------------------------
-- 5. designs: Trigram GIN indexes for fast ILIKE keyword search
-- Accelerates: .or('design_no.ilike.%term%,fabric_name.ilike.%term%,tag.ilike.%term%')
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_designs_fabric_name_trgm
  ON designs USING gin (fabric_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_designs_tag_trgm
  ON designs USING gin (tag gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_designs_design_no_trgm
  ON designs USING gin (design_no gin_trgm_ops);
