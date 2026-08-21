// ============================================================
// TrustLink — Document Service
// ============================================================

import { supabase } from '@/lib/supabase';
import { Document } from '@/types';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { ethers } from 'ethers';
import { integrityService } from './integrityService';

export const documentService = {
  /**
   * Fetches documents in a specific folder (or root if null)
   */
  async getDocuments(folderId: string | null = null): Promise<Document[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    let query = supabase
      .from('documents')
      .select('*')
      .eq('owner_id', user.user.id)
      .order('created_at', { ascending: false });

    if (folderId === null) {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data as Document[];
  },

  /**
   * Uploads a file to Supabase Storage and creates a document record.
   * Initial integrity status is set to PENDING until the user explicitly verifies.
   * Fully polymorphic: accepts either an asset object or discrete string arguments.
   */
  async uploadDocument(
    fileInput: string | { uri: string; name: string; mimeType?: string; size?: number },
    fileNameOrFolderId?: string | null | ((progress: { step: number; statusText: string }) => void),
    mimeTypeOrProgress?: string | ((progress: { step: number; statusText: string }) => void),
    folderIdParam: string | null = null,
    onProgressParam?: ((step: number, statusText: string) => void) | ((progress: { step: number; statusText: string }) => void)
  ): Promise<Document> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated. Please sign in again.');

    let fileUri: string;
    let fileName: string;
    let mimeType: string;
    let folderId: string | null = null;
    let reportProgress: (step: number, statusText: string) => void = () => {};

    if (typeof fileInput === 'object' && fileInput !== null) {
      fileUri = fileInput.uri;
      fileName = fileInput.name || 'document';
      mimeType = fileInput.mimeType || 'application/octet-stream';
      folderId = typeof fileNameOrFolderId === 'string' ? fileNameOrFolderId : null;

      if (typeof fileNameOrFolderId === 'function') {
        const cb = fileNameOrFolderId as any;
        reportProgress = (s, t) => {
          try { cb({ step: s, statusText: t }); } catch {}
          try { cb(s, t); } catch {}
        };
      } else if (typeof mimeTypeOrProgress === 'function') {
        const cb = mimeTypeOrProgress as any;
        reportProgress = (s, t) => {
          try { cb({ step: s, statusText: t }); } catch {}
          try { cb(s, t); } catch {}
        };
      }
    } else {
      fileUri = fileInput;
      fileName = typeof fileNameOrFolderId === 'string' ? fileNameOrFolderId : 'document';
      mimeType = typeof mimeTypeOrProgress === 'string' ? mimeTypeOrProgress : 'application/octet-stream';
      folderId = folderIdParam;
      if (typeof onProgressParam === 'function') {
        const cb = onProgressParam as any;
        reportProgress = (s, t) => {
          try { cb(s, t); } catch {}
          try { cb({ step: s, statusText: t }); } catch {}
        };
      }
    }

    if (!fileUri || typeof fileUri !== 'string') {
      throw new Error('Invalid file URI provided for upload.');
    }

    // 0. Profile sync
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.user.id)
        .maybeSingle();

      if (!profile) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.user.id,
            full_name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || 'User',
          }, { onConflict: 'id' });
      }
    } catch (profileErr) {
      console.warn('Profile sync note:', profileErr);
    }

    // Step 1: Read & Hash
    reportProgress(1, 'Computing cryptographic SHA-256 fingerprint...');
    const base64Content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const arrayBuffer = decode(base64Content);
    const fileSize = arrayBuffer.byteLength;

    if (fileSize > 50 * 1024 * 1024) {
      throw new Error('File size exceeds the 50MB limit.');
    }

    const uint8Array = new Uint8Array(arrayBuffer);
    const sha256Hash = ethers.sha256(uint8Array).replace('0x', '').toLowerCase();

    // Step 2: Storage Upload
    reportProgress(2, 'Encrypting & uploading to vault storage...');
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folderPrefix = folderId ? `folders/${folderId}/` : '';
    const storagePath = `${user.user.id}/${folderPrefix}${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, arrayBuffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage error: ${uploadError.message || 'Could not save file to storage bucket.'}`);
    }

    // Step 3: Database & Ledger
    reportProgress(3, 'Recording verification entry in database...');
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert({
        owner_id: user.user.id,
        folder_id: folderId,
        name: fileName,
        storage_path: storagePath,
        mime_type: mimeType || 'application/octet-stream',
        size: fileSize,
        current_hash: sha256Hash,
        integrity_status: 'PENDING', // Initial state upon upload is PENDING
      })
      .select()
      .single();

    if (dbError || !data) {
      // Rollback storage upload if DB insert fails
      await supabase.storage.from('documents').remove([storagePath]);
      throw new Error(dbError?.message || 'Database registration failed.');
    }

    const createdDoc = data as Document;

    // Step 4: Ledger & Audit Sync
    reportProgress(4, 'Vaulted securely. Ready for cryptographic verification.');
    try {
      await integrityService.createIntegrityRecord(
        createdDoc.id,
        sha256Hash,
        sha256Hash,
        1
      );

      await supabase.from('audit_logs').insert({
        user_id: user.user.id,
        document_id: createdDoc.id,
        action: 'DOCUMENT_UPLOADED',
        metadata: {
          name: fileName,
          size: fileSize,
          hash: sha256Hash,
          storage_path: storagePath,
        },
      });
    } catch (auditErr) {
      console.warn('Post-upload audit sync note:', auditErr);
    }

    return createdDoc;
  },

  /**
   * Generates a signed URL to download or view a vaulted document
   */
  async getSignedUrl(storagePath: string, expiresIn: number = 60): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data) {
      throw new Error(error?.message || 'Failed to generate signed download URL');
    }

    return data.signedUrl;
  },

  /**
   * Downloads the document bytes and saves it locally via expo-file-system
   */
  async downloadDocument(doc: Document): Promise<string> {
    const signedUrl = await this.getSignedUrl(doc.storage_path, 120);
    const localUri = `${FileSystem.cacheDirectory}${doc.name}`;

    const downloadRes = await FileSystem.downloadAsync(signedUrl, localUri);
    if (downloadRes.status !== 200) {
      throw new Error(`Download failed with status ${downloadRes.status}`);
    }

    // Log the download event
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await supabase.from('audit_logs').insert({
        user_id: user.user.id,
        document_id: doc.id,
        action: 'DOCUMENT_DOWNLOADED',
        metadata: { name: doc.name, local_uri: localUri },
      });
    }

    return downloadRes.uri;
  },

  /**
   * Deletes a document from both database and Supabase storage
   */
  async deleteDocument(doc: Document): Promise<void> {
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id);

    if (dbError) throw dbError;

    // Remove from storage bucket
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.storage_path]);

    if (storageError) {
      console.warn('Storage cleanup warning:', storageError);
    }

    // Log deletion event
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await supabase.from('audit_logs').insert({
        user_id: user.user.id,
        document_id: null,
        action: 'DOCUMENT_DELETED',
        metadata: { name: doc.name, storage_path: doc.storage_path },
      });
    }
  }
};
