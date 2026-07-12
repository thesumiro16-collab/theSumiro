-- ============================================================
-- Migration 018: Auto-confirm email verification for all users
-- Run in Supabase Dashboard → SQL Editor to auto-confirm
-- users created by the admin without requiring email verification.
-- ============================================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists to make it rerun-safe
DROP TRIGGER IF EXISTS trg_auto_confirm_user_email ON auth.users;

-- Bind the trigger BEFORE INSERT on auth.users
CREATE TRIGGER trg_auto_confirm_user_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user_email();

-- Verify
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_name = 'trg_auto_confirm_user_email';
