-- =============================================================================
-- Migration 002: Row Level Security — Enable + All Policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Helper function to check if the authenticated user is an admin without RLS recursion
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 1. Enable RLS on all application tables
-- -----------------------------------------------------------------------------
ALTER TABLE designs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_photos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 2. user_profiles policies
-- =============================================================================

DROP POLICY IF EXISTS "admin_all_user_profiles" ON user_profiles;
-- Admin: full DML on all profiles
-- Requirement 12.7 — admin can SELECT, INSERT, UPDATE, DELETE any profile
CREATE POLICY "admin_all_user_profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "staff_own_user_profile_select" ON user_profiles;
-- Staff: SELECT own row only
-- Requirement 12.3 — non-admin user can only SELECT their own profile row
CREATE POLICY "staff_own_user_profile_select"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "staff_own_user_profile_update" ON user_profiles;
-- Staff: UPDATE own row only
-- Requirement 12.5 — staff can update their own profile
CREATE POLICY "staff_own_user_profile_update"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "authenticated_insert_own_profile" ON user_profiles;
-- Authenticated users: INSERT their own profile (used during sign-up)
-- Requirement 12.4, 5.6 — new users can create their own profile row
CREATE POLICY "authenticated_insert_own_profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());


-- =============================================================================
-- 3. designs policies
-- =============================================================================

DROP POLICY IF EXISTS "anon_select_public_designs" ON designs;
-- Anon: SELECT public designs only (portfolio Products page)
-- Requirement 12.9 — anon key may only read rows where is_public = true
CREATE POLICY "anon_select_public_designs"
  ON designs FOR SELECT
  TO anon
  USING (is_public = true);

DROP POLICY IF EXISTS "auth_select_all_designs" ON designs;
-- Authenticated: SELECT all designs
-- Requirement 12.2 — authenticated users can read all design rows
CREATE POLICY "auth_select_all_designs"
  ON designs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_own_designs" ON designs;
-- Authenticated: INSERT own designs only
-- Requirement 12.4 — created_by must equal the caller's UID
CREATE POLICY "auth_insert_own_designs"
  ON designs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "auth_update_any_design" ON designs;
-- Authenticated: UPDATE any design (collaborative management)
-- Requirement 12.5 — all authenticated users may update any design
CREATE POLICY "auth_update_any_design"
  ON designs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_designs" ON designs;
-- Admin only: DELETE designs
-- Requirement 12.6 — only admin role may delete design rows
CREATE POLICY "admin_delete_designs"
  ON designs FOR DELETE
  TO authenticated
  USING (is_admin());


-- =============================================================================
-- 4. design_photos policies
-- =============================================================================

DROP POLICY IF EXISTS "anon_select_public_design_photos" ON design_photos;
-- Anon: SELECT photos where the parent design is public
-- Requirement 12.8, 12.9 — anon users may only see photos for public designs
CREATE POLICY "anon_select_public_design_photos"
  ON design_photos FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM designs
      WHERE designs.id = design_photos.design_id
        AND designs.is_public = true
    )
  );

DROP POLICY IF EXISTS "auth_select_all_photos" ON design_photos;
-- Authenticated: SELECT all photos
-- Requirement 12.2 — authenticated users can read all photo rows
CREATE POLICY "auth_select_all_photos"
  ON design_photos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_own_photos" ON design_photos;
-- Authenticated: INSERT own photos only
-- Requirement 12.4 — created_by must equal the caller's UID
CREATE POLICY "auth_insert_own_photos"
  ON design_photos FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "auth_update_any_photo" ON design_photos;
-- Authenticated: UPDATE any photo (collaborative management)
-- Requirement 12.5 — all authenticated users may update any photo
CREATE POLICY "auth_update_any_photo"
  ON design_photos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_photos" ON design_photos;
-- Admin only: DELETE photos
-- Requirement 12.6 — only admin role may delete photo rows
CREATE POLICY "admin_delete_photos"
  ON design_photos FOR DELETE
  TO authenticated
  USING (is_admin());


-- =============================================================================
-- 5. shared_folders policies
-- =============================================================================

DROP POLICY IF EXISTS "auth_select_all_shared_folders" ON shared_folders;
-- Authenticated: SELECT all shared folder records
-- Requirement 12.2 — authenticated users can read all shared_folders rows
CREATE POLICY "auth_select_all_shared_folders"
  ON shared_folders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_own_shared_folders" ON shared_folders;
-- Authenticated: INSERT own shared folder records
-- Requirement 12.4 — created_by must equal the caller's UID
CREATE POLICY "auth_insert_own_shared_folders"
  ON shared_folders FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "auth_update_any_shared_folder" ON shared_folders;
-- Authenticated: UPDATE any shared folder record (collaborative)
-- Requirement 12.5 — all authenticated users may update any shared_folders row
CREATE POLICY "auth_update_any_shared_folder"
  ON shared_folders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_shared_folders" ON shared_folders;
-- Admin only: DELETE shared folder records
-- Requirement 12.6 — only admin role may delete shared_folders rows
CREATE POLICY "admin_delete_shared_folders"
  ON shared_folders FOR DELETE
  TO authenticated
  USING (is_admin());
