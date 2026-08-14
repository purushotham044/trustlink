-- ============================================================
-- TrustLink — Row Level Security Policies
-- Migration 002: RLS for every table
--
-- SECURITY MODEL:
--   - Users can only access their own data
--   - Shared documents accessible to share recipients
--   - All enforcement at PostgreSQL layer, not frontend
--   - Append-only immutability on audit_logs & document_integrity_records
--   - Edge Functions use service_role for privileged operations
-- ============================================================

-- Enable RLS on every table
ALTER TABLE public.profiles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_integrity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_proofs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                 ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ─────────────────────────────────────────────────

-- Users can view their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (not id — immutable)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile if not yet created by trigger
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can look up other users' basic info for sharing
DROP POLICY IF EXISTS "profiles_select_for_sharing" ON public.profiles;
CREATE POLICY "profiles_select_for_sharing"
  ON public.profiles FOR SELECT
  USING (true);

-- ── FOLDERS ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "folders_all_own" ON public.folders;
CREATE POLICY "folders_all_own"
  ON public.folders FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ── DOCUMENTS ────────────────────────────────────────────────

-- Owners have full access
DROP POLICY IF EXISTS "documents_all_own" ON public.documents;
CREATE POLICY "documents_all_own"
  ON public.documents FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Share recipients can SELECT documents shared with them
-- (only when share is active: not revoked, not expired)
DROP POLICY IF EXISTS "documents_select_shared" ON public.documents;
CREATE POLICY "documents_select_shared"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.document_shares ds
      WHERE ds.document_id = id
        AND ds.shared_with_id = auth.uid()
        AND ds.revoked_at IS NULL
        AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
    )
  );

-- ── DOCUMENT INTEGRITY RECORDS ───────────────────────────────

-- Owners can read their documents' integrity records
DROP POLICY IF EXISTS "integrity_select_own" ON public.document_integrity_records;
CREATE POLICY "integrity_select_own"
  ON public.document_integrity_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.owner_id = auth.uid()
    )
  );

-- Share recipients can also read integrity records (for verification)
DROP POLICY IF EXISTS "integrity_select_shared" ON public.document_integrity_records;
CREATE POLICY "integrity_select_shared"
  ON public.document_integrity_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.document_shares ds
      WHERE ds.document_id = document_id
        AND ds.shared_with_id = auth.uid()
        AND ds.revoked_at IS NULL
        AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
    )
  );

-- Authenticated document owners can insert integrity records for their documents
DROP POLICY IF EXISTS "integrity_insert_own" ON public.document_integrity_records;
CREATE POLICY "integrity_insert_own"
  ON public.document_integrity_records FOR INSERT
  WITH CHECK (
    auth.uid() = generated_by
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.owner_id = auth.uid()
    )
  );

-- Immutable: NO UPDATE or DELETE policies on document_integrity_records

-- ── BLOCKCHAIN PROOFS ────────────────────────────────────────

-- Owners can read blockchain proofs for their documents
DROP POLICY IF EXISTS "blockchain_proofs_select_own" ON public.blockchain_proofs;
CREATE POLICY "blockchain_proofs_select_own"
  ON public.blockchain_proofs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.owner_id = auth.uid()
    )
  );

-- Share recipients can read blockchain proofs (for independent verification)
DROP POLICY IF EXISTS "blockchain_proofs_select_shared" ON public.blockchain_proofs;
CREATE POLICY "blockchain_proofs_select_shared"
  ON public.blockchain_proofs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.document_shares ds
      WHERE ds.document_id = document_id
        AND ds.shared_with_id = auth.uid()
        AND ds.revoked_at IS NULL
        AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
    )
  );

-- Writes are restricted to backend Edge Functions using service_role only.
-- Regular authenticated users cannot forge, insert, update, or delete blockchain proofs.

-- ── DOCUMENT SHARES ──────────────────────────────────────────

-- Document owner can manage all shares for their documents
DROP POLICY IF EXISTS "document_shares_owner" ON public.document_shares;
CREATE POLICY "document_shares_owner"
  ON public.document_shares FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Share recipient can read their own shares
DROP POLICY IF EXISTS "document_shares_recipient" ON public.document_shares;
CREATE POLICY "document_shares_recipient"
  ON public.document_shares FOR SELECT
  USING (auth.uid() = shared_with_id);

-- ── SHARE LINKS ──────────────────────────────────────────────

-- Only creator can manage share links
DROP POLICY IF EXISTS "share_links_creator" ON public.share_links;
CREATE POLICY "share_links_creator"
  ON public.share_links FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- ── AUDIT LOGS ───────────────────────────────────────────────

-- Users can read their own audit logs
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own audit events
DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Append-only: NO UPDATE or DELETE policies on audit_logs
