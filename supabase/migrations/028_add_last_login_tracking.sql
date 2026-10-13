-- =============================================================================
-- Migration 028: Add Last Login Tracking to User Management
-- Run this in Supabase Dashboard -> SQL Editor
-- =============================================================================

-- 1. Add last sign-in timestamp to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create RPC to record user login timestamp
CREATE OR REPLACE FUNCTION public.record_user_sign_in()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.user_profiles
  SET last_sign_in_at = now()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_user_sign_in() TO authenticated;

-- Also support optional param signature if called with argument
CREATE OR REPLACE FUNCTION public.record_user_sign_in(p_ip TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.user_profiles
  SET last_sign_in_at = now()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_user_sign_in(TEXT) TO authenticated;

-- 3. Update get_users_with_emails() RPC to return last sign-in timestamp
DROP FUNCTION IF EXISTS public.get_users_with_emails();

CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE (
  id              UUID,
  full_name       TEXT,
  role            TEXT,
  permissions     JSONB,
  created_at      TIMESTAMPTZ,
  email           TEXT,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    au.email::TEXT,
    up.last_sign_in_at
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.id
  ORDER BY up.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_with_emails() TO authenticated;
