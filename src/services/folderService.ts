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
   * Creates a new folder.
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
    return data as Folder;
  },

  /**
   * Renames a folder.
   */
  async renameFolder(folderId: string, newName: string): Promise<Folder> {
    const { data, error } = await supabase
      .from('folders')
      .update({ name: newName })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data as Folder;
  },

  /**
   * Deletes a folder (and cascades its contents via PostgreSQL constraints).
   */
  async deleteFolder(folderId: string): Promise<void> {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (error) throw error;
  }
};
