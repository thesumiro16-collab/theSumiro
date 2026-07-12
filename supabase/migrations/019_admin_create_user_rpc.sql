-- ============================================================
-- Migration 019: RPC to create users directly in auth.users
-- This bypasses GoTrue mailer rate limits completely and
-- confirms the user email immediately.
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
  new_user_id UUID;
  encrypted_pw TEXT;
BEGIN
  -- Security Check: Only admins can call this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Validate input
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;
  IF p_full_name IS NULL OR p_full_name = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF p_role IS NULL OR p_role = '' THEN
    RAISE EXCEPTION 'Role is required';
  END IF;

  -- Check duplicate email in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;

  -- Generate UUID
  new_user_id := gen_random_uuid();
  
  -- Hash password using bcrypt ($2a$) with pgcrypto
  encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  -- 6. Insert directly into auth.users table
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
    p_email,
    encrypted_pw,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name),
    false,
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- 7. Insert directly into public.user_profiles
  INSERT INTO public.user_profiles (
    id,
    full_name,
    role,
    permissions
  ) VALUES (
    new_user_id,
    p_full_name,
    p_role,
    '{
      "dashboard": true,
      "shared_folders": true,
      "inbox": true,
      "ticker": true,
      "settings": true,
      "about_editor": true,
      "seo": false,
      "users": false
    }'::jsonb
  );

  RETURN new_user_id;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
