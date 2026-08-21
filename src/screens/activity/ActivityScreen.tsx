// ============================================================
// TrustLink — Executive Security Audit Trail & Activity Timeline
// High-Precision Timestamps & Streamlined Clean Design
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
          icon: <Feather name="upload-cloud" size={15} color={colors.primary} />,
          title: 'Document Vaulted',
          badgeText: 'Vaulted',
          badgeColor: colors.primary,
          badgeBg: colors.primaryMuted,
          nodeColor: colors.primary,
        };
      case 'HASH_CREATED':
        return {
          icon: <Feather name="shield" size={15} color={colors.primary} />,
          title: 'SHA-256 Fingerprinted',
          badgeText: 'Hash Created',
          badgeColor: colors.primary,
          badgeBg: colors.primaryMuted,
          nodeColor: colors.primary,
        };
      case 'DOCUMENT_VERIFIED':
        return {
          icon: <Feather name="check-circle" size={15} color={colors.success} />,
          title: 'Cryptographic Integrity Verified',
          badgeText: 'Verified',
          badgeColor: colors.success,
          badgeBg: colors.successMuted,
          nodeColor: colors.success,
        };
      case 'BLOCKCHAIN_ANCHORED':
        return {
          icon: <MaterialCommunityIcons name="ethereum" size={16} color={colors.blockchain} />,
          title: 'Sepolia Proof Confirmed',
          badgeText: 'On-Chain',
          badgeColor: colors.blockchain,
          badgeBg: colors.blockchainMuted,
          nodeColor: colors.blockchain,
        };
      case 'BLOCKCHAIN_ANCHOR_FAILED':
        return {
          icon: <Feather name="alert-triangle" size={15} color={colors.danger} />,
          title: 'Anchoring Failed',
          badgeText: 'Failed',
          badgeColor: colors.danger,
          badgeBg: colors.dangerMuted,
          nodeColor: colors.danger,
        };
      case 'DOCUMENT_DOWNLOADED':
        return {
          icon: <Feather name="download" size={15} color={colors.textSecondary} />,
          title: 'Document Downloaded',
          badgeText: 'Downloaded',
          badgeColor: colors.textSecondary,
          badgeBg: colors.surfaceHighlight,
          nodeColor: colors.textSecondary,
        };
      case 'DOCUMENT_DELETED':
        return {
          icon: <Feather name="trash-2" size={15} color={colors.danger} />,
          title: 'Document Deleted',
          badgeText: 'Deleted',
          badgeColor: colors.danger,
          badgeBg: colors.dangerMuted,
          nodeColor: colors.danger,
        };
      case 'FOLDER_CREATED':
        return {
          icon: <Feather name="folder-plus" size={15} color={colors.warning} />,
          title: 'Folder Created',
          badgeText: 'Folder',
          badgeColor: colors.warning,
          badgeBg: colors.warningMuted,
          nodeColor: colors.warning,
        };
      case 'FOLDER_RENAMED':
        return {
          icon: <Feather name="edit-2" size={15} color={colors.warning} />,
          title: 'Folder Renamed',
          badgeText: 'Folder',
          badgeColor: colors.warning,
          badgeBg: colors.warningMuted,
          nodeColor: colors.warning,
        };
      case 'FOLDER_DELETED':
        return {
          icon: <Feather name="folder-minus" size={15} color={colors.danger} />,
          title: 'Folder Deleted',
          badgeText: 'Deleted',
          badgeColor: colors.danger,
          badgeBg: colors.dangerMuted,
          nodeColor: colors.danger,
        };
      case 'USER_LOGIN':
        return {
          icon: <Feather name="log-in" size={15} color={colors.primary} />,
          title: 'Security Authentication',
          badgeText: 'Session',
          badgeColor: colors.primary,
          badgeBg: colors.primaryMuted,
          nodeColor: colors.primary,
        };
      default:
        return {
          icon: <Feather name="activity" size={15} color={colors.textSecondary} />,
          title: action.replace(/_/g, ' '),
          badgeText: 'Audit Event',
          badgeColor: colors.textSecondary,
          badgeBg: colors.surfaceHighlight,
          nodeColor: colors.textSecondary,
        };
    }
  };

  // Group events chronologically
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
        weekday: 'short',
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

  // Precise time format (Hours, Minutes, Seconds)
  const formatPreciseTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatFullDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;
  };

  const renderTimelineItem = ({ item, index, section }: { item: ExtendedAuditLog; index: number; section: DateSection }) => {
    const config = getActionConfig(item.action);
    const meta = (item.metadata || {}) as Record<string, any>;
    const targetName = item.document?.name || meta.name || meta.folder_name || meta.email || null;
    const isLastInSection = index === section.data.length - 1;
    const preciseTime = formatPreciseTime(item.created_at);

    return (
      <TouchableOpacity
        style={styles.timelineRow}
        onPress={() => setSelectedEvent(item)}
        activeOpacity={0.75}
      >
        {/* Left Column: Vertical Connector & Icon Node */}
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineNode, { borderColor: config.nodeColor, backgroundColor: colors.surface }]}>
            {config.icon}
          </View>
          {!isLastInSection && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
        </View>

        {/* Right Column: Sleek Card */}
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
              <Feather name="file-text" size={12} color={colors.primary} />
              <Text style={[styles.targetName, { color: colors.textPrimary }]} numberOfLines={1}>
                {targetName}
              </Text>
            </View>
          )}

          <View style={styles.eventCardFooter}>
            <View style={styles.timeTag}>
              <Feather name="clock" size={11} color={colors.textMuted} />
              <Text style={[styles.timeText, { color: colors.textMuted }]}>{preciseTime}</Text>
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

  // Clean 4 categories (All, Blockchain, Verifications, Files)
  const categories: { key: AuditCategory; label: string; icon: any }[] = [
    { key: 'ALL', label: 'All Activity', icon: 'list' },
    { key: 'BLOCKCHAIN', label: 'Sepolia Proofs', icon: 'link' },
    { key: 'INTEGRITY', label: 'Verifications', icon: 'shield-check' },
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
          <Feather name="shield" size={44} color={colors.textMuted} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No security events recorded</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {activeCategory === 'ALL'
              ? 'Every cryptographic hash, verification check, file upload, and on-chain blockchain proof will appear here with second-precision timestamps.'
              : `No activity logged in the ${activeCategory.toLowerCase()} filter yet.`}
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

      {/* Forensic Audit Details Modal */}
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
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Audit Certificate</Text>
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
                    {formatFullDate(selectedEvent.created_at)}
                  </Text>
                </View>

                {/* Event Key-Value Details */}
                <View style={[styles.modalSection, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                  <View style={[styles.modalDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.modalDetailLabel, { color: colors.textMuted }]}>Event Action</Text>
                    <Text style={[styles.modalDetailValue, { color: colors.textPrimary }]}>{selectedEvent.action}</Text>
                  </View>

                  {selectedEvent.document?.name && (
                    <View style={[styles.modalDetailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.modalDetailLabel, { color: colors.textMuted }]}>Document</Text>
                      <Text style={[styles.modalDetailValue, { color: colors.primary }]}>{selectedEvent.document.name}</Text>
                    </View>
                  )}

                  <View style={[styles.modalDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.modalDetailLabel, { color: colors.textMuted }]}>Precise Time</Text>
                    <Text style={[styles.modalDetailValue, { color: colors.textPrimary }]}>
                      {formatPreciseTime(selectedEvent.created_at)}
                    </Text>
                  </View>

                  <View style={[styles.modalDetailRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.modalDetailLabel, { color: colors.textMuted }]}>Ledger Status</Text>
                    <View style={styles.statusRow}>
                      <Feather name="lock" size={12} color={colors.success} />
                      <Text style={[styles.modalDetailValue, { color: colors.success }]}>Immutable Record</Text>
                    </View>
                  </View>
                </View>

                {/* Metadata Details (Clean & Filtered) */}
                {selectedEvent.metadata && (
                  <View style={[styles.modalSection, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                    <Text style={[styles.metadataTitle, { color: colors.textMuted }]}>Cryptographic Fingerprint & Details</Text>
                    
                    {/* Hash Display */}
                    {(selectedEvent.metadata as any).hash && (
                      <View style={styles.hashBox}>
                        <Text style={[styles.hashLabel, { color: colors.textMuted }]}>SHA-256 Digest:</Text>
                        <Text style={[styles.hashText, { color: colors.primary, backgroundColor: colors.surface }]} selectable={true}>
                          {(selectedEvent.metadata as any).hash}
                        </Text>
                        <TouchableOpacity
                          style={[styles.copyButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                          onPress={() => copyToClipboard((selectedEvent.metadata as any).hash, 'hash')}
                        >
                          <Feather name={copiedField === 'hash' ? 'check' : 'copy'} size={12} color={colors.primary} />
                          <Text style={[styles.copyButtonText, { color: colors.primary }]}>
                            {copiedField === 'hash' ? 'Copied' : 'Copy Hash'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Transaction Hash */}
                    {(selectedEvent.metadata as any).transaction_hash && (
                      <View style={styles.hashBox}>
                        <Text style={[styles.hashLabel, { color: colors.textMuted }]}>Ethereum Sepolia Tx:</Text>
                        <Text style={[styles.hashText, { color: colors.blockchain, backgroundColor: colors.surface }]} selectable={true}>
                          {(selectedEvent.metadata as any).transaction_hash}
                        </Text>
                        <TouchableOpacity
                          style={[styles.copyButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                          onPress={() => openEtherscan((selectedEvent.metadata as any).transaction_hash)}
                        >
                          <Feather name="external-link" size={12} color={colors.blockchain} />
                          <Text style={[styles.copyButtonText, { color: colors.blockchain }]}>View on Etherscan</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                <View style={{ height: SPACING.md }} />
                <Button label="Close Certificate" onPress={() => setSelectedEvent(null)} variant="secondary" />
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
  categoryButtonActive: {},
  categoryText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semibold,
  },
  categoryTextActive: {},
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  timelineList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  sectionHeaderWrap: {
    paddingVertical: SPACING.sm,
    alignItems: 'flex-start',
  },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.5,
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    marginTop: 2,
  },
  eventCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  eventTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    flex: 1,
    marginRight: SPACING.xs,
  },
  eventBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.5,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  targetName: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    flex: 1,
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderWidth: 1,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
  },
  modalBody: {
    flexGrow: 0,
  },
  modalBanner: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalBannerAction: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 2,
  },
  modalBannerDate: {
    fontSize: 11,
  },
  modalSection: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
  },
  modalDetailLabel: {
    fontSize: TYPOGRAPHY.xs,
  },
  modalDetailValue: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataTitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  hashBox: {
    marginBottom: SPACING.sm,
  },
  hashLabel: {
    fontSize: 10,
    marginBottom: 3,
  },
  hashText: {
    fontSize: 10,
    fontFamily: 'monospace',
    padding: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: SPACING.xs,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  copyButtonText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semibold,
  },
});
