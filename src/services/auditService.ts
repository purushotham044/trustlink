// ============================================================
// TrustLink — Audit Service
// ============================================================

import { supabase } from '@/lib/supabase';
import { AuditAction, AuditLog, Document } from '@/types';

export interface ExtendedAuditLog extends AuditLog {
  document?: Document | null;
}

export type AuditCategory = 'ALL' | 'BLOCKCHAIN' | 'INTEGRITY' | 'SHARING' | 'FILES';

export const auditService = {
  /**
   * Logs a platform security or file event to the audit trail.
   */
  async logEvent(
    action: AuditAction,
    documentId: string | null = null,
    metadata: Record<string, unknown> | null = null
  ): Promise<AuditLog | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.user.id,
        document_id: documentId,
        action,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.warn('Failed to insert audit log:', error);
      return null;
    }

    return data as AuditLog;
  },

  /**
   * Fetches audit logs for the authenticated user, optionally filtered by category.
   */
  async getAuditLogs(category: AuditCategory = 'ALL'): Promise<ExtendedAuditLog[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        document:documents(*)
      `)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    const actionsMap: Record<AuditCategory, AuditAction[] | null> = {
      ALL: null,
      BLOCKCHAIN: ['BLOCKCHAIN_ANCHORED', 'BLOCKCHAIN_ANCHOR_FAILED'],
      INTEGRITY: ['HASH_CREATED', 'DOCUMENT_VERIFIED'],
      SHARING: ['DOCUMENT_SHARED', 'SHARE_REVOKED'],
      FILES: ['DOCUMENT_UPLOADED', 'DOCUMENT_VIEWED', 'DOCUMENT_DOWNLOADED', 'DOCUMENT_RENAMED', 'DOCUMENT_MOVED', 'DOCUMENT_DELETED'],
    };

    const targetActions = actionsMap[category];
    if (targetActions) {
      query = query.in('action', targetActions);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching audit logs:', error);
      return [];
    }

    return (data || []) as ExtendedAuditLog[];
  },

  /**
   * Clears audit logs for the authenticated user.
   */
  async clearAuditLogs(): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .eq('user_id', user.user.id);

    if (error) {
      console.warn('Error clearing audit logs:', error);
      throw error;
    }
  }
};
