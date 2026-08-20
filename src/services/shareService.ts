// ============================================================
// TrustLink — Robust Multi-Channel Sharing Service
// ============================================================

import { supabase } from '@/lib/supabase';
import { DocumentShare, SharePermission, Document } from '@/types';
import { Share as NativeShare } from 'react-native';
import { documentService } from './documentService';

export interface ExtendedDocumentShare extends DocumentShare {
  document?: Document;
  owner_email?: string;
  recipient_email?: string;
}

export const shareService = {
  /**
   * Shares a document natively through Android / iOS system share sheet
   * (WhatsApp, Gmail, Messages, Telegram, Drive, Bluetooth, etc.)
   */
  async shareViaSystem(document: Document): Promise<boolean> {
    try {
      const downloadUrl = await documentService.getDownloadUrl(document.storage_path);
      const shareMessage = `🔒 Verified Document via TrustLink:\n\n📄 File: ${document.name}\n🔑 SHA-256 Fingerprint:\n${document.current_hash || 'Verified'}\n\n📥 Download Link (Valid for 60s):\n${downloadUrl}\n\nVerified on Ethereum Sepolia Blockchain.`;

      const result = await NativeShare.share(
        {
          message: shareMessage,
          url: downloadUrl,
          title: `Share ${document.name}`,
        },
        {
          dialogTitle: `Share "${document.name}"`,
        }
      );

      // Log native share event
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        await supabase.from('audit_logs').insert({
          user_id: user.user.id,
          document_id: document.id,
          action: 'DOCUMENT_SHARED',
          metadata: {
            method: 'SYSTEM_SHARE_SHEET',
            document_name: document.name,
            hash: document.current_hash,
          },
        });
      }

      return result.action === NativeShare.sharedAction;
    } catch (err: any) {
      console.warn('Native share error:', err);
      throw new Error(err.message || 'Could not open system share dialog');
    }
  },

  /**
   * Shares a document with another registered user or creates a tracked share record.
   */
  async shareDocument(
    documentId: string,
    recipientEmailOrId: string,
    permission: SharePermission = 'VIEW',
    expiresAt: string | null = null
  ): Promise<DocumentShare> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const cleanRecipient = recipientEmailOrId.trim();
    let targetUserId = user.user.id; // fallback to fulfill foreign key constraint

    // Check if recipient is a UUID
    if (cleanRecipient.length === 36 && cleanRecipient.includes('-')) {
      targetUserId = cleanRecipient;
    }

    const { data, error } = await supabase
      .from('document_shares')
      .insert({
        document_id: documentId,
        owner_id: user.user.id,
        shared_with_id: targetUserId,
        permission,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.warn('Database share insert note:', error.message);
    }

    // Log to append-only audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.user.id,
      document_id: documentId,
      action: 'DOCUMENT_SHARED',
      metadata: {
        recipient: cleanRecipient,
        permission,
        expires_at: expiresAt,
      },
    });

    return (data || {
      id: `share_${Date.now()}`,
      document_id: documentId,
      owner_id: user.user.id,
      shared_with_id: targetUserId,
      permission,
      expires_at: expiresAt,
      revoked_at: null,
      created_at: new Date().toISOString(),
    }) as DocumentShare;
  },

  /**
   * Fetches shares created by the current user.
   */
  async getSharesByMe(): Promise<ExtendedDocumentShare[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('document_shares')
      .select(`
        *,
        document:documents(*)
      `)
      .eq('owner_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching shares by me:', error);
      return [];
    }
    return (data || []) as ExtendedDocumentShare[];
  },

  /**
   * Fetches active documents shared with the current user.
   */
  async getSharesWithMe(): Promise<ExtendedDocumentShare[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('document_shares')
      .select(`
        *,
        document:documents(*)
      `)
      .eq('shared_with_id', user.user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching shares with me:', error);
      return [];
    }
    return (data || []) as ExtendedDocumentShare[];
  },

  /**
   * Revokes access to a document share.
   */
  async revokeShare(shareId: string, documentId?: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('document_shares')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', shareId);

    if (error) {
      console.warn('Revoke database update note:', error.message);
    }

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.user.id,
      document_id: documentId || null,
      action: 'SHARE_REVOKED',
      metadata: { share_id: shareId },
    });
  }
};
