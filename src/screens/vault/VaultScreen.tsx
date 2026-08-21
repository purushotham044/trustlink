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
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
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

  // Modal states for New Folder and Rename Folder
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const loadVaultContents = async () => {
    try {
      const [foldersData, documentsData] = await Promise.all([
        folderService.getFolders(folderId),
        documentService.getDocuments(folderId),
      ]);

      const combined: ListItem[] = [
        ...foldersData.map(f => ({ type: 'folder' as const, data: f })),
        ...documentsData.map(d => ({ type: 'document' as const, data: d })),
      ];

      setItems(combined);
    } catch (err: any) {
      console.error('[VaultScreen] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVaultContents();
    }, [folderId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadVaultContents();
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      if (item.type === 'folder') return item.data.name.toLowerCase().includes(q);
      return item.data.name.toLowerCase().includes(q);
    });
  }, [items, searchQuery]);

  const handleOpenCreateFolderModal = () => {
    setNewFolderName('');
    setCreateModalVisible(true);
  };

  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      Alert.alert('Folder Name Required', 'Please enter a name for your new folder.');
      return;
    }

    try {
      setCreatingFolder(true);
      await folderService.createFolder(trimmed, folderId);
      setCreateModalVisible(false);
      setNewFolderName('');
      loadVaultContents();
    } catch (err: any) {
      Alert.alert('Could Not Create Folder', err.message || 'An error occurred.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleFolderOptions = (folder: Folder) => {
    Alert.alert(
      folder.name,
      'Choose an action for this folder:',
      [
        {
          text: 'Rename Folder',
          onPress: () => {
            setRenamingFolder(folder);
            setEditFolderName(folder.name);
            setRenameModalVisible(true);
          },
        },
        {
          text: 'Delete (Keep Files in Vault)',
          onPress: () => confirmDeleteFolder(folder, false),
        },
        {
          text: 'Delete Folder & All Files Inside',
          style: 'destructive',
          onPress: () => confirmDeleteFolder(folder, true),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const confirmDeleteFolder = (folder: Folder, cascadeDeleteFiles: boolean) => {
    const title = cascadeDeleteFiles ? 'Delete Folder & All Contained Files' : 'Delete Folder';
    const message = cascadeDeleteFiles
      ? `Are you sure you want to permanently delete "${folder.name}" AND all files inside it? This cannot be undone.`
      : `Delete folder "${folder.name}"? Files inside will be moved safely to your root vault.`;

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await folderService.deleteFolder(folder.id, cascadeDeleteFiles);
              loadVaultContents();
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Could not delete folder.');
            }
          },
        },
      ]
    );
  };

  const handleRenameFolder = async () => {
    if (!renamingFolder) return;
    const trimmed = editFolderName.trim();
    if (!trimmed) {
      Alert.alert('Folder Name Required', 'Please enter a valid folder name.');
      return;
    }

    try {
      setIsRenaming(true);
      await folderService.renameFolder(renamingFolder.id, trimmed);
      setRenameModalVisible(false);
      setRenamingFolder(null);
      setEditFolderName('');
      loadVaultContents();
    } catch (err: any) {
      Alert.alert('Rename Failed', err.message || 'Could not rename folder.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploading(true);

      setUploadProgress({
        visible: true,
        fileName: asset.name,
        step: 1,
        statusText: 'Reading file binary & computing SHA-256 fingerprint...',
        isComplete: false,
      });

      await documentService.uploadDocument(
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size ?? 0,
        },
        folderId,
        (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            step: progress.step,
            statusText: progress.statusText,
          }));
        }
      );

      setUploadProgress(prev => ({
        ...prev,
        step: 4,
        statusText: 'Document vaulted & secured successfully!',
        isComplete: true,
      }));

      loadVaultContents();
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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Search and Action Bar */}
      <View style={styles.topBar}>
        {isInsideFolder && (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={isInsideFolder ? `Search in ${folderName}...` : "Search vault files..."}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerActions}>
          {/* Only show "New Folder" at Root Level */}
          {!isInsideFolder && (
            <TouchableOpacity
              style={[styles.actionIconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleOpenCreateFolderModal}
              activeOpacity={0.7}
            >
              <Feather name="folder-plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionIconButton, styles.uploadButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={handleUploadFile}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="upload" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Breadcrumb path if inside folder */}
      {isInsideFolder && (
        <View style={[styles.breadcrumb, { backgroundColor: colors.surfaceHighlight, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.popToTop()}>
            <Text style={[styles.breadcrumbRoot, { color: colors.primary }]}>Vault Root</Text>
          </TouchableOpacity>
          <Text style={[styles.breadcrumbDivider, { color: colors.textMuted }]}> › </Text>
          <Text style={[styles.breadcrumbCurrent, { color: colors.textSecondary }]} numberOfLines={1}>{folderName}</Text>
        </View>
      )}

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => `${item.type}-${item.data.id}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 80 }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="folder" size={48} color={colors.textMuted} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery ? 'No matching vault items' : isInsideFolder ? 'Folder is empty' : 'Your vault is empty'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {searchQuery
                  ? 'Try searching with a different filename or extension'
                  : 'Upload documents or create folders to organize your cryptographic records.'}
              </Text>
              {!searchQuery && (
                <View style={styles.emptyActions}>
                  {!isInsideFolder && (
                    <TouchableOpacity
                      style={[styles.emptyActionButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                      onPress={handleOpenCreateFolderModal}
                    >
                      <Feather name="folder-plus" size={16} color={colors.primary} />
                      <Text style={[styles.emptyActionText, { color: colors.primary }]}>New Folder</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.emptyActionButton, styles.emptyUploadButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={handleUploadFile}
                  >
                    <Feather name="upload" size={16} color="#FFFFFF" />
                    <Text style={[styles.emptyActionText, { color: '#FFFFFF' }]}>Upload Document</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
        />
      )}

      {/* New Folder Modal */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: colors.primaryMuted }]}>
                <Feather name="folder-plus" size={22} color={colors.primary} />
              </View>
              <View style={styles.modalHeaderInfo}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create New Folder</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Organize your cryptographic documents</Text>
              </View>
            </View>

            <TextInput
              style={[styles.folderInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. Legal Contracts, Invoices 2026"
              placeholderTextColor={colors.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
              autoCapitalize="words"
              maxLength={60}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCreateModalVisible(false)}
                disabled={creatingFolder}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              
              <Button
                label={creatingFolder ? 'Creating...' : 'Create Folder'}
                onPress={handleCreateFolder}
                disabled={creatingFolder}
                style={styles.createButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: colors.primaryMuted }]}>
                <Feather name="edit-2" size={20} color={colors.primary} />
              </View>
              <View style={styles.modalHeaderInfo}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Rename Folder</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Enter a new name for this folder</Text>
              </View>
            </View>

            <TextInput
              style={[styles.folderInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Folder Name"
              placeholderTextColor={colors.textMuted}
              value={editFolderName}
              onChangeText={setEditFolderName}
              autoFocus={true}
              autoCapitalize="words"
              maxLength={60}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRenameModalVisible(false)}
                disabled={isRenaming}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              
              <Button
                label={isRenaming ? 'Saving...' : 'Save Name'}
                onPress={handleRenameFolder}
                disabled={isRenaming}
                style={styles.createButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Executive Upload Progress Animation Modal */}
      <UploadProgressModal
        state={uploadProgress}
        onClose={() => setUploadProgress(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 40,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
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
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {},
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  breadcrumbRoot: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
  },
  breadcrumbDivider: {
    fontSize: TYPOGRAPHY.xs,
  },
  breadcrumbCurrent: {
    fontSize: TYPOGRAPHY.xs,
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
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
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
  },
  emptyUploadButton: {},
  emptyActionText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
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
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  folderInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
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
  },
  createButton: {
    minWidth: 120,
  },
});
