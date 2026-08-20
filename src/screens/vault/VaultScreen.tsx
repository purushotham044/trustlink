// ============================================================
// TrustLink — Professional Vault Screen (File & Folder Explorer)
// Cross-Platform: Works seamlessly on Android (OPPO F23), iOS & Web
// ============================================================

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { VaultStackParamList } from '@/navigation/VaultNavigator';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { folderService } from '@/services/folderService';
import { documentService } from '@/services/documentService';
import { Folder, Document as VaultDocument } from '@/types';
import { FolderCard } from '@/components/vault/FolderCard';
import { DocumentCard } from '@/components/vault/DocumentCard';
import { Button } from '@/components/common/Button';

type Props = StackScreenProps<VaultStackParamList, 'VaultRoot'>;

type ListItem = 
  | { type: 'folder'; data: Folder }
  | { type: 'document'; data: VaultDocument };

export function VaultScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { folderId, folderName } = route.params;

  const [items, setItems] = useState<ListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Cross-Platform Folder Modal State
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const loadData = async () => {
    try {
      const [folders, documents] = await Promise.all([
        folderService.getFolders(folderId),
        documentService.getDocuments(folderId),
      ]);

      const combined: ListItem[] = [
        ...folders.map(f => ({ type: 'folder' as const, data: f })),
        ...documents.map(d => ({ type: 'document' as const, data: d })),
      ];
      
      setItems(combined);
    } catch (err: any) {
      Alert.alert('Vault Notice', err.message || 'Could not refresh vault contents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [folderId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => item.data.name.toLowerCase().includes(q));
  }, [items, searchQuery]);

  const handleOpenCreateFolderModal = () => {
    setNewFolderName('');
    setFolderModalVisible(true);
  };

  const handleConfirmCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a name for the folder.');
      return;
    }

    try {
      setCreatingFolder(true);
      await folderService.createFolder(trimmed, folderId);
      setFolderModalVisible(false);
      setNewFolderName('');
      loadData();
    } catch (err: any) {
      Alert.alert('Create Folder Failed', err.message || 'Could not create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      await documentService.uploadDocument(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream',
        folderId
      );

      loadData();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'folder') {
      return (
        <FolderCard 
          folder={item.data} 
          onPress={() => navigation.push('VaultRoot', { 
            folderId: item.data.id, 
            folderName: item.data.name 
          })} 
        />
      );
    } else {
      return (
        <DocumentCard 
          document={item.data} 
          onPress={() => navigation.navigate('DocumentDetail', { document: item.data })} 
        />
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search and Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vault files..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={handleOpenCreateFolderModal}
            activeOpacity={0.7}
          >
            <Feather name="folder-plus" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionIconButton, styles.uploadButton]}
            onPress={handleUploadFile}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.textInverse} />
            ) : (
              <Feather name="upload" size={18} color={COLORS.textInverse} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Breadcrumb path if nested */}
      {folderId && (
        <View style={styles.breadcrumb}>
          <TouchableOpacity onPress={() => navigation.popToTop()}>
            <Text style={styles.breadcrumbRoot}>Vault</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbDivider}> / </Text>
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>{folderName}</Text>
        </View>
      )}

      {/* Main List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => `${item.type}-${item.data.id}`}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="folder" size={48} color={COLORS.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching files or folders' : 'This folder is empty'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search keyword.'
                  : 'Tap the folder or upload icon above to organize your vault.'}
              </Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={handleOpenCreateFolderModal}
                >
                  <Feather name="folder-plus" size={14} color={COLORS.primary} />
                  <Text style={styles.emptyActionText}>New Folder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.emptyActionButton, styles.emptyUploadButton]}
                  onPress={handleUploadFile}
                >
                  <Feather name="upload" size={14} color={COLORS.textInverse} />
                  <Text style={[styles.emptyActionText, { color: COLORS.textInverse }]}>Upload File</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}

      {/* Cross-Platform New Folder Modal */}
      <Modal
        visible={folderModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFolderModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Feather name="folder-plus" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalTitle}>Create New Folder</Text>
                <Text style={styles.modalSubtitle}>Organize documents inside your secure vault</Text>
              </View>
            </View>

            <TextInput
              style={styles.folderInput}
              placeholder="e.g. Legal Documents, Invoices, Tax"
              placeholderTextColor={COLORS.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleConfirmCreateFolder}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setFolderModalVisible(false)}
                disabled={creatingFolder}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <Button
                label={creatingFolder ? 'Creating...' : 'Create Folder'}
                onPress={handleConfirmCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                variant="primary"
                style={styles.createButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sm,
    paddingVertical: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: COLORS.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  breadcrumbRoot: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.semibold,
  },
  breadcrumbDivider: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  breadcrumbCurrent: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
    flexShrink: 1,
  },
  list: {
    padding: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  emptyUploadButton: {
    backgroundColor: COLORS.primary,
  },
  emptyActionText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: 'rgba(15, 23, 42, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  folderInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sm,
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textMuted,
  },
  createButton: {
    minWidth: 120,
  },
});
