-- ============================================================
-- Migration 017: RPC to fetch users with emails from auth.users
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
  id          UUID,
  full_name   TEXT,
  role        TEXT,
  permissions JSONB,
  created_at  TIMESTAMPTZ,
  email       TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins may call this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.full_name,
    up.role,
    up.permissions,
    up.created_at,
    au.email::TEXT
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.id
  ORDER BY up.created_at ASC;
END;
$$;

-- Grant to authenticated users (is_admin() check inside is the real guard)
GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;

-- Verify
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_users_with_emails';
