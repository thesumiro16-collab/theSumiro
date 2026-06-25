-- =============================================================================
-- Migration 013: Definitively fix is_admin() infinite RLS recursion
--
-- Root cause:
--   user_profiles RLS policy calls is_admin()
--   → is_admin() queries user_profiles
--   → that query evaluates user_profiles RLS policy
--   → which calls is_admin() again → infinite loop (code 42P17)
--
-- Fix:
--   Add "SET row_security = off" to the function declaration.
--   This is a per-call GUC override — for the duration of this
--   SECURITY DEFINER function (which runs as postgres/superuser),
--   RLS is bypassed, breaking the cycle.
--
--   This is the correct, documented PostgreSQL approach. The SET clause
--   on CREATE FUNCTION resets to the previous value when the function
--   returns, so it only affects queries inside this function.
-- =============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off          -- ← breaks the recursion cycle
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Re-assert execute grants (CREATE OR REPLACE preserves them, but be explicit)
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION is_admin() TO authenticated;
