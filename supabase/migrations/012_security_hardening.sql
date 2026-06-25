-- =============================================================================
-- Migration 012: Security hardening
--   Pin search_path on all SECURITY DEFINER functions to prevent
--   search-path hijacking (a privilege-escalation vector).
--
--   NOTE: The design_photos DELETE policy is intentionally left as the
--   "any authenticated user" policy from migration 009, since the staff
--   photo-management workflow depends on it. Tighten to is_admin() only if
--   you decide staff should not be able to delete photos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Harden SECURITY DEFINER functions with a fixed search_path
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION generate_design_no()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.design_no := 'D-' || LPAD(nextval('designs_design_no_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION mark_folder_returned(folder_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rec shared_folders%ROWTYPE;
BEGIN
  -- Lock the row to prevent concurrent calls from double-processing the same record
  SELECT *
    INTO rec
    FROM shared_folders
   WHERE id = folder_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shared folder record not found: %', folder_id
      USING ERRCODE = 'P0002';
  END IF;

  IF rec.status <> 'pending' THEN
    RAISE EXCEPTION 'Shared folder % has already been returned', folder_id
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE shared_folders
     SET status = 'returned'
   WHERE id = folder_id;

  UPDATE designs
     SET extra_folder = extra_folder + rec.folders_shared
   WHERE id = rec.design_id;
END;
$$;

-- Re-assert execute grants (CREATE OR REPLACE preserves them, but be explicit)
REVOKE EXECUTE ON FUNCTION mark_folder_returned(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_folder_returned(UUID) TO authenticated;
