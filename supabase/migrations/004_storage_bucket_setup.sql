-- ============================================================
-- TrustLink — Storage Bucket & RLS Setup
-- Migration 004: Ensure 'documents' private bucket exists with RLS
-- ============================================================

-- 1. Ensure private 'documents' bucket exists in storage.buckets (50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. Storage RLS Policies for authenticated users
-- Users can insert objects into their own {user_id}/ folder
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can select/download objects in their own {user_id}/ folder
DROP POLICY IF EXISTS "Authenticated users can read own documents" ON storage.objects;
CREATE POLICY "Authenticated users can read own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete objects in their own {user_id}/ folder
DROP POLICY IF EXISTS "Authenticated users can delete own documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
