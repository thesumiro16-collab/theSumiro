-- ============================================================
-- Migration 020: Custom Roles Table
-- Allows admins to create custom role names.
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_system BOOLEAN DEFAULT false,  -- true for built-in roles (admin)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed the two built-in roles
INSERT INTO public.roles (name, display_name, description, is_system)
VALUES
  ('admin', 'Administrator', 'Full access to all pages and settings', true)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read roles
CREATE POLICY "Anyone can read roles" ON public.roles
  FOR SELECT USING (true);

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Grant access
GRANT SELECT ON public.roles TO anon, authenticated;
GRANT ALL ON public.roles TO authenticated;
