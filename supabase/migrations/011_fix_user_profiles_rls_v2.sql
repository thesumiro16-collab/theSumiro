-- =============================================================================
-- Migration 011: Fix user_profiles RLS recursion (v2)
--
-- Problem: Migration 008 replaced the original policies but inlined
--   (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
-- directly inside each policy's USING / WITH CHECK clause. Because this
-- sub-select hits the same user_profiles table that is protected by RLS,
-- PostgreSQL enters infinite recursion trying to evaluate the policy.
--
-- Fix: Use the is_admin() SECURITY DEFINER function (created in migration
-- 002) which bypasses RLS when checking the role, breaking the cycle.
-- =============================================================================

-- 1. Drop the broken policies from migration 008
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete" ON user_profiles;

-- 2. Ensure the SECURITY DEFINER helper exists (idempotent)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate user_profiles policies using is_admin()

-- SELECT: users can read their own row; admins can read all rows
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin());

-- INSERT: users can create their own profile; admins can create any
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR is_admin());

-- UPDATE: users can update their own row; admins can update any
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

-- DELETE: admin only
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin());
