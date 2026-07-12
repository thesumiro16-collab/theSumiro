-- =============================================================================
-- Migration 021: Security RLS Fixes
--
-- 1. Restrict design_photos DELETE to own photos or admin
--    (migration 009 had opened it to ANY authenticated user)
--
-- 2. Restrict contact_messages DELETE to admin only
--    (was open to any authenticated user)
--
-- 3. Fix roles table to use is_admin() consistently
--    (was using inline subquery — inconsistent with the rest of the schema)
-- =============================================================================

-- ── 1. design_photos DELETE ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_delete_photos"  ON design_photos;
DROP POLICY IF EXISTS "admin_delete_photos" ON design_photos;

CREATE POLICY "auth_delete_own_or_admin_photos"
  ON design_photos FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR is_admin());

-- ── 2. contact_messages DELETE ───────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_delete_contact_messages" ON contact_messages;

CREATE POLICY "admin_delete_contact_messages"
  ON contact_messages FOR DELETE
  TO authenticated
  USING (is_admin());

-- ── 3. roles table — replace inline subquery with is_admin() ────────────────
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;

CREATE POLICY "admin_manage_roles"
  ON roles FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
