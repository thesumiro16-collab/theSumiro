-- =============================================================================
-- Migration 026: User Profile Security Hardening (Privilege Escalation Protection)
-- Run this in Supabase Dashboard -> SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BEFORE UPDATE TRIGGER: Prevent Non-Admins from Modifying Role or Permissions
-- -----------------------------------------------------------------------------
-- Ensures that even if a non-admin user attempts to send an update targeting
-- their own row (e.g. via direct REST API call), role and permissions modifications
-- are strictly rejected at the database level.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_user_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If caller is NOT an admin:
  IF NOT is_admin() THEN
    -- Block role changes
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Security Violation: Only administrators can modify user roles.';
    END IF;

    -- Block permission changes
    IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
      RAISE EXCEPTION 'Security Violation: Only administrators can modify user permissions.';
    END IF;

    -- Block altering user ID
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Security Violation: User ID cannot be modified.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_profile_update ON public.user_profiles;

CREATE TRIGGER trg_protect_user_profile_update
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_update();

-- -----------------------------------------------------------------------------
-- 2. BEFORE INSERT TRIGGER: Prevent Unauthorized Elevation on Registration
-- -----------------------------------------------------------------------------
-- If an unauthorized user registers, their profile role is forcibly clamped
-- to 'staff' with default restricted permissions. Only verified admins (or the
-- very first bootstrap user) can create an admin profile.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_user_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  profile_count INTEGER;
BEGIN
  -- Check total profile count
  SELECT count(*) INTO profile_count FROM public.user_profiles;

  -- If this is the first user ever registered, bootstrap them as admin
  IF profile_count = 0 THEN
    NEW.role := 'admin';
    NEW.permissions := '{
      "dashboard": true,
      "shared_folders": true,
      "inbox": true,
      "ticker": true,
      "settings": true,
      "about_editor": true,
      "seo": true,
      "users": true
    }'::jsonb;
    RETURN NEW;
  END IF;

  -- For all subsequent users: if caller is NOT an active admin, enforce 'staff'
  IF NOT is_admin() THEN
    NEW.role := 'staff';
    NEW.permissions := '{
      "dashboard": true,
      "shared_folders": true,
      "inbox": true,
      "ticker": true,
      "settings": true,
      "about_editor": true,
      "seo": false,
      "users": false
    }'::jsonb;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_profile_insert ON public.user_profiles;

CREATE TRIGGER trg_protect_user_profile_insert
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_insert();
