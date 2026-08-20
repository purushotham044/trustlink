// ============================================================
// TrustLink — Professional Production Dashboard Screen (Responsive)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { documentService } from '@/services/documentService';
import { Document as VaultDocument } from '@/types';
import { DocumentCard } from '@/components/vault/DocumentCard';
import { HowItWorksModal } from '@/components/common/HowItWorksModal';

interface DashboardStats {
  totalDocs: number;
  verifiedDocs: number;
  anchoredDocs: number;
  sharedDocs: number;
}

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const navigation = useNavigation<any>();

  const [stats, setStats] = useState<DashboardStats>({
    totalDocs: 0,
    verifiedDocs: 0,
    anchoredDocs: 0,
    sharedDocs: 0,
  });
  const [recentDocs, setRecentDocs] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [explainerVisible, setExplainerVisible] = useState(false);

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch authoritative counts from Supabase
      const [
        { count: totalCount },
        { count: verifiedCount },
        { count: anchoredCount },
        { count: sharedCount },
        { data: recents },
      ] = await Promise.all([
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id),
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('integrity_status', 'VERIFIED'),
        supabase
          .from('blockchain_proofs')
          .select('*, documents!inner(owner_id)', { count: 'exact', head: true })
          .eq('documents.owner_id', user.id)
          .eq('status', 'CONFIRMED'),
        supabase
          .from('document_shares')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .is('revoked_at', null),
        supabase
          .from('documents')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4),
      ]);

      setStats({
        totalDocs: totalCount || 0,
        verifiedDocs: verifiedCount || 0,
        anchoredDocs: anchoredCount || 0,
        sharedDocs: sharedCount || 0,
      });

      setRecentDocs((recents as VaultDocument[]) || []);
    } catch (err) {
      console.warn('Error loading dashboard statistics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleQuickUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      const uploaded = await documentService.uploadDocument(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream',
        null
      );

      Alert.alert(
        'Upload Successful',
        `"${file.name}" has been stored securely and its unique SHA-256 digital fingerprint recorded.`,
        [
          { text: 'OK' },
          {
            text: 'View Document',
            onPress: () => navigation.navigate('Vault', {
              screen: 'DocumentDetail',
              params: { document: uploaded },
            }),
          },
        ]
      );
      loadDashboardData();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + 32 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>DOCUMENT VAULT</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarPlaceholder}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <Feather name="shield" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* TrustLink Security Pipeline Card */}
      <TouchableOpacity
        style={styles.pipelineCard}
        onPress={() => setExplainerVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.pipelineHeader}>
          <View style={styles.pipelineTag}>
            <Feather name="lock" size={12} color={COLORS.primary} />
            <Text style={styles.pipelineTagText}>HOW TRUSTLINK PROTECTS YOUR FILES</Text>
          </View>
          <Feather name="help-circle" size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.pipelineFlow}>
          Store → Fingerprint → Blockchain Proof → Verify → Share
        </Text>
        <Text style={styles.pipelineSubtitle}>
          Tap to see how cryptographic SHA-256 and Ethereum Sepolia anchoring prove your documents have never been altered.
        </Text>
      </TouchableOpacity>

      {/* Real Real-Time Vault Metrics */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Vault Files</Text>
            <Feather name="folder" size={14} color={COLORS.textMuted} />
          </View>
          <Text style={styles.statValue}>
            {loading ? '-' : stats.totalDocs}
          </Text>
          <Text style={styles.statFootnote}>Stored in Vault</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Verified</Text>
            <Feather name="check-circle" size={14} color={COLORS.success} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {loading ? '-' : stats.verifiedDocs}
          </Text>
          <Text style={styles.statFootnote}>Integrity Confirmed</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Blockchain</Text>
            <Feather name="link" size={14} color={COLORS.blockchain} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.blockchain }]}>
            {loading ? '-' : stats.anchoredDocs}
          </Text>
          <Text style={styles.statFootnote}>Sepolia Proofs</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Active Shares</Text>
            <Feather name="share-2" size={14} color={COLORS.warning} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>
            {loading ? '-' : stats.sharedDocs}
          </Text>
          <Text style={styles.statFootnote}>Time-Bound Access</Text>
        </View>
      </View>

      {/* Quick Action Bar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleQuickUpload}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.textInverse} />
            ) : (
              <Feather name="upload" size={16} color={COLORS.textInverse} />
            )}
            <Text style={[styles.actionButtonText, { color: COLORS.textInverse }]}>Upload File</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Vault')}
            activeOpacity={0.7}
          >
            <Feather name="folder" size={16} color={COLORS.textPrimary} />
            <Text style={styles.actionButtonText}>Open Vault</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Activity')}
            activeOpacity={0.7}
          >
            <Feather name="activity" size={16} color={COLORS.textPrimary} />
            <Text style={styles.actionButtonText}>Audit Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Documents */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          {recentDocs.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Vault')}>
              <Text style={styles.seeAllText}>Browse Vault ›</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
        ) : recentDocs.length > 0 ? (
          recentDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPress={() => navigation.navigate('Vault', {
                screen: 'DocumentDetail',
                params: { document: doc },
              })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={32} color={COLORS.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No documents in vault yet</Text>
            <Text style={styles.emptySubtext}>
              Upload a document to generate its digital fingerprint and create an immutable blockchain proof.
            </Text>
          </View>
        )}
      </View>

      {/* How It Works Explainer Modal */}
      <HowItWorksModal
        visible={explainerVisible}
        onClose={() => setExplainerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md + 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    letterSpacing: 1.2,
  },
  name: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(15, 23, 42, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  pipelineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: 'rgba(15, 23, 42, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pipelineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pipelineTagText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  pipelineFlow: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  pipelineSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    shadowColor: 'rgba(15, 23, 42, 0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.medium,
  },
  statValue: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statFootnote: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    shadowColor: 'rgba(15, 23, 42, 0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: {
    marginBottom: SPACING.sm,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
