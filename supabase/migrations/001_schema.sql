-- ============================================================
-- Migration 001: Full Schema
-- Requirements: 8.3, 8.9, 9.4, 12.1
-- ============================================================

-- Extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE designs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_no      TEXT UNIQUE NOT NULL,
  fabric_name    TEXT NOT NULL,
  description    TEXT NOT NULL,
  rate           NUMERIC(10, 2) NOT NULL CHECK (rate > 0),
  tag            TEXT NOT NULL,
  office_folder  INTEGER NOT NULL DEFAULT 0 CHECK (office_folder >= 0),
  bag_folder     INTEGER NOT NULL DEFAULT 1 CHECK (bag_folder >= 0),
  extra_folder   INTEGER NOT NULL DEFAULT 0 CHECK (extra_folder >= 0 AND extra_folder <= 99),
  is_public      BOOLEAN NOT NULL DEFAULT false,
  is_featured    BOOLEAN NOT NULL DEFAULT false,
  created_by     UUID NOT NULL REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE design_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id   UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  secure_url  TEXT NOT NULL,
  public_id   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shared_folders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       UUID NOT NULL REFERENCES designs(id),
  party_name      TEXT NOT NULL,
  city            TEXT NOT NULL,
  folders_shared  INTEGER NOT NULL CHECK (folders_shared > 0),
  return_date     DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'returned')),
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Performance Indexes (7 total)
-- ============================================================

CREATE INDEX idx_designs_created_by      ON designs(created_by);
CREATE INDEX idx_designs_is_public       ON designs(is_public);
CREATE INDEX idx_designs_is_featured     ON designs(is_featured);
CREATE INDEX idx_designs_created_at      ON designs(created_at DESC);
CREATE INDEX idx_design_photos_design_id ON design_photos(design_id);
CREATE INDEX idx_shared_folders_design_id   ON shared_folders(design_id);
CREATE INDEX idx_shared_folders_status      ON shared_folders(status);
CREATE INDEX idx_shared_folders_created_at  ON shared_folders(created_at DESC);
