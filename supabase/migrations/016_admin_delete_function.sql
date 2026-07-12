-- ============================================================
-- Migration 016: Add admin delete function + fix permissions column
-- Run ALL of this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add permissions column if it doesn't exist yet
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

-- 2. Create a SECURITY DEFINER function that allows admins to delete
--    other user profiles, bypassing RLS safely.
CREATE OR REPLACE FUNCTION admin_delete_user_profile(target_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Must be an admin to call this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;

  -- Cannot delete your own account
  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  DELETE FROM user_profiles WHERE id = target_id;
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

-- Grant to authenticated users only (is_admin() check inside guards it)
GRANT EXECUTE ON FUNCTION admin_delete_user_profile(UUID) TO authenticated;

-- 3. Verify
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'admin_delete_user_profile';
