-- ============================================================
-- TrustLink — Database Schema
-- Migration 001: All tables, indexes, foreign keys
--
-- Run this in your Supabase SQL Editor or via supabase db push
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up any existing partial schema to avoid "column does not exist" errors
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.share_links CASCADE;
DROP TABLE IF EXISTS public.document_shares CASCADE;
DROP TABLE IF EXISTS public.blockchain_proofs CASCADE;
DROP TABLE IF EXISTS public.document_integrity_records CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ── PROFILES ─────────────────────────────────────────────────
-- Mirrors auth.users. Created automatically via trigger below.
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── FOLDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.folders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_owner ON public.folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON public.folders(parent_folder_id);

-- ── DOCUMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id        UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 500),
  storage_path     TEXT NOT NULL,
  mime_type        TEXT NOT NULL,
  size             BIGINT NOT NULL CHECK (size > 0),
  current_hash     TEXT,                                    -- SHA-256 hex digest
  integrity_status TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (integrity_status IN ('PENDING', 'VERIFIED', 'FAILED')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON public.documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON public.documents(current_hash);

-- ── DOCUMENT INTEGRITY RECORDS ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_integrity_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  sha256_hash       TEXT NOT NULL CHECK (char_length(sha256_hash) = 64),
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by      UUID NOT NULL REFERENCES public.profiles(id),
  version_reference INT  NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_integrity_document ON public.document_integrity_records(document_id);
CREATE INDEX IF NOT EXISTS idx_integrity_hash ON public.document_integrity_records(sha256_hash);

-- ── BLOCKCHAIN PROOFS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blockchain_proofs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id        UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  document_hash      TEXT NOT NULL CHECK (char_length(document_hash) = 64),
  blockchain_network TEXT NOT NULL,
  transaction_hash   TEXT UNIQUE,           -- NULL while PENDING
  block_number       BIGINT,                -- NULL while PENDING
  contract_address   TEXT,
  anchored_at        TIMESTAMPTZ,           -- Set when CONFIRMED
  status             TEXT NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_document_proof UNIQUE (document_id)
);

CREATE INDEX IF NOT EXISTS idx_blockchain_document ON public.blockchain_proofs(document_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_hash ON public.blockchain_proofs(document_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_status ON public.blockchain_proofs(status);

-- ── DOCUMENT SHARES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_shares (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  owner_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission     TEXT NOT NULL CHECK (permission IN ('VIEW', 'DOWNLOAD')),
  expires_at     TIMESTAMPTZ,
  revoked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate active shares for the same doc+user pair
  CONSTRAINT unique_active_share UNIQUE (document_id, shared_with_id)
);

CREATE INDEX IF NOT EXISTS idx_shares_document ON public.document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON public.document_shares(shared_with_id);

-- ── SHARE LINKS (token-based) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.share_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,   -- cryptographically random
  created_by  UUID NOT NULL REFERENCES public.profiles(id),
  permission  TEXT NOT NULL CHECK (permission IN ('VIEW', 'DOWNLOAD')),
  expires_at  TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_document ON public.share_links(document_id);

-- ── AUDIT LOGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  action      TEXT NOT NULL CHECK (action IN (
    'DOCUMENT_UPLOADED',
    'DOCUMENT_VIEWED',
    'DOCUMENT_DOWNLOADED',
    'DOCUMENT_RENAMED',
    'DOCUMENT_MOVED',
    'DOCUMENT_DELETED',
    'DOCUMENT_SHARED',
    'SHARE_REVOKED',
    'DOCUMENT_VERIFIED',
    'HASH_CREATED',
    'BLOCKCHAIN_ANCHORED',
    'BLOCKCHAIN_ANCHOR_FAILED'
  )),
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_document ON public.audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ── updated_at triggers ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles', 'folders', 'documents'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%s;
       CREATE TRIGGER set_%s_updated_at
         BEFORE UPDATE ON public.%s
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;

-- ── Ensure all existing auth.users have a profile row ─────────
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT id, raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
