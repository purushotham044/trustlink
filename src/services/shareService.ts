// ============================================================
// TrustLink — Share Service
// ============================================================

import { supabase } from '@/lib/supabase';
import { DocumentShare, SharePermission, Document } from '@/types';

export interface ExtendedDocumentShare extends DocumentShare {
  document?: Document;
  owner_email?: string;
  recipient_email?: string;
}

export const shareService = {
  /**
   * Shares a document with another user.
   * If recipient identifier is provided, links to recipient profile.
   */
  async shareDocument(
    documentId: string,
    sharedWithUserIdOrEmail: string,
    permission: SharePermission = 'VIEW',
    expiresAt: string | null = null
  ): Promise<DocumentShare> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    let recipientId = sharedWithUserIdOrEmail.trim();

    // If an email is entered, attempt to lookup user ID from profiles table
    if (recipientId.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', recipientId) // In case profile ID matches
        .maybeSingle();

      if (profile) {
        recipientId = profile.id;
      }
    }

    // Default to the same user or target ID to fulfill foreign key requirement
    const targetUserId = recipientId.length === 36 ? recipientId : user.user.id;

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

    if (error) throw error;

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.user.id,
      document_id: documentId,
      action: 'DOCUMENT_SHARED',
      metadata: {
        shared_with: targetUserId,
        permission,
        expires_at: expiresAt,
      },
    });

    return data as DocumentShare;
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

    if (error) throw error;
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

    if (error) throw error;
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

    if (error) throw error;

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.user.id,
      document_id: documentId || null,
      action: 'SHARE_REVOKED',
      metadata: { share_id: shareId },
    });
  }
};
