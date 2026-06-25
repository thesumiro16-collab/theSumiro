-- =============================================================================
-- Migration 009: Allow authenticated users to delete design photos
-- =============================================================================

DROP POLICY IF EXISTS "admin_delete_photos" ON design_photos;
DROP POLICY IF EXISTS "auth_delete_photos" ON design_photos;

CREATE POLICY "auth_delete_photos"
  ON design_photos FOR DELETE
  TO authenticated
  USING (true);
