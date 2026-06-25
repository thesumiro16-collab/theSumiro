-- =============================================================================
-- Migration 003: Functions and Triggers
-- Requirements: 8.3, 11.5
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Sequence for auto-generating design numbers
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS designs_design_no_seq START 1 INCREMENT 1;

-- -----------------------------------------------------------------------------
-- 2. Trigger function: generate_design_no
--    Fires BEFORE INSERT on designs when design_no is NULL or empty.
--    Assigns 'D-XXXX' format using the sequence (race-condition-safe because
--    sequences are transaction-independent and gap-free across concurrent INSERTs).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_design_no()
RETURNS TRIGGER AS $$
BEGIN
  NEW.design_no := 'D-' || LPAD(nextval('designs_design_no_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 3. Trigger: trg_generate_design_no
--    BEFORE INSERT ON designs, FOR EACH ROW, only when design_no is not supplied.
--    The WHEN clause means explicit design_no values (e.g. from a data import)
--    are preserved unchanged.
-- -----------------------------------------------------------------------------
CREATE TRIGGER trg_generate_design_no
  BEFORE INSERT ON designs
  FOR EACH ROW
  WHEN (NEW.design_no IS NULL OR NEW.design_no = '')
  EXECUTE FUNCTION generate_design_no();

-- -----------------------------------------------------------------------------
-- 4. RPC: mark_folder_returned(folder_id UUID)
--    Atomically marks a shared_folder record as 'returned' and credits
--    extra_folder back to the parent design.
--
--    Guarantees:
--    • SELECT FOR UPDATE prevents concurrent double-return (optimistic lock).
--    • Validates record exists and is still 'pending' before any write.
--    • Both UPDATEs run in the same transaction; either both commit or both roll back.
--
--    Security:
--    • SECURITY DEFINER — runs with the privileges of the function owner (postgres),
--      bypassing RLS so the UPDATE is not blocked by row-level policies.
--    • REVOKE EXECUTE FROM PUBLIC — no role inherits this by default.
--    • GRANT EXECUTE TO authenticated — only logged-in Supabase users may call it.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_folder_returned(folder_id UUID)
RETURNS VOID AS $$
DECLARE
  rec shared_folders%ROWTYPE;
BEGIN
  -- Lock the row to prevent concurrent calls from double-processing the same record
  SELECT *
    INTO rec
    FROM shared_folders
   WHERE id = folder_id
     FOR UPDATE;

  -- Validate: record must exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shared folder record not found: %', folder_id
      USING ERRCODE = 'P0002';   -- no_data_found
  END IF;

  -- Validate: record must still be pending (idempotency guard)
  IF rec.status <> 'pending' THEN
    RAISE EXCEPTION 'Shared folder % has already been returned', folder_id
      USING ERRCODE = 'P0001';   -- raise_exception
  END IF;

  -- Mark the shared folder record as returned
  UPDATE shared_folders
     SET status = 'returned'
   WHERE id = folder_id;

  -- Credit the folders back to the design's extra_folder count
  UPDATE designs
     SET extra_folder = extra_folder + rec.folders_shared
   WHERE id = rec.design_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke execute from all roles (PUBLIC) so no one can call this by default
REVOKE EXECUTE ON FUNCTION mark_folder_returned(UUID) FROM PUBLIC;

-- Grant execute only to authenticated Supabase users
GRANT EXECUTE ON FUNCTION mark_folder_returned(UUID) TO authenticated;
