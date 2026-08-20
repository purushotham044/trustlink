// ============================================================
// TrustLink — Professional Activity Screen (Audit Trail)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, AUDIT_ACTION_LABELS } from '@/constants';
import { auditService, ExtendedAuditLog, AuditCategory } from '@/services/auditService';
import { truncateHash, truncateTxHash } from '@/lib/crypto';

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<AuditCategory>('ALL');
  const [logs, setLogs] = useState<ExtendedAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async (category: AuditCategory = activeCategory) => {
    try {
      const data = await auditService.getAuditLogs(category);
      setLogs(data);
    } catch (err: any) {
      console.warn('Error loading audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadLogs(activeCategory);
  }, [activeCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs(activeCategory);
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'BLOCKCHAIN_ANCHORED':
        return {
          icon: <Feather name="link" size={14} color={COLORS.blockchain} />,
          color: COLORS.blockchain,
          bgColor: COLORS.blockchainMuted,
          label: 'Blockchain Proof Anchored',
        };
      case 'BLOCKCHAIN_ANCHOR_FAILED':
        return {
          icon: <Feather name="alert-triangle" size={14} color={COLORS.danger} />,
          color: COLORS.danger,
          bgColor: COLORS.dangerMuted,
          label: 'Anchoring Failed',
        };
      case 'HASH_CREATED':
        return {
          icon: <Feather name="lock" size={14} color={COLORS.primary} />,
          color: COLORS.primary,
          bgColor: COLORS.primaryMuted,
          label: 'Digital Fingerprint Generated',
        };
      case 'DOCUMENT_VERIFIED':
        return {
          icon: <Feather name="check-circle" size={14} color={COLORS.success} />,
          color: COLORS.success,
          bgColor: COLORS.successMuted,
          label: 'Cryptographic Integrity Verified',
        };
      case 'DOCUMENT_SHARED':
        return {
          icon: <Feather name="share-2" size={14} color={COLORS.warning} />,
          color: COLORS.warning,
          bgColor: COLORS.warningMuted,
          label: 'Document Shared',
        };
      case 'SHARE_REVOKED':
        return {
          icon: <Feather name="slash" size={14} color={COLORS.danger} />,
          color: COLORS.danger,
          bgColor: COLORS.dangerMuted,
          label: 'Share Access Revoked',
        };
      case 'DOCUMENT_UPLOADED':
        return {
          icon: <Feather name="upload" size={14} color={COLORS.primary} />,
          color: COLORS.primary,
          bgColor: COLORS.primaryMuted,
          label: 'Document Uploaded',
        };
      case 'DOCUMENT_DOWNLOADED':
        return {
          icon: <Feather name="download" size={14} color={COLORS.textSecondary} />,
          color: COLORS.textSecondary,
          bgColor: 'rgba(148, 163, 184, 0.12)',
          label: 'Document Downloaded',
        };
      case 'DOCUMENT_DELETED':
        return {
          icon: <Feather name="trash-2" size={14} color={COLORS.danger} />,
          color: COLORS.danger,
          bgColor: COLORS.dangerMuted,
          label: 'Document Deleted',
        };
      default:
        return {
          icon: <Feather name="activity" size={14} color={COLORS.textSecondary} />,
          color: COLORS.textSecondary,
          bgColor: COLORS.surfaceBorder,
          label: AUDIT_ACTION_LABELS[action] || action,
        };
    }
  };

  const renderTimelineItem = ({ item, index }: { item: ExtendedAuditLog; index: number }) => {
    const config = getActionConfig(item.action);
    const dateObj = new Date(item.created_at);
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    const metadata = item.metadata as Record<string, any> | null;

    return (
      <View style={styles.timelineRow}>
        {/* Timeline Node Column */}
        <View style={styles.nodeColumn}>
          <View style={[styles.nodeIconContainer, { backgroundColor: config.bgColor, borderColor: config.color }]}>
            {config.icon}
          </View>
          {index < logs.length - 1 && <View style={styles.nodeLine} />}
        </View>

        {/* Card Content */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.actionBadge, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.actionBadgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
            <Text style={styles.timestamp}>{timeStr} • {dateStr}</Text>
          </View>

          {item.document ? (
            <View style={styles.docRow}>
              <MaterialCommunityIcons name="file-document-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.documentName} numberOfLines={1}>
                {item.document.name}
              </Text>
            </View>
          ) : item.document_id ? (
            <Text style={styles.documentIdText} numberOfLines={1}>
              Doc ID: {item.document_id}
            </Text>
          ) : null}

          {metadata && (
            <View style={styles.metadataBox}>
              {metadata.hash && (
                <Text style={styles.metaLine}>
                  <Text style={styles.metaKey}>SHA-256: </Text>
                  <Text style={styles.metaValMono}>{truncateHash(metadata.hash)}</Text>
                </Text>
              )}
              {metadata.transaction_hash && (
                <Text style={styles.metaLine}>
                  <Text style={styles.metaKey}>Tx Hash: </Text>
                  <Text style={styles.metaValMono}>{truncateTxHash(metadata.transaction_hash)}</Text>
                </Text>
              )}
              {metadata.permission && (
                <Text style={styles.metaLine}>
                  <Text style={styles.metaKey}>Permission: </Text>
                  <Text style={styles.metaVal}>{metadata.permission}</Text>
                </Text>
              )}
              {metadata.network && (
                <Text style={styles.metaLine}>
                  <Text style={styles.metaKey}>Network: </Text>
                  <Text style={styles.metaVal}>{metadata.network}</Text>
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const categories: { key: AuditCategory; label: string }[] = [
    { key: 'ALL', label: 'All Events' },
    { key: 'BLOCKCHAIN', label: 'Blockchain' },
    { key: 'INTEGRITY', label: 'Integrity' },
    { key: 'SHARING', label: 'Sharing' },
    { key: 'FILES', label: 'Files' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Category Pills */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterPill, activeCategory === cat.key && styles.filterPillActive]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, activeCategory === cat.key && styles.filterPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderTimelineItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="activity" size={44} color={COLORS.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No Activity Recorded Yet</Text>
              <Text style={styles.emptySubtitle}>
                Security events, document hashes, blockchain proofs, and sharing actions will appear here in an append-only audit trail.
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
  filterWrapper: {
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textMuted,
  },
  filterPillTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.semibold,
  },
  list: {
    padding: SPACING.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  nodeColumn: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 28,
  },
  nodeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  nodeLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 2,
  },
  documentName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  documentIdText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metadataBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  metaLine: {
    fontSize: 11,
    lineHeight: 16,
  },
  metaKey: {
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.medium,
  },
  metaVal: {
    color: COLORS.textSecondary,
  },
  metaValMono: {
    color: COLORS.primary,
    fontFamily: 'monospace',
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
