// ============================================================
// TrustLink — Professional Vault Screen (File & Folder Explorer)
// Cross-Platform: Works seamlessly on Android (OPPO F23), iOS & Web
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
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
import { UploadProgressModal, UploadProgressState } from '@/components/common/UploadProgressModal';

type Props = StackScreenProps<VaultStackParamList, 'VaultRoot'>;

type ListItem = 
  | { type: 'folder'; data: Folder }
  | { type: 'document'; data: VaultDocument };

export function VaultScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { folderId, folderName } = route.params;
  const isInsideFolder = Boolean(folderId);

  const [items, setItems] = useState<ListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Live Upload Animation & Step Progress State
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    visible: false,
    fileName: '',
    step: 1,
    statusText: 'Preparing upload...',
    isComplete: false,
  });

  // Folder Modal State (Create / Rename)
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'rename'>('create');
  const [targetFolder, setTargetFolder] = useState<Folder | null>(null);
  const [folderInputText, setFolderInputText] = useState('');
  const [savingFolder, setSavingFolder] = useState(false);

  const loadData = async () => {
    try {
      const [folders, documents] = await Promise.all([
        isInsideFolder ? Promise.resolve([]) : folderService.getFolders(null),
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [folderId])
  );

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
    setFolderModalMode('create');
    setTargetFolder(null);
    setFolderInputText('');
    setFolderModalVisible(true);
  };

  const handleOpenRenameFolderModal = (folder: Folder) => {
    setFolderModalMode('rename');
    setTargetFolder(folder);
    setFolderInputText(folder.name);
    setFolderModalVisible(true);
  };

  const handleFolderOptions = (folder: Folder) => {
    Alert.alert(
      `Folder: ${folder.name}`,
      'Manage this vault folder',
      [
        {
          text: 'Rename Folder',
          onPress: () => handleOpenRenameFolderModal(folder),
        },
        {
          text: 'Delete Folder (Keep Files in Main Vault)',
          onPress: () => {
            Alert.alert(
              'Keep Files & Delete Folder',
              `All documents inside "${folder.name}" will be moved safely to your main vault. Only the folder will be removed.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Move Files & Delete Folder',
                  onPress: async () => {
                    try {
                      await folderService.deleteFolderPreservingFiles(folder.id);
                      loadData();
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Could not delete folder');
                    }
                  }
                }
              ]
            );
          }
        },
        {
          text: 'Delete Folder and All Files',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Everything',
              `Permanently delete "${folder.name}" and all documents stored inside it?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await folderService.deleteFolder(folder.id);
                      loadData();
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Could not delete folder');
                    }
                  }
                }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleConfirmFolderSubmit = async () => {
    const trimmed = folderInputText.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a name for the folder.');
      return;
    }

    try {
      setSavingFolder(true);
      if (folderModalMode === 'create') {
        await folderService.createFolder(trimmed, null);
      } else if (targetFolder) {
        await folderService.renameFolder(targetFolder.id, trimmed);
      }
      setFolderModalVisible(false);
      setFolderInputText('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Operation Failed', err.message || 'Could not save folder');
    } finally {
      setSavingFolder(false);
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

      // Start upload animation overlay
      setUploadProgress({
        visible: true,
        fileName: file.name,
        step: 1,
        statusText: 'Computing SHA-256 digital fingerprint...',
        isComplete: false,
      });

      await documentService.uploadDocument(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream',
        folderId,
        (step, statusText) => {
          setUploadProgress(prev => ({
            ...prev,
            step,
            statusText,
            isComplete: step >= 4,
          }));
        }
      );

      // Instantly refresh vault list in background so the new file is immediately rendered
      await loadData();

      // Give smooth visual confirmation then close modal
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, visible: false }));
      }, 700);
    } catch (err: any) {
      setUploadProgress(prev => ({ ...prev, visible: false }));
      Alert.alert('Upload Notice', err.message || 'Could not complete file upload');
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
          onOptionsPress={() => handleFolderOptions(item.data)}
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
        {isInsideFolder && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isInsideFolder ? `Search in ${folderName}...` : "Search vault files..."}
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
          {/* Only show "New Folder" at Root Level */}
          {!isInsideFolder && (
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={handleOpenCreateFolderModal}
              activeOpacity={0.7}
            >
              <Feather name="folder-plus" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}

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

      {/* Breadcrumb path if inside folder */}
      {isInsideFolder && (
        <View style={styles.breadcrumb}>
          <TouchableOpacity onPress={() => navigation.popToTop()}>
            <Text style={styles.breadcrumbRoot}>Vault Root</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbDivider}> › </Text>
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
              <Feather name={isInsideFolder ? "file" : "folder"} size={48} color={COLORS.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? 'No matching files found'
                  : isInsideFolder
                  ? `No files in "${folderName}"`
                  : 'Your Vault is empty'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try searching with a different term.'
                  : isInsideFolder
                  ? 'Upload documents to securely store them inside this folder.'
                  : 'Create a folder or upload documents directly into your secure vault.'}
              </Text>

              <View style={styles.emptyActions}>
                {!isInsideFolder && (
                  <TouchableOpacity
                    style={styles.emptyActionButton}
                    onPress={handleOpenCreateFolderModal}
                  >
                    <Feather name="folder-plus" size={14} color={COLORS.primary} />
                    <Text style={styles.emptyActionText}>New Folder</Text>
                  </TouchableOpacity>
                )}

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

      {/* Cross-Platform Folder Modal (Create & Rename) */}
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
                <Feather name={folderModalMode === 'create' ? "folder-plus" : "edit-2"} size={20} color={COLORS.primary} />
              </View>
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalTitle}>
                  {folderModalMode === 'create' ? 'Create New Folder' : 'Rename Folder'}
                </Text>
                <Text style={styles.modalSubtitle}>Organize documents inside your secure vault</Text>
              </View>
            </View>

            <TextInput
              style={styles.folderInput}
              placeholder="e.g. Legal Documents, Invoices, Tax"
              placeholderTextColor={COLORS.textMuted}
              value={folderInputText}
              onChangeText={setFolderInputText}
              autoFocus={true}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleConfirmFolderSubmit}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setFolderModalVisible(false)}
                disabled={savingFolder}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <Button
                label={savingFolder ? 'Saving...' : folderModalMode === 'create' ? 'Create Folder' : 'Rename'}
                onPress={handleConfirmFolderSubmit}
                disabled={savingFolder || !folderInputText.trim()}
                variant="primary"
                style={styles.createButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Live Upload Progress & Animation Modal */}
      <UploadProgressModal state={uploadProgress} />
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: SPACING.sm,
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
    fontWeight: TYPOGRAPHY.bold,
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
    fontWeight: TYPOGRAPHY.bold,
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
