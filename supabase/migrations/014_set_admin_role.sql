-- ============================================================
-- Fix: Set admin role for the primary admin account
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: View all user profiles first to verify
SELECT up.id, up.full_name, up.role, up.created_at, au.email
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at ASC;

-- Step 2: Set the admin role for your email account.
-- Replace 'admin@sumiro.in' with your actual email if it differs.
UPDATE user_profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@sumiro.in'
);

-- Step 3: Verify the change was applied
SELECT up.id, up.full_name, up.role, au.email
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at ASC;
