// ============================================================
// TrustLink — Professional Dashboard Screen
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
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { documentService } from '@/services/documentService';
import { Document as VaultDocument } from '@/types';
import { DocumentCard } from '@/components/vault/DocumentCard';

interface DashboardStats {
  totalDocs: number;
  verifiedDocs: number;
  anchoredDocs: number;
  sharedDocs: number;
}

export function DashboardScreen() {
  const { profile, user, signOut } = useAuth();
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

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // 1. Fetch real counts in parallel
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
          .limit(3),
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

      await documentService.uploadDocument(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream',
        null
      );

      Alert.alert('Success', `"${file.name}" uploaded and hashed successfully!`);
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
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>SECURE VAULT</Text>
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

      {/* Real Real-Time Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Total Files</Text>
            <Feather name="folder" size={14} color={COLORS.textMuted} />
          </View>
          <Text style={styles.statValue}>
            {loading ? '-' : stats.totalDocs}
          </Text>
          <Text style={styles.statFootnote}>Stored in Vault</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Cryptographic</Text>
            <Feather name="check-circle" size={14} color={COLORS.success} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {loading ? '-' : stats.verifiedDocs}
          </Text>
          <Text style={styles.statFootnote}>Integrity Verified</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Blockchain</Text>
            <Feather name="link" size={14} color={COLORS.blockchain} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.blockchain }]}>
            {loading ? '-' : stats.anchoredDocs}
          </Text>
          <Text style={styles.statFootnote}>Sepolia Anchored</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Sharing</Text>
            <Feather name="share-2" size={14} color={COLORS.warning} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>
            {loading ? '-' : stats.sharedDocs}
          </Text>
          <Text style={styles.statFootnote}>Active Shares</Text>
        </View>
      </View>

      {/* Quick Action Bar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleQuickUpload}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Feather name="upload" size={18} color={COLORS.primary} />
            )}
            <Text style={styles.actionButtonText}>Upload File</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Vault')}
            activeOpacity={0.7}
          >
            <Feather name="folder" size={18} color={COLORS.textPrimary} />
            <Text style={styles.actionButtonText}>Browse Vault</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Activity')}
            activeOpacity={0.7}
          >
            <Feather name="activity" size={18} color={COLORS.textPrimary} />
            <Text style={styles.actionButtonText}>Audit Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Architecture Card */}
      <View style={styles.securityBanner}>
        <View style={styles.securityBannerHeader}>
          <Feather name="lock" size={16} color={COLORS.primary} />
          <Text style={styles.securityBannerTitle}>Dual-Layer Verification</Text>
        </View>
        <Text style={styles.securityBannerText}>
          Every document is locally hashed using SHA-256 and verified against an immutable cryptographic anchor on the Ethereum Sepolia blockchain.
        </Text>
      </View>

      {/* Recent Documents */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          {recentDocs.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Vault')}>
              <Text style={styles.seeAllText}>View All ›</Text>
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
            <Text style={styles.emptyText}>No documents uploaded yet</Text>
            <Text style={styles.emptySubtext}>Tap "Upload File" above to secure your first document</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.base,
  },
  greeting: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semibold,
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
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
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
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sm,
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
    marginTop: SPACING.sm,
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
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
  },
  securityBanner: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  securityBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  securityBannerTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  securityBannerText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: {
    marginBottom: SPACING.sm,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
});
