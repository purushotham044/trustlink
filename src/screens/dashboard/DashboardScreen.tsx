// ============================================================
// TrustLink — Professional Production Dashboard Screen (Responsive)
// ============================================================

import React, { useState, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { documentService } from '@/services/documentService';
import { Document as VaultDocument } from '@/types';
import { DocumentCard } from '@/components/vault/DocumentCard';
import { HowItWorksModal } from '@/components/common/HowItWorksModal';
import { UploadProgressModal, UploadProgressState } from '@/components/common/UploadProgressModal';

interface DashboardStats {
  totalDocs: number;
  verifiedDocs: number;
  anchoredDocs: number;
  sharedDocs: number;
}

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
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
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    visible: false,
    fileName: '',
    step: 1,
    statusText: 'Preparing upload...',
    isComplete: false,
  });

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      // 1. Fetch total user documents
      const { count: total, error: totalErr } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      if (totalErr) throw totalErr;

      // 2. Fetch verified documents count
      const { count: verified, error: verErr } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .eq('integrity_status', 'VERIFIED');

      if (verErr) throw verErr;

      // 3. Fetch anchored documents count
      const { count: anchored, error: ancErr } = await supabase
        .from('blockchain_proofs')
        .select('*, documents!inner(owner_id)', { count: 'exact', head: true })
        .eq('documents.owner_id', user.id);

      if (ancErr) throw ancErr;

      // 4. Fetch active shares count
      const { count: shared, error: shareErr } = await supabase
        .from('document_shares')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .is('revoked_at', null);

      if (shareErr) throw shareErr;

      // 5. Fetch 3 most recent documents
      const { data: recent, error: recentErr } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentErr) throw recentErr;

      setStats({
        totalDocs: total ?? 0,
        verifiedDocs: verified ?? 0,
        anchoredDocs: anchored ?? 0,
        sharedDocs: shared ?? 0,
      });

      setRecentDocs((recent as VaultDocument[]) ?? []);
    } catch (error) {
      console.error('[Dashboard] Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleQuickUpload = async () => {
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
        statusText: 'Reading file bytes & computing SHA-256 fingerprint...',
        isComplete: false,
      });

      await documentService.uploadDocument(
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size ?? 0,
        },
        null,
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

      loadDashboardData();
    } catch (err: any) {
      setUploadProgress(prev => ({ ...prev, visible: false }));
      Alert.alert('Upload Failed', err.message || 'Could not upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + 32 }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with compact theme toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>WELCOME BACK</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Simple compact sun/moon theme switch */}
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={toggleTheme}
            activeOpacity={0.75}
          >
            <Feather name={isDark ? 'sun' : 'moon'} size={18} color={isDark ? '#F59E0B' : colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Feather name="shield" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* TrustLink Security Pipeline Card */}
      <TouchableOpacity
        style={[styles.pipelineCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.primary }]}
        onPress={() => setExplainerVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.pipelineHeader}>
          <View style={[styles.pipelineTag, { backgroundColor: colors.primaryMuted }]}>
            <Feather name="lock" size={12} color={colors.primary} />
            <Text style={[styles.pipelineTagText, { color: colors.primary }]}>HOW TRUSTLINK PROTECTS YOUR FILES</Text>
          </View>
          <Feather name="help-circle" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.pipelineFlow, { color: colors.textPrimary }]}>
          Store → Fingerprint → Blockchain Proof → Verify → Share
        </Text>
        <Text style={[styles.pipelineSubtitle, { color: colors.textMuted }]}>
          Tap to see how cryptographic SHA-256 and Ethereum Sepolia anchoring prove your documents have never been altered.
        </Text>
      </TouchableOpacity>

      {/* Real Real-Time Vault Metrics */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Vault Files</Text>
            <Feather name="folder" size={14} color={colors.textMuted} />
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {loading ? '-' : stats.totalDocs}
          </Text>
          <Text style={[styles.statFootnote, { color: colors.textMuted }]}>Stored in Vault</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Verified</Text>
            <Feather name="check-circle" size={14} color={colors.success} />
          </View>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {loading ? '-' : stats.verifiedDocs}
          </Text>
          <Text style={[styles.statFootnote, { color: colors.textMuted }]}>100% Intact</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Sepolia</Text>
            <MaterialCommunityIcons name="ethereum" size={14} color={colors.blockchain} />
          </View>
          <Text style={[styles.statValue, { color: colors.blockchain }]}>
            {loading ? '-' : stats.anchoredDocs}
          </Text>
          <Text style={[styles.statFootnote, { color: colors.textMuted }]}>Smart Contract</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Shares</Text>
            <Feather name="share-2" size={14} color={colors.warning} />
          </View>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {loading ? '-' : stats.sharedDocs}
          </Text>
          <Text style={[styles.statFootnote, { color: colors.textMuted }]}>Active Permissions</Text>
        </View>
      </View>

      {/* Quick Action Upload Hero Banner */}
      <TouchableOpacity
        style={[styles.uploadHero, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleQuickUpload}
        disabled={uploading}
        activeOpacity={0.85}
      >
        <View style={[styles.uploadIconWrap, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
          <Feather name="upload-cloud" size={24} color={colors.primary} />
        </View>
        <View style={styles.uploadTextWrap}>
          <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>Quick Vault Upload</Text>
          <Text style={[styles.uploadSubtitle, { color: colors.textMuted }]}>
            Auto-generate SHA-256 fingerprint & secure in cloud
          </Text>
        </View>
        <Feather name="plus" size={18} color={colors.primary} />
      </TouchableOpacity>

      {/* Recent Vault Documents Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>RECENT DOCUMENTS</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Vault')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View All →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: SPACING.lg }} />
      ) : recentDocs.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="file-text" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No documents vaulted yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Upload your first file to generate an unforgeable cryptographic proof.
          </Text>
        </View>
      ) : (
        recentDocs.map(doc => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onPress={() =>
              navigation.navigate('Vault', {
                screen: 'DocumentDetail',
                params: { document: doc },
              })
            }
          />
        ))
      )}

      {/* How It Works Explainer Modal */}
      <HowItWorksModal
        visible={explainerVisible}
        onClose={() => setExplainerVisible(false)}
      />

      {/* Executive Upload Progress Animation Modal */}
      <UploadProgressModal
        state={uploadProgress}
        onClose={() => setUploadProgress(prev => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md + 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: SPACING.xs,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  name: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  pipelineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  pipelineTagText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.8,
  },
  pipelineFlow: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 4,
  },
  pipelineSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.medium,
  },
  statValue: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 2,
  },
  statFootnote: {
    fontSize: 10,
  },
  uploadHero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  uploadIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  uploadTextWrap: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 2,
  },
  uploadSubtitle: {
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 1,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.bold,
  },
  emptyCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    marginTop: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
});
