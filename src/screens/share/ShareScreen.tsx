// ============================================================
// TrustLink — Professional Sharing Screen (Responsive)
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { shareService, ExtendedDocumentShare } from '@/services/shareService';
import { documentService } from '@/services/documentService';

type ShareTab = 'with_me' | 'by_me';

export function ShareScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
      'Revoke Share Access',
      `Are you sure you want to revoke access to "${share.document?.name || 'this document'}" for ${share.shared_with_email || 'the recipient'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Access',
          style: 'destructive',
          onPress: async () => {
            try {
              await shareService.revokeShare(share.id);
              loadShares();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not revoke share.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadShared = async (share: ExtendedDocumentShare) => {
    if (!share.document) {
      Alert.alert('Error', 'Document metadata unavailable');
      return;
    }

    if (share.permission === 'VIEW') {
      Alert.alert('View Only', 'This document is shared with View-Only permission. Direct file download is restricted by the owner.');
      return;
    }

    try {
      setDownloadingId(share.id);
      const uri = await documentService.downloadDocument(share.document);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: share.document.mime_type });
      } else {
        Alert.alert('Downloaded', `File saved to: ${uri}`);
      }
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Could not download shared document');
    } finally {
      setDownloadingId(null);
    }
  };

  const renderShareItem = ({ item }: { item: ExtendedDocumentShare }) => {
    const isRevoked = Boolean(item.revoked_at);
    const isExpired = item.expires_at && new Date(item.expires_at).getTime() < Date.now();

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, isRevoked && { opacity: 0.55 }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.docInfo}>
            <Text style={[styles.docTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.document?.name || 'Document'}
            </Text>
            <Text style={[styles.docMeta, { color: colors.textMuted }]}>
              {item.document ? `${Math.round(item.document.size / 1024)} KB` : 'Shared document'} • {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View style={[
            styles.permBadge,
            item.permission === 'DOWNLOAD' ? { backgroundColor: colors.primaryMuted } : { backgroundColor: colors.surfaceHighlight },
          ]}>
            <Text style={[
              styles.permText,
              item.permission === 'DOWNLOAD' ? { color: colors.primary } : { color: colors.textMuted },
            ]}>
              {item.permission === 'DOWNLOAD' ? 'DOWNLOAD' : 'VIEW ONLY'}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.cardFooter}>
          <View style={styles.statusCol}>
            {isRevoked ? (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.statusRevoked, { color: colors.danger }]}>Access Revoked</Text>
              </View>
            ) : isExpired ? (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.statusExpired, { color: colors.warning }]}>Expired</Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statusActive, { color: colors.success }]}>
                  Active {item.expires_at ? `(Expires ${new Date(item.expires_at).toLocaleDateString()})` : '(Permanent)'}
                </Text>
              </View>
            )}
          </View>

          {activeTab === 'by_me' && !isRevoked && (
            <TouchableOpacity
              style={[styles.revokeButton, { borderColor: colors.danger + '50' }]}
              onPress={() => handleRevoke(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.revokeText, { color: colors.danger }]}>Revoke</Text>
            </TouchableOpacity>
          )}

          {activeTab === 'with_me' && !isRevoked && !isExpired && (
            <TouchableOpacity
              style={[
                styles.downloadButton,
                { backgroundColor: colors.primary },
                item.permission === 'VIEW' && { backgroundColor: colors.surfaceHighlight },
              ]}
              onPress={() => handleDownloadShared(item)}
              disabled={downloadingId === item.id || item.permission === 'VIEW'}
              activeOpacity={0.7}
            >
              {downloadingId === item.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.downloadText, item.permission === 'VIEW' ? { color: colors.textMuted } : { color: '#FFFFFF' }]}>
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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Segmented Tab Header */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'with_me' && [styles.activeTab, { backgroundColor: colors.surface }]]}
          onPress={() => setActiveTab('with_me')}
          activeOpacity={0.7}
        >
          <Feather
            name="inbox"
            size={16}
            color={activeTab === 'with_me' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: colors.textMuted },
              activeTab === 'with_me' && [styles.activeTabText, { color: colors.primary }],
            ]}
          >
            Shared With Me ({sharesWithMe.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'by_me' && [styles.activeTab, { backgroundColor: colors.surface }]]}
          onPress={() => setActiveTab('by_me')}
          activeOpacity={0.7}
        >
          <Feather
            name="send"
            size={16}
            color={activeTab === 'by_me' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: colors.textMuted },
              activeTab === 'by_me' && [styles.activeTabText, { color: colors.primary }],
            ]}
          >
            Shared By Me ({sharesByMe.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Share List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderShareItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
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
              <Feather
                name={activeTab === 'with_me' ? 'inbox' : 'send'}
                size={48}
                color={colors.textMuted}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {activeTab === 'with_me' ? 'No incoming shares' : 'No documents shared yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {activeTab === 'with_me'
                  ? 'When colleagues or clients share cryptographic documents with you, they will appear here.'
                  : 'You can grant secure, time-bounded access to any vault document from its details page.'}
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  activeTab: {
    shadowColor: 'rgba(15, 23, 42, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.medium,
  },
  activeTabText: {
    fontWeight: TYPOGRAPHY.bold,
  },
  list: {
    padding: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 2,
  },
  docMeta: {
    fontSize: TYPOGRAPHY.xs,
  },
  permBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  permText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.sm,
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
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusActive: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.medium,
  },
  statusExpired: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.medium,
  },
  statusRevoked: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.medium,
  },
  revokeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  revokeText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
  },
  downloadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  downloadText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
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
  },
});
