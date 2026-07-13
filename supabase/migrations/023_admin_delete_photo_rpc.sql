-- ============================================================
-- Migration 023: RPC to delete a design photo as admin
-- SECURITY DEFINER bypasses RLS policies on design_photos.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_delete_photo(p_photo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.design_photos WHERE id = p_photo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_photo(UUID) TO authenticated;
