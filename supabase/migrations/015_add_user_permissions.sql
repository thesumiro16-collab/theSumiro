-- ============================================================
-- Migration 015: Add granular permissions column to user_profiles
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "dashboard": true,
  "shared_folders": true,
  "inbox": true,
  "ticker": true,
  "settings": true,
  "about_editor": true,
  "seo": false,
  "users": false
}'::jsonb;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'permissions';
