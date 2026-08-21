// ============================================================
// TrustLink — Executive Security Audit Trail & Activity Timeline
// Clean, modern, timeline-based chronological activity history
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Linking,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { auditService, ExtendedAuditLog, AuditCategory } from '@/services/auditService';
import { truncateHash, truncateTxHash } from '@/lib/crypto';
import { BLOCKCHAIN_EXPLORER_BASE } from '@/constants';
import { Button } from '@/components/common/Button';

interface DateSection {
  title: string;
  data: ExtendedAuditLog[];
}

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<AuditCategory>('FILES');
  const [logs, setLogs] = useState<ExtendedAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExtendedAuditLog | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      loadLogs(activeCategory);
    }, [activeCategory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs(activeCategory);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    Clipboard.setString(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'BLOCKCHAIN_ANCHORED':
        return {
          icon: <Feather name="link" size={14} color={COLORS.blockchain} />,
          title: 'Ethereum Proof Created',
          badgeText: 'Sepolia',
          badgeColor: COLORS.blockchain,
          badgeBg: COLORS.blockchainMuted,
          nodeColor: COLORS.blockchain,
        };
      case 'BLOCKCHAIN_ANCHOR_FAILED':
        return {
          icon: <Feather name="alert-triangle" size={14} color={COLORS.danger} />,
          title: 'Blockchain Anchoring Failed',
          badgeText: 'Failed',
          badgeColor: COLORS.danger,
          badgeBg: COLORS.dangerMuted,
          nodeColor: COLORS.danger,
        };
      case 'HASH_CREATED':
        return {
          icon: <Feather name="shield" size={14} color={COLORS.primary} />,
          title: 'Digital Fingerprint Created',
          badgeText: 'SHA-256',
          badgeColor: COLORS.primary,
          badgeBg: COLORS.primaryMuted,
          nodeColor: COLORS.primary,
        };
      case 'DOCUMENT_VERIFIED':
        return {
          icon: <Feather name="check" size={14} color={COLORS.success} />,
          title: 'Cryptographic Check Passed',
          badgeText: 'Authentic',
          badgeColor: COLORS.success,
          badgeBg: COLORS.successMuted,
          nodeColor: COLORS.success,
        };
      case 'DOCUMENT_SHARED':
        return {
          icon: <Feather name="share-2" size={14} color={COLORS.warning} />,
          title: 'Document Access Shared',
          badgeText: 'Shared',
          badgeColor: COLORS.warning,
          badgeBg: COLORS.warningMuted,
          nodeColor: COLORS.warning,
        };
      case 'SHARE_REVOKED':
        return {
          icon: <Feather name="slash" size={14} color={COLORS.danger} />,
          title: 'Share Access Revoked',
          badgeText: 'Revoked',
          badgeColor: COLORS.danger,
          badgeBg: COLORS.dangerMuted,
          nodeColor: COLORS.danger,
        };
      case 'DOCUMENT_UPLOADED':
        return {
          icon: <Feather name="upload" size={14} color={COLORS.primary} />,
          title: 'Document Vaulted',
          badgeText: 'Stored',
          badgeColor: COLORS.primary,
          badgeBg: COLORS.primaryMuted,
          nodeColor: COLORS.primary,
        };
      case 'DOCUMENT_DOWNLOADED':
        return {
          icon: <Feather name="download" size={14} color={COLORS.textSecondary} />,
          title: 'Document Downloaded',
          badgeText: 'Download',
          badgeColor: COLORS.textSecondary,
          badgeBg: 'rgba(148, 163, 184, 0.15)',
          nodeColor: COLORS.textSecondary,
        };
      case 'DOCUMENT_DELETED':
        return {
          icon: <Feather name="trash-2" size={14} color={COLORS.danger} />,
          title: 'Document Deleted',
          badgeText: 'Deleted',
          badgeColor: COLORS.danger,
          badgeBg: COLORS.dangerMuted,
          nodeColor: COLORS.danger,
        };
      case 'USER_LOGIN':
        return {
          icon: <Feather name="log-in" size={14} color={COLORS.primary} />,
          title: 'User Signed In',
          badgeText: 'Auth',
          badgeColor: COLORS.primary,
          badgeBg: COLORS.primaryMuted,
          nodeColor: COLORS.primary,
        };
      case 'USER_LOGOUT':
        return {
          icon: <Feather name="log-out" size={14} color={COLORS.textMuted} />,
          title: 'User Signed Out',
          badgeText: 'Auth',
          badgeColor: COLORS.textMuted,
          badgeBg: COLORS.surfaceElevated,
          nodeColor: COLORS.textMuted,
        };
      case 'USER_REGISTERED':
        return {
          icon: <Feather name="user-check" size={14} color={COLORS.success} />,
          title: 'Account Created',
          badgeText: 'New User',
          badgeColor: COLORS.success,
          badgeBg: COLORS.successMuted,
          nodeColor: COLORS.success,
        };
      case 'FOLDER_CREATED':
        return {
          icon: <Feather name="folder-plus" size={14} color={COLORS.warning} />,
          title: 'Folder Created',
          badgeText: 'Folder',
          badgeColor: COLORS.warning,
          badgeBg: COLORS.warningMuted,
          nodeColor: COLORS.warning,
        };
      case 'FOLDER_RENAMED':
        return {
          icon: <Feather name="edit-2" size={14} color={COLORS.warning} />,
          title: 'Folder Renamed',
          badgeText: 'Folder',
          badgeColor: COLORS.warning,
          badgeBg: COLORS.warningMuted,
          nodeColor: COLORS.warning,
        };
      case 'FOLDER_DELETED':
        return {
          icon: <Feather name="folder-minus" size={14} color={COLORS.danger} />,
          title: 'Folder Deleted',
          badgeText: 'Deleted',
          badgeColor: COLORS.danger,
          badgeBg: COLORS.dangerMuted,
          nodeColor: COLORS.danger,
        };
      default:
        return {
          icon: <Feather name="activity" size={14} color={COLORS.textSecondary} />,
          title: action.replace(/_/g, ' '),
          badgeText: 'Event',
          badgeColor: COLORS.textSecondary,
          badgeBg: COLORS.surfaceElevated,
          nodeColor: COLORS.textSecondary,
        };
    }
  };

  // Group events by human-friendly date sections
  const groupedSections: DateSection[] = useMemo(() => {
    if (!logs.length) return [];

    const map = new Map<string, ExtendedAuditLog[]>();
    const today = new Date().toDateString();
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    logs.forEach((log) => {
      const d = new Date(log.created_at);
      const dateStr = d.toDateString();

      let header = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (dateStr === today) {
        header = 'Today';
      } else if (dateStr === yesterday) {
        header = 'Yesterday';
      }

      if (!map.has(header)) {
        map.set(header, []);
      }
      map.get(header)!.push(log);
    });

    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [logs]);

  const renderTimelineItem = ({ item, index, section }: { item: ExtendedAuditLog; index: number; section: DateSection }) => {
    const config = getActionConfig(item.action);
    const meta = (item.metadata || {}) as Record<string, any>;
    const targetName = item.document?.name || meta.name || meta.folder_name || meta.email || null;
    const isLastInSection = index === section.data.length - 1;

    const timeString = new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.timelineRow}
        onPress={() => setSelectedEvent(item)}
        activeOpacity={0.7}
      >
        {/* Left Column: Vertical Timeline Connector & Icon Node */}
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineNode, { borderColor: config.nodeColor }]}>
            {config.icon}
          </View>
          {!isLastInSection && <View style={styles.timelineLine} />}
        </View>

        {/* Right Column: Clean Event Card */}
        <View style={styles.eventCard}>
          <View style={styles.eventCardHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {config.title}
            </Text>
            <View style={[styles.eventBadge, { backgroundColor: config.badgeBg }]}>
              <Text style={[styles.eventBadgeText, { color: config.badgeColor }]}>
                {config.badgeText}
              </Text>
            </View>
          </View>

          {targetName && (
            <View style={styles.targetContainer}>
              <Feather name="file-text" size={11} color={COLORS.textMuted} />
              <Text style={styles.targetName} numberOfLines={1}>
                {targetName}
              </Text>
            </View>
          )}

          <Text style={styles.eventTime}>{timeString}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const categories: { key: AuditCategory; label: string; icon: any }[] = [
    { key: 'FILES', label: 'Vault Files', icon: 'file' },
    { key: 'INTEGRITY', label: 'Signatures', icon: 'shield' },
    { key: 'BLOCKCHAIN', label: 'Blockchain', icon: 'link' },
    { key: 'SHARING', label: 'Sharing', icon: 'share-2' },
  ];

  const selectedMeta = selectedEvent?.metadata as Record<string, any> | null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>ENTERPRISE AUDIT TRAIL</Text>
          <Text style={styles.headerTitle}>Activity Timeline</Text>
        </View>
        <View style={styles.appendOnlyBadge}>
          <Feather name="check-circle" size={12} color={COLORS.success} />
          <Text style={styles.appendOnlyText}>Cryptographically Logged</Text>
        </View>
      </View>

      {/* Category Pills Bar */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterPill, activeCategory === cat.key && styles.filterPillActive]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Feather
                name={cat.icon}
                size={12}
                color={activeCategory === cat.key ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.filterPillText, activeCategory === cat.key && styles.filterPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Sectioned Timeline */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          renderItem={renderTimelineItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeaderContainer}>
              <View style={styles.sectionHeaderBadge}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="timeline-clock-outline" size={48} color={COLORS.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No Activity Recorded</Text>
              <Text style={styles.emptySubtitle}>
                Every file upload, cryptographic signature, blockchain anchoring event, and permission grant is automatically recorded here.
              </Text>
            </View>
          }
        />
      )}

      {/* Interactive Audit Certificate Modal */}
      <Modal
        visible={Boolean(selectedEvent)}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Feather name="shield" size={18} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Audit Event Certificate</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <ScrollView style={styles.modalBody}>
                {/* Event Summary Banner */}
                <View style={styles.modalBanner}>
                  <Text style={styles.modalBannerAction}>
                    {getActionConfig(selectedEvent.action).title}
                  </Text>
                  <Text style={styles.modalBannerDate}>
                    {new Date(selectedEvent.created_at).toLocaleString()}
                  </Text>
                </View>

                {/* Details Table */}
                <View style={styles.metaTable}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaKey}>Event ID</Text>
                    <TouchableOpacity
                      style={styles.copyableRow}
                      onPress={() => copyToClipboard(selectedEvent.id, 'id')}
                    >
                      <Text style={styles.metaMonoSmall}>{truncateHash(selectedEvent.id)}</Text>
                      <Feather name={copiedField === 'id' ? "check" : "copy"} size={12} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>

                  {selectedEvent.document && (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Target Document</Text>
                      <Text style={styles.metaValue}>{selectedEvent.document.name}</Text>
                    </View>
                  )}

                  {selectedMeta?.folder_name && (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Target Folder</Text>
                      <Text style={styles.metaValue}>{selectedMeta.folder_name}</Text>
                    </View>
                  )}

                  {selectedMeta?.email && (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Account Email</Text>
                      <Text style={styles.metaValue}>{selectedMeta.email}</Text>
                    </View>
                  )}

                  {selectedMeta?.size && (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>File Size</Text>
                      <Text style={styles.metaValue}>
                        {(selectedMeta.size / 1024).toFixed(1)} KB
                      </Text>
                    </View>
                  )}

                  {selectedMeta?.network && (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Blockchain</Text>
                      <Text style={[styles.metaValue, { color: COLORS.blockchain }]}>
                        {selectedMeta.network}
                      </Text>
                    </View>
                  )}
                </View>

                {/* SHA-256 Hash Card */}
                {selectedMeta?.hash && (
                  <View style={styles.hashCard}>
                    <View style={styles.hashCardHeader}>
                      <Text style={styles.hashCardTitle}>SHA-256 Digital Fingerprint</Text>
                      <TouchableOpacity
                        style={styles.copyBadge}
                        onPress={() => copyToClipboard(selectedMeta.hash, 'hash')}
                      >
                        <Feather name={copiedField === 'hash' ? "check" : "copy"} size={11} color={COLORS.primary} />
                        <Text style={styles.copyBadgeText}>
                          {copiedField === 'hash' ? 'Copied' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.hashText} selectable={true}>
                      {selectedMeta.hash}
                    </Text>
                  </View>
                )}

                {/* Ethereum Transaction Card */}
                {selectedMeta?.transaction_hash && (
                  <View style={[styles.hashCard, styles.blockchainProofCard]}>
                    <View style={styles.hashCardHeader}>
                      <Text style={styles.hashCardTitle}>Sepolia Transaction Hash</Text>
                      <TouchableOpacity
                        style={styles.copyBadge}
                        onPress={() => copyToClipboard(selectedMeta.transaction_hash, 'tx')}
                      >
                        <Feather name={copiedField === 'tx' ? "check" : "copy"} size={11} color={COLORS.blockchain} />
                        <Text style={[styles.copyBadgeText, { color: COLORS.blockchain }]}>
                          {copiedField === 'tx' ? 'Copied' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.hashText, { color: COLORS.blockchain }]} selectable={true}>
                      {selectedMeta.transaction_hash}
                    </Text>
                    <TouchableOpacity
                      style={styles.etherscanBtn}
                      onPress={() => Linking.openURL(`${BLOCKCHAIN_EXPLORER_BASE}${selectedMeta.transaction_hash}`)}
                    >
                      <Text style={styles.etherscanBtnText}>Verify on Sepolia Etherscan</Text>
                      <Feather name="external-link" size={13} color={COLORS.blockchain} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: SPACING.md }} />
                <Button
                  label="Done"
                  onPress={() => setSelectedEvent(null)}
                  variant="primary"
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
    fontWeight: TYPOGRAPHY.bold,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontWeight: TYPOGRAPHY.bold,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderContainer: {
    paddingVertical: SPACING.sm,
    marginBottom: 4,
  },
  sectionHeaderBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginTop: -2,
    marginBottom: -2,
  },
  eventCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    shadowColor: 'rgba(15, 23, 42, 0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.xs,
  },
  eventBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.4,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  targetName: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
    flexShrink: 1,
  },
  eventTime: {
    fontSize: 10,
    color: COLORS.textMuted,
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
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
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
  },
  modalBody: {
    paddingTop: SPACING.xs,
  },
  modalBanner: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalBannerAction: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  modalBannerDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  metaTable: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceElevated,
  },
  metaKey: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  metaValue: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'right',
  },
  copyableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaMonoSmall: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: COLORS.primary,
  },
  hashCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  blockchainProofCard: {
    borderColor: COLORS.blockchainMuted,
  },
  hashCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hashCardTitle: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textSecondary,
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
  },
  hashText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: COLORS.primary,
    lineHeight: 16,
  },
  etherscanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.blockchainMuted,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    marginTop: SPACING.sm,
  },
  etherscanBtnText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.blockchain,
  },
});
