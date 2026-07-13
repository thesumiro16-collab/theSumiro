-- ============================================================
-- Migration 022: RPC to delete custom roles as admin
-- SECURITY DEFINER bypasses RLS policies on the roles table.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_delete_role(p_role_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Security check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.roles WHERE id = p_role_id;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_delete_role(UUID) TO authenticated;
