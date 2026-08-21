-- ============================================================
-- TrustLink — Database Foreign Key Cascade Fix
-- Ensures deleting a document cascades cleanly across all child tables
-- ============================================================

-- 1. Document Integrity Records
ALTER TABLE IF EXISTS public.document_integrity_records
  DROP CONSTRAINT IF EXISTS document_integrity_records_document_id_fkey,
  ADD CONSTRAINT document_integrity_records_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

-- 2. Blockchain Proofs
ALTER TABLE IF EXISTS public.blockchain_proofs
  DROP CONSTRAINT IF EXISTS blockchain_proofs_document_id_fkey,
  ADD CONSTRAINT blockchain_proofs_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

-- 3. Document Shares
ALTER TABLE IF EXISTS public.document_shares
  DROP CONSTRAINT IF EXISTS document_shares_document_id_fkey,
  ADD CONSTRAINT document_shares_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

-- 4. Audit Logs (Detach document_id without deleting audit logs)
ALTER TABLE IF EXISTS public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_document_id_fkey,
  ADD CONSTRAINT audit_logs_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;
