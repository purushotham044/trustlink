// ============================================================
// TrustLink — Professional Sharing Screen
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { shareService, ExtendedDocumentShare } from '@/services/shareService';
import { documentService } from '@/services/documentService';

type ShareTab = 'with_me' | 'by_me';

export function ShareScreen() {
  const [activeTab, setActiveTab] = useState<ShareTab>('with_me');
  const [sharesWithMe, setSharesWithMe] = useState<ExtendedDocumentShare[]>([]);
  const [sharesByMe, setSharesByMe] = useState<ExtendedDocumentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadShares = async () => {
    try {
      const [withMe, byMe] = await Promise.all([
        shareService.getSharesWithMe(),
        shareService.getSharesByMe(),
      ]);
      setSharesWithMe(withMe);
      setSharesByMe(byMe);
    } catch (err: any) {
      console.warn('Error loading shares:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadShares();
  };

  const handleRevoke = (share: ExtendedDocumentShare) => {
    Alert.alert(
      'Revoke Access',
      `Are you sure you want to revoke access to "${share.document?.name || 'this document'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await shareService.revokeShare(share.id, share.document_id);
              Alert.alert('Revoked', 'Access has been revoked immediately.');
              loadShares();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not revoke share');
            }
          },
        },
      ]
    );
  };

  const handleDownloadShared = async (share: ExtendedDocumentShare) => {
    if (!share.document) return;
    if (share.permission === 'VIEW') {
      Alert.alert('View Only', 'You have VIEW permission for this document. Downloading is restricted by the owner.');
      return;
    }

    try {
      setDownloadingId(share.id);
      const uri = await documentService.downloadDocument(share.document);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: share.document.mime_type });
      } else {
        Alert.alert('Downloaded', `Saved to: ${uri}`);
      }
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Could not download shared file');
    } finally {
      setDownloadingId(null);
    }
  };

  const renderShareItem = ({ item }: { item: ExtendedDocumentShare }) => {
    const isRevoked = Boolean(item.revoked_at);
    const isExpired = item.expires_at && new Date(item.expires_at).getTime() < Date.now();

    return (
      <View style={[styles.card, isRevoked && styles.cardRevoked]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle} numberOfLines={1}>
              {item.document?.name || 'Document'}
            </Text>
            <Text style={styles.docMeta}>
              {item.document ? `${Math.round(item.document.size / 1024)} KB` : 'Shared document'} • {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View style={[
            styles.permBadge,
            item.permission === 'DOWNLOAD' ? styles.permDownload : styles.permView,
          ]}>
            <Text style={[
              styles.permText,
              item.permission === 'DOWNLOAD' ? styles.permDownloadText : styles.permViewText,
            ]}>
              {item.permission}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.statusCol}>
            {isRevoked ? (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: COLORS.danger }]} />
                <Text style={styles.statusRevoked}>Access Revoked</Text>
              </View>
            ) : isExpired ? (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.statusExpired}>Expired</Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.statusActive}>
                  Active {item.expires_at ? `(Expires ${new Date(item.expires_at).toLocaleDateString()})` : ''}
                </Text>
              </View>
            )}
          </View>

          {activeTab === 'by_me' && !isRevoked && (
            <TouchableOpacity
              style={styles.revokeButton}
              onPress={() => handleRevoke(item)}
            >
              <Text style={styles.revokeText}>Revoke</Text>
            </TouchableOpacity>
          )}

          {activeTab === 'with_me' && !isRevoked && !isExpired && (
            <TouchableOpacity
              style={[styles.downloadButton, item.permission === 'VIEW' && styles.disabledButton]}
              onPress={() => handleDownloadShared(item)}
              disabled={downloadingId === item.id || item.permission === 'VIEW'}
            >
              {downloadingId === item.id ? (
                <ActivityIndicator size="small" color={COLORS.textInverse} />
              ) : (
                <Text style={styles.downloadText}>
                  {item.permission === 'DOWNLOAD' ? 'Download' : 'View Only'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const currentList = activeTab === 'with_me' ? sharesWithMe : sharesByMe;

  return (
    <View style={styles.container}>
      {/* Segmented Tab Header */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'with_me' && styles.activeTab]}
          onPress={() => setActiveTab('with_me')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'with_me' && styles.activeTabText]}>
            Shared With Me ({sharesWithMe.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'by_me' && styles.activeTab]}
          onPress={() => setActiveTab('by_me')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'by_me' && styles.activeTabText]}>
            Shared By Me ({sharesByMe.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderShareItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="share-2" size={44} color={COLORS.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'with_me' ? 'No documents shared with you' : 'No documents shared yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'with_me'
                  ? 'When colleagues share files with your email, they will appear here with cryptographic integrity verification.'
                  : 'Open any document in your vault and tap "Share Document" to create a time-bounded link.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 4,
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  activeTab: {
    backgroundColor: COLORS.surfaceElevated,
  },
  tabText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.semibold,
  },
  list: {
    padding: SPACING.md,
    paddingTop: 0,
    paddingBottom: SPACING.xxxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRevoked: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  docInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  docTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  docMeta: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  permBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  permView: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  permDownload: {
    backgroundColor: COLORS.primaryMuted,
  },
  permText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.4,
  },
  permViewText: {
    color: COLORS.textSecondary,
  },
  permDownloadText: {
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusCol: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusActive: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.medium,
  },
  statusExpired: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.medium,
  },
  statusRevoked: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.medium,
  },
  revokeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  revokeText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
  },
  disabledButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  downloadText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
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
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
