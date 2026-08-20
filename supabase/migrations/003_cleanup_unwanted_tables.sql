-- ============================================================
-- TrustLink — Database Schema Cleanup
-- Drop 8 unused/redundant prototype tables
-- ============================================================

DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.blockchain_ledger CASCADE;
DROP TABLE IF EXISTS public.blockchain_logs CASCADE;
DROP TABLE IF EXISTS public.shared_documents CASCADE;
DROP TABLE IF EXISTS public.shares CASCADE;
DROP TABLE IF EXISTS public.share_links CASCADE;
DROP TABLE IF EXISTS public.document_versions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Confirm remaining active tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
