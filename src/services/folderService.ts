// ============================================================
// TrustLink — Folder Service
// ============================================================

import { supabase } from '@/lib/supabase';
import { Folder } from '@/types';

export const folderService = {
  /**
   * Fetches folders for the current user.
   * @param parentFolderId If null, fetches root folders. If string, fetches subfolders.
   */
  async getFolders(parentFolderId: string | null = null): Promise<Folder[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    let query = supabase
      .from('folders')
      .select('*')
      .eq('owner_id', user.user.id)
      .order('name', { ascending: true });

    if (parentFolderId === null) {
      query = query.is('parent_folder_id', null);
    } else {
      query = query.eq('parent_folder_id', parentFolderId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data as Folder[];
  },

  /**
   * Creates a new folder and logs audit event.
   */
  async createFolder(name: string, parentFolderId: string | null = null): Promise<Folder> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Ensure profile exists in public.profiles
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

    const { data, error } = await supabase
      .from('folders')
      .insert({
        owner_id: user.user.id,
        name,
        parent_folder_id: parentFolderId,
      })
      .select()
      .single();

    if (error) throw error;

    // Log to backend audit trail
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.user.id,
        action: 'FOLDER_CREATED',
        metadata: { folder_id: data.id, folder_name: name, parent_folder_id: parentFolderId },
      });
    } catch (e) {}

    return data as Folder;
  },

  /**
   * Renames a folder and logs audit event.
   */
  async renameFolder(folderId: string, newName: string): Promise<Folder> {
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('folders')
      .update({ name: newName })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;

    // Log to backend audit trail
    if (user?.user) {
      try {
        await supabase.from('audit_logs').insert({
          user_id: user.user.id,
          action: 'FOLDER_RENAMED',
          metadata: { folder_id: folderId, new_name: newName },
        });
      } catch (e) {}
    }

    return data as Folder;
  },

  /**
   * Deletes only the folder, moving all files inside it safely to the main vault (root).
   */
  async deleteFolderPreservingFiles(folderId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // 1. Unlink documents from this folder (move to root)
    const { error: moveError } = await supabase
      .from('documents')
      .update({ folder_id: null })
      .eq('folder_id', folderId)
      .eq('owner_id', user.user.id);

    if (moveError) throw moveError;

    // 2. Delete the empty folder
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('owner_id', user.user.id);

    if (deleteError) throw deleteError;

    // 3. Log to backend audit trail
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.user.id,
        action: 'FOLDER_DELETED',
        metadata: { folder_id: folderId, preserved_files: true },
      });
    } catch (e) {}
  },

  /**
   * Deletes a folder and all documents inside it.
   */
  async deleteFolder(folderId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (error) throw error;

    // Log to backend audit trail
    if (user?.user) {
      try {
        await supabase.from('audit_logs').insert({
          user_id: user.user.id,
          action: 'FOLDER_DELETED',
          metadata: { folder_id: folderId, cascade_files: true },
        });
      } catch (e) {}
    }
  }
};
