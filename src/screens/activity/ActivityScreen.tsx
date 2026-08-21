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
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState<AuditCategory>('ALL');
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

  const handleCategoryChange = (category: AuditCategory) => {
    setActiveCategory(category);
    setLoading(true);
    loadLogs(category);
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    Clipboard.setString(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openEtherscan = (txHash: string) => {
    const url = `${BLOCKCHAIN_EXPLORER_BASE}${txHash}`;
    Linking.openURL(url);
  };

  // Helper for timeline action styling & icon configuration
  const getActionConfig = (action: string) => {
    switch (action) {
      case 'DOCUMENT_UPLOADED':
        return {
          icon: <Feather name="upload-cloud" size={14} color={colors.primary} />,
          title: 'Document Vaulted',
          badgeText: 'Vaulted',
          badgeColor: colors.primary,
          badgeBg: colors.primaryMuted,
          nodeColor: colors.primary,
        };
      case 'HASH_CREATED':
        return {
          icon: <Feather name="shield" size={14} color={colors.primary} />,
          title: 'SHA-256 Generated',
          badgeText: 'Fingerprinted',
          badgeColor: colors.primary,
          badgeBg: colors.primaryMuted,
          nodeColor: colors.primary,
        };
      case 'DOCUMENT_VERIFIED':
        return {
          icon: <Feather name="check-circle" size={14} color={colors.success} />,
          title: 'Integrity Verified',
          badgeText: 'Verified',
          badgeColor: colors.success,
          badgeBg: colors.successMuted,
          nodeColor: colors.success,
        };
      case 'BLOCKCHAIN_ANCHORED':
        return {
          icon: <MaterialCommunityIcons name="ethereum" size={14} color={colors.blockchain} />,
          title: 'Sepolia Proof Created',
          badgeText: 'Anchored',
          badgeColor: colors.blockchain,
          badgeBg: colors.blockchainMuted,
          nodeColor: colors.blockchain,
        };
      case 'BLOCKCHAIN_ANCHOR_FAILED':
        return {
          icon: <Feather name="alert-triangle" size={14} color={colors.danger} />,
          title: 'Anchoring Failed',
          badgeText: 'Failed',
          badgeColor: colors.danger,
          badgeBg: colors.dangerMuted,
          nodeColor: colors.danger,
        };
      case 'DOCUMENT_SHARED':
        return {
          icon: <Feather name="share-2" size={14} color={colors.warning} />,
          title: 'Access Granted',
          badgeText: 'Shared',
          badgeColor: colors.warning,
          badgeBg: colors.warningMuted,
          nodeColor: colors.warning,
        };
      case 'SHARE_REVOKED':
        return {
          icon: <Feather name="slash" size={14} color={colors.danger} />,
          title: 'Share Access Revoked',
          badgeText: 'Revoked',
          badgeColor: colors.danger,
          badgeBg: colors.dangerMuted,
          nodeColor: colors.danger,
        };
      case 'DOCUMENT_DOWNLOADED':
        return {
          icon: <Feather name="download" size={14} color={colors.textSecondary} />,
          title: 'Document Downloaded',
          badgeText: 'Downloaded',
          badgeColor: colors.textSecondary,
          badgeBg: colors.surfaceHighlight,
          nodeColor: colors.textSecondary,
        };
      case 'DOCUMENT_DELETED':
        return {
          icon: <Feather name="trash-2" size={14} color={colors.danger} />,
          title: 'Document Deleted',
          badgeText: 'Deleted',
          badgeColor: colors.danger,
          badgeBg: colors.dangerMuted,
          nodeColor: colors.danger,
        };
      case 'USER_LOGIN':
        return {
          icon: <Feather name="log-in" size={14} color={colors.primary} />,
          title: 'User Authenticated',
          badgeText: 'Security',
          badgeColor: colors.primary,
          badgeBg: colors.primaryMuted,
          nodeColor: colors.primary,
        };
      case 'USER_LOGOUT':
        return {
          icon: <Feather name="log-out" size={14} color={colors.textMuted} />,
          title: 'User Signed Out',
          badgeText: 'Security',
          badgeColor: colors.textMuted,
          badgeBg: colors.surfaceHighlight,
          nodeColor: colors.textMuted,
        };
      case 'USER_REGISTERED':
        return {
          icon: <Feather name="user-plus" size={14} color={colors.success} />,
          title: 'Account Created',
          badgeText: 'Security',
          badgeColor: colors.success,
          badgeBg: colors.successMuted,
          nodeColor: colors.success,
        };
      case 'FOLDER_CREATED':
        return {
          icon: <Feather name="folder-plus" size={14} color={colors.warning} />,
          title: 'Folder Created',
          badgeText: 'Folder',
          badgeColor: colors.warning,
          badgeBg: colors.warningMuted,
          nodeColor: colors.warning,
        };
      case 'FOLDER_RENAMED':
        return {
          icon: <Feather name="edit-2" size={14} color={colors.warning} />,
          title: 'Folder Renamed',
          badgeText: 'Folder',
          badgeColor: colors.warning,
          badgeBg: colors.warningMuted,
          nodeColor: colors.warning,
        };
      case 'FOLDER_DELETED':
        return {
          icon: <Feather name="folder-minus" size={14} color={colors.danger} />,
          title: 'Folder Deleted',
          badgeText: 'Deleted',
          badgeColor: colors.danger,
          badgeBg: colors.dangerMuted,
          nodeColor: colors.danger,
        };
      default:
        return {
          icon: <Feather name="activity" size={14} color={colors.textSecondary} />,
          title: action.replace(/_/g, ' '),
          badgeText: 'Event',
          badgeColor: colors.textSecondary,
          badgeBg: colors.surfaceHighlight,
          nodeColor: colors.textSecondary,
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
          <View style={[styles.timelineNode, { borderColor: config.nodeColor, backgroundColor: colors.surface }]}>
            {config.icon}
          </View>
          {!isLastInSection && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
        </View>

        {/* Right Column: Clean Event Card */}
        <View style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.eventCardHeader}>
            <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={1}>
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
              <Feather name="file-text" size={11} color={colors.textMuted} />
              <Text style={[styles.targetName, { color: colors.textSecondary }]} numberOfLines={1}>
                {targetName}
              </Text>
            </View>
          )}

          <View style={styles.eventCardFooter}>
            <View style={styles.timeTag}>
              <Feather name="clock" size={10} color={colors.textMuted} />
              <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeString}</Text>
            </View>
            <Feather name="chevron-right" size={14} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: DateSection }) => (
    <View style={[styles.sectionHeaderWrap, { backgroundColor: colors.background }]}>
      <View style={[styles.sectionPill, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
        <Feather name="calendar" size={11} color={colors.primary} />
        <Text style={[styles.sectionHeaderText, { color: colors.textPrimary }]}>{title}</Text>
      </View>
    </View>
  );

  const categories: { key: AuditCategory; label: string; icon: any }[] = [
    { key: 'ALL', label: 'All Activity', icon: 'list' },
    { key: 'BLOCKCHAIN', label: 'Ethereum Proofs', icon: 'link' },
    { key: 'INTEGRITY', label: 'Verifications', icon: 'shield-check' },
    { key: 'SHARING', label: 'Shares', icon: 'share-2' },
    { key: 'FILES', label: 'Vault Files', icon: 'folder' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Category Pills Header */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                activeCategory === cat.key && [styles.categoryButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
              ]}
              onPress={() => handleCategoryChange(cat.key)}
              activeOpacity={0.75}
            >
              <Feather
                name={cat.icon}
                size={13}
                color={activeCategory === cat.key ? '#FFFFFF' : colors.textMuted}
              />
              <Text
                style={[
                  styles.categoryText,
                  { color: colors.textMuted },
                  activeCategory === cat.key && [styles.categoryTextActive, { color: '#FFFFFF' }],
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Timeline List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="shield" size={48} color={colors.textMuted} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No security events found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {activeCategory === 'ALL'
              ? 'Your security audit trail will log every file upload, SHA-256 fingerprint, verification check, and blockchain proof.'
              : `No events recorded in the ${activeCategory.toLowerCase()} category yet.`}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          renderItem={renderTimelineItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[styles.timelineList, { paddingBottom: insets.bottom + 80 }]}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Forensic Audit Certificate Modal */}
      {selectedEvent && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedEvent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 24) }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.modalHeaderTitleRow}>
                  <Feather name="shield" size={18} color={colors.primary} />
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Forensic Audit Certificate</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedEvent(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Event Summary Banner */}
                <View style={[styles.modalBanner, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                  <Text style={[styles.modalBannerAction, { color: colors.textPrimary }]}>
                    {getActionConfig(selectedEvent.action).title}
                  </Text>
                  <Text style={[styles.modalBannerDate, { color: colors.textMuted }]}>
                    {new Date(selectedEvent.created_at).toLocaleString()}
                  </Text>
                </View>

                {/* Structured Metadata Table */}
                <View style={[styles.metaTable, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.metaKey, { color: colors.textMuted }]}>Event ID</Text>
                    <TouchableOpacity
                      style={styles.copyableRow}
                      onPress={() => copyToClipboard(selectedEvent.id, 'id')}
                    >
                      <Text style={[styles.metaMonoSmall, { color: colors.primary }]}>{truncateHash(selectedEvent.id, 6, 6)}</Text>
                      <Feather
                        name={copiedField === 'id' ? 'check' : 'copy'}
                        size={12}
                        color={copiedField === 'id' ? colors.success : colors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.metaKey, { color: colors.textMuted }]}>Action Category</Text>
                    <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{selectedEvent.action}</Text>
                  </View>

                  <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.metaKey, { color: colors.textMuted }]}>Target File</Text>
                    <Text style={[styles.metaValue, { color: colors.textPrimary }]} numberOfLines={1}>
                      {selectedEvent.document?.name || (selectedEvent.metadata as any)?.name || 'Account/System'}
                    </Text>
                  </View>

                  <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.metaKey, { color: colors.textMuted }]}>Actor User ID</Text>
                    <Text style={[styles.metaMonoSmall, { color: colors.primary }]}>{truncateHash(selectedEvent.user_id, 6, 6)}</Text>
                  </View>
                </View>

                {/* SHA-256 Fingerprint Card (if present) */}
                {Boolean(
                  selectedEvent.document?.current_hash ||
                  (selectedEvent.metadata as any)?.hash ||
                  (selectedEvent.metadata as any)?.sha256
                ) && (
                  <View style={[styles.hashCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                    <View style={styles.hashCardHeader}>
                      <Text style={[styles.hashCardTitle, { color: colors.textSecondary }]}>SHA-256 Digital Fingerprint</Text>
                      <TouchableOpacity
                        style={[styles.copyBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() =>
                          copyToClipboard(
                            selectedEvent.document?.current_hash ||
                            (selectedEvent.metadata as any)?.hash ||
                            (selectedEvent.metadata as any)?.sha256,
                            'hash'
                          )
                        }
                      >
                        <Feather
                          name={copiedField === 'hash' ? 'check' : 'copy'}
                          size={11}
                          color={copiedField === 'hash' ? colors.success : colors.primary}
                        />
                        <Text style={[styles.copyBadgeText, { color: colors.primary }]}>
                          {copiedField === 'hash' ? 'COPIED' : 'COPY'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.hashText, { color: colors.primary }]} selectable={true}>
                      {selectedEvent.document?.current_hash ||
                       (selectedEvent.metadata as any)?.hash ||
                       (selectedEvent.metadata as any)?.sha256}
                    </Text>
                  </View>
                )}

                {/* Blockchain Proof Info (if present) */}
                {Boolean(
                  (selectedEvent.metadata as any)?.transaction_hash ||
                  (selectedEvent.metadata as any)?.tx_hash
                ) && (
                  <View style={[styles.hashCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                    <View style={styles.hashCardHeader}>
                      <Text style={[styles.hashCardTitle, { color: colors.blockchain }]}>Ethereum Sepolia Transaction</Text>
                      <TouchableOpacity
                        style={[styles.copyBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() =>
                          copyToClipboard(
                            (selectedEvent.metadata as any)?.transaction_hash ||
                            (selectedEvent.metadata as any)?.tx_hash,
                            'tx'
                          )
                        }
                      >
                        <Feather
                          name={copiedField === 'tx' ? 'check' : 'copy'}
                          size={11}
                          color={copiedField === 'tx' ? colors.success : colors.blockchain}
                        />
                        <Text style={[styles.copyBadgeText, { color: colors.blockchain }]}>
                          {copiedField === 'tx' ? 'COPIED' : 'COPY'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.hashText, { color: colors.blockchain }]} selectable={true}>
                      {(selectedEvent.metadata as any)?.transaction_hash ||
                       (selectedEvent.metadata as any)?.tx_hash}
                    </Text>
                    <TouchableOpacity
                      style={[styles.etherscanBtn, { backgroundColor: colors.blockchainMuted }]}
                      onPress={() =>
                        openEtherscan(
                          (selectedEvent.metadata as any)?.transaction_hash ||
                          (selectedEvent.metadata as any)?.tx_hash
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Feather name="external-link" size={13} color={colors.blockchain} />
                      <Text style={[styles.etherscanBtnText, { color: colors.blockchain }]}>Verify on Sepolia Etherscan</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: SPACING.md }} />
                <Button
                  label="Close Certificate"
                  onPress={() => setSelectedEvent(null)}
                  variant="secondary"
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  categoriesContainer: {
    paddingVertical: SPACING.sm,
  },
  categoriesScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryButtonActive: {
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.medium,
  },
  categoryTextActive: {
    fontWeight: TYPOGRAPHY.bold,
  },
  timelineList: {
    paddingHorizontal: SPACING.md,
  },
  sectionHeaderWrap: {
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
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
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: -2,
    marginBottom: -6,
  },
  eventCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    flex: 1,
    marginRight: 6,
  },
  eventBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.4,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  targetName: {
    fontSize: 12,
    flex: 1,
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
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
  },
  modalBody: {
    paddingTop: SPACING.xs,
  },
  modalBanner: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  modalBannerAction: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 2,
  },
  modalBannerDate: {
    fontSize: 11,
  },
  metaTable: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
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
  },
  metaKey: {
    fontSize: TYPOGRAPHY.xs,
  },
  metaValue: {
    fontSize: TYPOGRAPHY.xs,
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
  },
  hashCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
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
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  copyBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
  },
  hashText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  etherscanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    marginTop: SPACING.sm,
  },
  etherscanBtnText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
  },
});
