-- ============================================================
-- Migration 007: Contact Messages Table
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 1. Allow public (anonymous & authenticated) visitors to submit messages
CREATE POLICY "anon_insert_contact_messages"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. Allow logged-in staff and admins to view contact messages
CREATE POLICY "auth_select_contact_messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow logged-in staff and admins to delete contact messages
CREATE POLICY "auth_delete_contact_messages"
  ON contact_messages FOR DELETE
  TO authenticated
  USING (true);
