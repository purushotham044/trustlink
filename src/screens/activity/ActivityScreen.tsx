// ============================================================
// TrustLink — Clean, Professional Activity & Audit Trail Screen
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
  Modal,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { auditService, ExtendedAuditLog, AuditCategory } from '@/services/auditService';
import { truncateHash, truncateTxHash } from '@/lib/crypto';
import { BLOCKCHAIN_EXPLORER_BASE } from '@/constants';
import { Button } from '@/components/common/Button';

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<AuditCategory>('ALL');
  const [logs, setLogs] = useState<ExtendedAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExtendedAuditLog | null>(null);

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
          icon: <Feather name="link" size={16} color={COLORS.blockchain} />,
          title: 'Blockchain Proof Created',
          badgeText: 'Ethereum Sepolia',
          badgeColor: COLORS.blockchain,
          badgeBg: COLORS.blockchainMuted,
        };
      case 'BLOCKCHAIN_ANCHOR_FAILED':
        return {
          icon: <Feather name="alert-triangle" size={16} color={COLORS.danger} />,
          title: 'Blockchain Anchoring Failed',
          badgeText: 'Failed',
          badgeColor: COLORS.danger,
          badgeBg: COLORS.dangerMuted,
        };
      case 'HASH_CREATED':
        return {
          icon: <Feather name="lock" size={16} color={COLORS.primary} />,
          title: 'Digital Fingerprint Generated',
          badgeText: 'SHA-256',
          badgeColor: COLORS.primary,
          badgeBg: COLORS.primaryMuted,
        };
      case 'DOCUMENT_VERIFIED':
        return {
          icon: <Feather name="check-circle" size={16} color={COLORS.success} />,
          title: 'Cryptographic Integrity Verified',
          badgeText: 'Intact',
          badgeColor: COLORS.success,
          badgeBg: COLORS.successMuted,
        };
      case 'DOCUMENT_SHARED':
        return {
          icon: <Feather name="share-2" size={16} color={COLORS.warning} />,
          title: 'Document Access Shared',
          badgeText: 'Shared',
          badgeColor: COLORS.warning,
          badgeBg: COLORS.warningMuted,
        };
      case 'SHARE_REVOKED':
        return {
          icon: <Feather name="slash" size={16} color={COLORS.danger} />,
          title: 'Share Access Revoked',
          badgeText: 'Revoked',
          badgeColor: COLORS.danger,
          badgeBg: COLORS.dangerMuted,
        };
      case 'DOCUMENT_UPLOADED':
        return {
          icon: <Feather name="upload" size={16} color={COLORS.primary} />,
          title: 'Document Stored in Vault',
          badgeText: 'Stored',
          badgeColor: COLORS.primary,
          badgeBg: COLORS.primaryMuted,
        };
      case 'DOCUMENT_DOWNLOADED':
        return {
          icon: <Feather name="download" size={16} color={COLORS.textSecondary} />,
          title: 'Document Downloaded',
          badgeText: 'Download',
          badgeColor: COLORS.textSecondary,
          badgeBg: 'rgba(148, 163, 184, 0.12)',
        };
      case 'DOCUMENT_DELETED':
        return {
          icon: <Feather name="trash-2" size={16} color={COLORS.danger} />,
          title: 'Document Removed from Vault',
          badgeText: 'Deleted',
          badgeColor: COLORS.danger,
          badgeBg: COLORS.dangerMuted,
        };
      default:
        return {
          icon: <Feather name="activity" size={16} color={COLORS.textSecondary} />,
          title: action.replace(/_/g, ' '),
          badgeText: 'Event',
          badgeColor: COLORS.textSecondary,
          badgeBg: COLORS.surfaceElevated,
        };
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;

    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  const renderLogCard = ({ item }: { item: ExtendedAuditLog }) => {
    const config = getActionConfig(item.action);
    const docName = item.document?.name || (item.metadata as any)?.name || 'Document';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedEvent(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: config.badgeBg }]}>
            {config.icon}
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{config.title}</Text>
            <Text style={styles.cardDocName} numberOfLines={1}>
              {docName}
            </Text>
            <Text style={styles.cardTimestamp}>{formatEventDate(item.created_at)}</Text>
          </View>

          <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
            <Text style={[styles.badgeText, { color: config.badgeColor }]}>
              {config.badgeText}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const categories: { key: AuditCategory; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'FILES', label: 'Uploads' },
    { key: 'INTEGRITY', label: 'Integrity' },
    { key: 'BLOCKCHAIN', label: 'Blockchain' },
    { key: 'SHARING', label: 'Sharing' },
  ];

  const selectedMeta = selectedEvent?.metadata as Record<string, any> | null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>SECURITY AUDIT TRAIL</Text>
          <Text style={styles.headerTitle}>Activity History</Text>
        </View>
        <View style={styles.appendOnlyBadge}>
          <Feather name="shield" size={12} color={COLORS.success} />
          <Text style={styles.appendOnlyText}>Append-Only</Text>
        </View>
      </View>

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

      {/* Main List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogCard}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="clock" size={44} color={COLORS.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No Activity in this Category</Text>
              <Text style={styles.emptySubtitle}>
                Every file upload, cryptographic verification, blockchain proof, and sharing action is permanently recorded here.
              </Text>
            </View>
          }
        />
      )}

      {/* Event Details Modal */}
      <Modal
        visible={Boolean(selectedEvent)}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Event Details</Text>
              <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Action</Text>
                  <Text style={styles.modalMetaValue}>
                    {getActionConfig(selectedEvent.action).title}
                  </Text>
                </View>

                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Recorded Time</Text>
                  <Text style={styles.modalMetaValue}>
                    {new Date(selectedEvent.created_at).toLocaleString()}
                  </Text>
                </View>

                {selectedEvent.document && (
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaLabel}>Document</Text>
                    <Text style={styles.modalMetaValue}>
                      {selectedEvent.document.name}
                    </Text>
                  </View>
                )}

                {selectedMeta?.hash && (
                  <View style={styles.modalMetaBlock}>
                    <Text style={styles.modalMetaLabel}>SHA-256 Digital Fingerprint</Text>
                    <Text style={styles.modalMetaMono} selectable={true}>
                      {selectedMeta.hash}
                    </Text>
                  </View>
                )}

                {selectedMeta?.transaction_hash && (
                  <View style={styles.modalMetaBlock}>
                    <Text style={styles.modalMetaLabel}>Ethereum Transaction Hash</Text>
                    <Text style={styles.modalMetaMono} selectable={true}>
                      {selectedMeta.transaction_hash}
                    </Text>
                    <TouchableOpacity
                      style={styles.etherscanLink}
                      onPress={() => Linking.openURL(`${BLOCKCHAIN_EXPLORER_BASE}${selectedMeta.transaction_hash}`)}
                    >
                      <Text style={styles.etherscanLinkText}>View on Sepolia Etherscan</Text>
                      <Feather name="external-link" size={12} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {selectedMeta?.network && (
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaLabel}>Network</Text>
                    <Text style={styles.modalMetaValue}>{selectedMeta.network}</Text>
                  </View>
                )}

                {selectedMeta?.recipient && (
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaLabel}>Shared With</Text>
                    <Text style={styles.modalMetaValue}>{selectedMeta.recipient}</Text>
                  </View>
                )}

                {selectedMeta?.permission && (
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaLabel}>Permission</Text>
                    <Text style={styles.modalMetaValue}>{selectedMeta.permission}</Text>
                  </View>
                )}

                <View style={{ height: SPACING.lg }} />
                <Button
                  label="Close"
                  onPress={() => setSelectedEvent(null)}
                  variant="secondary"
                  fullWidth
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  appendOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successMuted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  appendOnlyText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.success,
  },
  filterWrapper: {
    paddingVertical: SPACING.sm,
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardDocName: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  cardTimestamp: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.3,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
  },
  modalBody: {
    paddingTop: SPACING.xs,
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalMetaLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  modalMetaValue: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'right',
  },
  modalMetaBlock: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalMetaMono: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  etherscanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  etherscanLinkText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.semibold,
  },
});
