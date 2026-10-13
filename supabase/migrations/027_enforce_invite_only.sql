-- =============================================================================
-- Migration 027: Strictly Enforce Invite-Only System
-- Blocks all public self-signups at the database level.
-- Only authenticated administrators can create/invite user accounts.
-- Run this in Supabase Dashboard -> SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Block unauthorized self-signups on auth.users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_invite_only_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Count existing admin profiles
  SELECT count(*) INTO admin_count FROM public.user_profiles WHERE role = 'admin';

  -- If this is initial bootstrap and no admin exists yet, allow first registration
  IF admin_count = 0 THEN
    RETURN NEW;
  END IF;

  -- Block any signup if caller is NOT an active administrator
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Registration is strictly invite-only. Public self-registration is disabled.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_invite_only_signup ON auth.users;

CREATE TRIGGER trg_enforce_invite_only_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_invite_only_signup();

-- -----------------------------------------------------------------------------
-- 2. Block unauthorized profile insertions on public.user_profiles
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
  SELECT count(*) INTO profile_count FROM public.user_profiles;

  -- Allow first bootstrap account
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

  -- Reject any profile creation if caller is not an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can provision user accounts.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_profile_insert ON public.user_profiles;

CREATE TRIGGER trg_protect_user_profile_insert
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_insert();

-- -----------------------------------------------------------------------------
-- 3. Update RLS policy on user_profiles for INSERT
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;

CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- 4. Enhanced Atomic Admin User Creation RPC
-- -----------------------------------------------------------------------------
-- Drop previous overloaded signatures to prevent ambiguous function match
DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'staff',
  p_permissions JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
  new_user_id UUID;
  encrypted_pw TEXT;
  user_perms JSONB;
BEGIN
  -- Security check: Must be an active admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Validation
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF p_role IS NULL OR trim(p_role) = '' THEN
    p_role := 'staff';
  END IF;

  -- Prevent duplicate emails
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(p_email))) THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;

  -- Determine default permissions if not explicitly supplied
  IF p_permissions IS NOT NULL THEN
    user_perms := p_permissions;
  ELSIF p_role = 'admin' THEN
    user_perms := '{
      "dashboard": true,
      "shared_folders": true,
      "inbox": true,
      "ticker": true,
      "settings": true,
      "about_editor": true,
      "seo": true,
      "users": true
    }'::jsonb;
  ELSE
    user_perms := '{
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

  new_user_id := gen_random_uuid();
  encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  -- 1. Insert into auth.users (email auto-confirmed so they can log in immediately)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    trim(p_email),
    encrypted_pw,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', trim(p_full_name)),
    false,
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- 2. Insert into auth.identities (MANDATORY for Supabase GoTrue login)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
  ) THEN
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, now(), now(), now())'
    USING new_user_id::text, new_user_id, jsonb_build_object('sub', new_user_id::text, 'email', trim(p_email)), 'email', new_user_id::text;
  ELSE
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ($1, $2, $3, $4, now(), now(), now())'
    USING new_user_id::text, new_user_id, jsonb_build_object('sub', new_user_id::text, 'email', trim(p_email)), 'email';
  END IF;

  -- 3. Insert into public.user_profiles
  INSERT INTO public.user_profiles (
    id,
    full_name,
    role,
    permissions
  ) VALUES (
    new_user_id,
    trim(p_full_name),
    p_role,
    user_perms
  );

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
