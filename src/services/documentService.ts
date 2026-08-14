// ============================================================
// TrustLink — Document Service
// ============================================================

import { supabase } from '@/lib/supabase';
import { Document } from '@/types';
import * as FileSystem from 'expo-file-system/legacy';
import { computeFileSha256 } from '@/lib/crypto';
import { decode } from 'base64-arraybuffer';
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
   * Computes SHA-256 natively before uploading.
   */
  async uploadDocument(
    fileUri: string,
    fileName: string,
    mimeType: string,
    folderId: string | null = null
  ): Promise<Document> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // 0. Ensure user profile exists in public.profiles to satisfy foreign key constraint
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
          full_name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || null,
        }, { onConflict: 'id' });
    }

    // 1. Calculate SHA-256 (this happens locally on device)
    console.log(`Calculating SHA-256 for ${fileName}...`);
    const sha256Hash = await computeFileSha256(fileUri);
    console.log(`Hash calculated: ${sha256Hash}`);

    // 2. Read file to base64 and decode to ArrayBuffer for Supabase Storage
    const base64Content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const arrayBuffer = decode(base64Content);
    const fileSize = arrayBuffer.byteLength;

    if (fileSize > 50 * 1024 * 1024) {
      throw new Error('File size exceeds 50MB limit');
    }

    // 3. Upload to Storage
    // Path: {user_id}/{timestamp}_{sanitized_filename}
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.user.id}/${Date.now()}_${safeFileName}`;

    console.log(`Uploading to storage path: ${storagePath}...`);
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 4. Create database record
    console.log('Creating database record...');
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert({
        owner_id: user.user.id,
        folder_id: folderId,
        name: fileName,
        storage_path: storagePath,
        mime_type: mimeType,
        size: fileSize,
        current_hash: sha256Hash,
        integrity_status: 'PENDING',
      })
      .select()
      .single();

    if (dbError) {
      // Rollback storage if DB fails
      await supabase.storage.from('documents').remove([storagePath]);
      throw dbError;
    }

    // 5. Create integrity record
    console.log('Creating integrity record...');
    await integrityService.createIntegrityRecord(data.id, sha256Hash, 1);

    // 6. Log upload to audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.user.id,
      document_id: data.id,
      action: 'DOCUMENT_UPLOADED',
      metadata: { name: fileName, size: fileSize, mime_type: mimeType },
    });

    return data as Document;
  },

  /**
   * Generates a short-lived signed URL for downloading a document.
   */
  async getDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 60); // 60 seconds

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Downloads a document to the device.
   */
  async downloadDocument(document: Document): Promise<string> {
    const { data: user } = await supabase.auth.getUser();
    const url = await this.getDownloadUrl(document.storage_path);
    const destinationDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    const localUri = `${destinationDir}${document.name}`;
    
    const { uri } = await FileSystem.downloadAsync(url, localUri);

    // Log download to audit trail
    if (user?.user) {
      await supabase.from('audit_logs').insert({
        user_id: user.user.id,
        document_id: document.id,
        action: 'DOCUMENT_DOWNLOADED',
        metadata: { name: document.name },
      });
    }

    return uri;
  },

  /**
   * Deletes a document from Storage and Database.
   */
  async deleteDocument(document: Document): Promise<void> {
    const { data: user } = await supabase.auth.getUser();

    // 1. Delete from DB first
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', document.id);

    if (dbError) throw dbError;

    // 2. Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.storage_path]);

    if (storageError) {
      console.warn(`Failed to delete storage file ${document.storage_path}:`, storageError);
    }

    // 3. Log deletion to audit trail
    if (user?.user) {
      await supabase.from('audit_logs').insert({
        user_id: user.user.id,
        document_id: document.id,
        action: 'DOCUMENT_DELETED',
        metadata: { name: document.name },
      });
    }
  }
};
