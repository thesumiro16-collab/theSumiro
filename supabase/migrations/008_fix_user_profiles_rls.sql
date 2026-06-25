-- =============================================================================
-- Migration 008: Fix user_profiles RLS recursion
-- =============================================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "admin_all_user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "staff_own_user_profile_select" ON user_profiles;
DROP POLICY IF EXISTS "staff_own_user_profile_update" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_insert_own_profile" ON user_profiles;

-- 1. SELECT Policy
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- 2. INSERT Policy
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (id = auth.uid() AND role = 'staff') OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- 3. UPDATE Policy
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin' OR
    (id = auth.uid() AND role = 'staff')
  );

-- 4. DELETE Policy
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );
