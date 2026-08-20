// ============================================================
// TrustLink — Professional Document Detail Screen
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { VaultStackParamList } from '@/navigation/VaultNavigator';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { documentService } from '@/services/documentService';
import { integrityService } from '@/services/integrityService';
import { blockchainService } from '@/services/blockchainService';
import { shareService } from '@/services/shareService';
import { Button } from '@/components/common/Button';
import { BlockchainProof, SharePermission } from '@/types';
import { truncateTxHash } from '@/lib/crypto';

type Props = StackScreenProps<VaultStackParamList, 'DocumentDetail'>;

type ExpiryOption = '1h' | '24h' | '7d' | 'never';

export function DocumentDetailScreen({ route, navigation }: Props) {
  const { document: initialDocument } = route.params;
  const [document, setDocument] = useState(initialDocument);
  const [proof, setProof] = useState<BlockchainProof | null>(null);
  const [loadingProof, setLoadingProof] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [anchoring, setAnchoring] = useState(false);

  // Sharing Modal State
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareTarget, setShareTarget] = useState('');
  const [permission, setPermission] = useState<SharePermission>('VIEW');
  const [expiry, setExpiry] = useState<ExpiryOption>('24h');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadBlockchainProof();
  }, [document.id]);

  const loadBlockchainProof = async () => {
    try {
      setLoadingProof(true);
      const proofData = await blockchainService.getBlockchainProof(document.id);
      setProof(proofData);
    } catch (err) {
      console.warn('Failed to load blockchain proof:', err);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const uri = await documentService.downloadDocument(document);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: document.mime_type });
      } else {
        Alert.alert('Downloaded', `File saved to: ${uri}`);
      }
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Could not download file');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to permanently delete "${document.name}"? This will remove the file and all associated share links.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await documentService.deleteDocument(document);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Could not delete document');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleAnchor = async () => {
    if (!document.current_hash) {
      Alert.alert('Error', 'Document digital fingerprint is missing. Cannot create blockchain proof.');
      return;
    }

    try {
      setAnchoring(true);
      const newProof = await blockchainService.anchorDocument(document.id);
      setProof(newProof);
      Alert.alert(
        'Blockchain Proof Confirmed',
        `An immutable cryptographic proof for "${document.name}" has been permanently recorded on ${newProof.blockchain_network}.`
      );
    } catch (err: any) {
      Alert.alert(
        'Blockchain Anchoring Unavailable',
        err.message || 'Blockchain anchoring is currently unavailable. No blockchain proof was created.'
      );
    } finally {
      setAnchoring(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const isLocalMatch = await integrityService.verifyDocument(document);
      
      const dualResult = await blockchainService.verifyDualIntegrity(
        document.name,
        document.current_hash || '',
        document.current_hash,
        proof
      );

      if (isLocalMatch && dualResult.blockchainMatch !== false) {
        Alert.alert(
          '✓ Cryptographic Integrity Verified',
          `1. Local File Check: The stored document bytes exactly match the original SHA-256 fingerprint.\n\n2. Blockchain Status: ${proof ? 'Confirmed on Ethereum Sepolia.' : 'Original vault record matches.'}\n\nConclusion: This document is genuine and has never been altered.`
        );
        setDocument({ ...document, integrity_status: 'VERIFIED' });
      } else {
        Alert.alert(
          '⚠ Integrity Mismatch Detected',
          'Cryptographic fingerprint mismatch: The file on the server differs from the original reference record. The document may have been tampered with or modified.'
        );
        setDocument({ ...document, integrity_status: 'FAILED' });
      }
    } catch (err: any) {
      Alert.alert(
        'Verification Operation Error',
        err.message || 'Could not complete cryptographic verification due to a network or connection issue.'
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleShareSubmit = async () => {
    if (!shareTarget.trim()) {
      Alert.alert('Required', 'Please enter a recipient email address or user ID.');
      return;
    }

    let expiresAt: string | null = null;
    const now = Date.now();
    if (expiry === '1h') expiresAt = new Date(now + 3600 * 1000).toISOString();
    if (expiry === '24h') expiresAt = new Date(now + 24 * 3600 * 1000).toISOString();
    if (expiry === '7d') expiresAt = new Date(now + 7 * 24 * 3600 * 1000).toISOString();

    try {
      setSharing(true);
      await shareService.shareDocument(document.id, shareTarget.trim(), permission, expiresAt);
      setShareModalVisible(false);
      setShareTarget('');
      Alert.alert(
        'Document Shared',
        `"${document.name}" has been shared with ${shareTarget} (${permission === 'DOWNLOAD' ? 'Download & View' : 'View Only'}). You can revoke access at any time from the Sharing tab.`
      );
    } catch (err: any) {
      Alert.alert('Share Failed', err.message || 'Could not create share access');
    } finally {
      setSharing(false);
    }
  };

  const openEtherscan = (txHash: string) => {
    const url = blockchainService.getExplorerUrl(txHash);
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open transaction explorer link');
      });
    }
  };

  const formattedSize = document.size > 1024 * 1024
    ? `${(document.size / (1024 * 1024)).toFixed(2)} MB`
    : `${(document.size / 1024).toFixed(1)} KB`;

  const formattedDate = new Date(document.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* File Overview Card */}
      <View style={styles.headerCard}>
        <View style={styles.fileIconContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{document.name}</Text>
        <Text style={styles.meta}>
          {formattedSize} • Uploaded {formattedDate}
        </Text>
      </View>

      {/* Digital Fingerprint Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Digital Fingerprint (SHA-256)</Text>
        <Text style={styles.sectionExplainer}>
          This 256-bit cryptographic signature is computed from this file's exact binary bytes. If even one character is altered, this fingerprint changes completely.
        </Text>
        
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.label}>Authoritative Digest</Text>
            <View style={styles.badgeSmall}>
              <Text style={styles.badgeSmallText}>Deterministic</Text>
            </View>
          </View>
          <Text style={styles.hash} selectable={true}>
            {document.current_hash || 'Calculating fingerprint...'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.label}>Integrity Status</Text>
            <View style={[
              styles.statusBadge,
              document.integrity_status === 'VERIFIED'
                ? styles.statusVerified
                : document.integrity_status === 'FAILED'
                ? styles.statusFailed
                : styles.statusPending
            ]}>
              <Feather
                name={
                  document.integrity_status === 'VERIFIED'
                    ? 'check-circle'
                    : document.integrity_status === 'FAILED'
                    ? 'alert-triangle'
                    : 'clock'
                }
                size={12}
                color={
                  document.integrity_status === 'VERIFIED'
                    ? COLORS.success
                    : document.integrity_status === 'FAILED'
                    ? COLORS.danger
                    : COLORS.warning
                }
              />
              <Text style={[
                styles.statusBadgeText,
                {
                  color:
                    document.integrity_status === 'VERIFIED'
                      ? COLORS.success
                      : document.integrity_status === 'FAILED'
                      ? COLORS.danger
                      : COLORS.warning
                }
              ]}>
                {document.integrity_status === 'VERIFIED'
                  ? 'Original & Verified'
                  : document.integrity_status === 'FAILED'
                  ? 'Tampered / Mismatched'
                  : 'Pending Verification'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Blockchain Proof Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Blockchain Proof</Text>
          {proof && (
            <View style={styles.chainBadge}>
              <Feather name="link" size={12} color={COLORS.blockchain} />
              <Text style={styles.chainBadgeText}>Ethereum Sepolia</Text>
            </View>
          )}
        </View>
        <Text style={styles.sectionExplainer}>
          An immutable, public proof on the Ethereum blockchain that proves this document existed in this exact state at a verified timestamp.
        </Text>

        {loadingProof ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={COLORS.blockchain} />
          </View>
        ) : proof ? (
          <View style={[styles.card, styles.blockchainCard]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blockchain Network</Text>
              <Text style={styles.infoValue}>{proof.blockchain_network}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Proof Status</Text>
              <View style={styles.proofStatusBadge}>
                <Feather name="check" size={12} color={COLORS.blockchain} />
                <Text style={styles.proofStatusText}>{proof.status}</Text>
              </View>
            </View>

            {proof.transaction_hash && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transaction Proof</Text>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => openEtherscan(proof.transaction_hash!)}
                >
                  <Text style={styles.linkText}>
                    {truncateTxHash(proof.transaction_hash)}
                  </Text>
                  <Feather name="external-link" size={13} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}

            {proof.block_number && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Block Height</Text>
                <Text style={styles.infoValue}>#{proof.block_number}</Text>
              </View>
            )}

            {proof.anchored_at && (
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Anchored Timestamp</Text>
                <Text style={styles.infoValue}>
                  {new Date(proof.anchored_at).toLocaleDateString()} {new Date(proof.anchored_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.unanchoredText}>
              This document has not been anchored to Ethereum yet. Creating a blockchain proof records an unalterable timestamp on the public ledger.
            </Text>
            <View style={{ height: SPACING.md }} />
            <Button
              label={anchoring ? 'Creating Proof...' : 'Create Blockchain Proof'}
              onPress={handleAnchor}
              variant="secondary"
              disabled={anchoring || verifying}
            />
          </View>
        )}
      </View>

      {/* Core Actions */}
      <View style={styles.actions}>
        <Button 
          label={verifying ? 'Verifying File Bytes...' : 'Verify Cryptographic Integrity'} 
          onPress={handleVerify} 
          variant={document.integrity_status === 'FAILED' ? 'danger' : 'primary'}
          disabled={downloading || deleting || verifying || anchoring}
        />
        <View style={{ height: SPACING.sm }} />
        <Button 
          label="Share Document" 
          onPress={() => setShareModalVisible(true)} 
          variant="secondary"
          disabled={downloading || deleting || verifying || anchoring}
        />
        <View style={{ height: SPACING.sm }} />
        <Button 
          label={downloading ? 'Downloading File...' : 'Download / View File'} 
          onPress={handleDownload} 
          variant="secondary"
          disabled={downloading || deleting || verifying || anchoring}
        />
        <View style={{ height: SPACING.sm }} />
        <Button 
          label={deleting ? 'Deleting Document...' : 'Delete Document'} 
          onPress={handleDelete} 
          variant="ghost"
          disabled={downloading || deleting || verifying || anchoring}
        />
      </View>

      {/* Secure Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Document</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Grant secure, time-bounded access to another registered TrustLink user.
            </Text>

            <Text style={styles.inputLabel}>Recipient Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. colleague@trustlink.app"
              placeholderTextColor={COLORS.textMuted}
              value={shareTarget}
              onChangeText={setShareTarget}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Permission Level</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={[styles.pickerButton, permission === 'VIEW' && styles.pickerActive]}
                onPress={() => setPermission('VIEW')}
              >
                <Feather name="eye" size={14} color={permission === 'VIEW' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.pickerText, permission === 'VIEW' && styles.pickerActiveText]}>
                  VIEW ONLY
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerButton, permission === 'DOWNLOAD' && styles.pickerActive]}
                onPress={() => setPermission('DOWNLOAD')}
              >
                <Feather name="download" size={14} color={permission === 'DOWNLOAD' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.pickerText, permission === 'DOWNLOAD' && styles.pickerActiveText]}>
                  DOWNLOAD & VIEW
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Access Duration</Text>
            <View style={styles.pickerRow}>
              {(['1h', '24h', '7d', 'never'] as ExpiryOption[]).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.expiryButton, expiry === opt && styles.pickerActive]}
                  onPress={() => setExpiry(opt)}
                >
                  <Text style={[styles.pickerText, expiry === opt && styles.pickerActiveText]}>
                    {opt === 'never' ? 'PERMANENT' : opt.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                label={sharing ? 'Granting Access...' : 'Confirm Share'}
                onPress={handleShareSubmit}
                disabled={sharing}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  title: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  meta: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionExplainer: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: SPACING.sm,
    marginTop: 2,
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blockchainMuted,
    borderColor: COLORS.blockchain,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  chainBadgeText: {
    color: COLORS.blockchain,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  blockchainCard: {
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1.5,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeSmall: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSmallText: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.medium,
  },
  hash: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'monospace',
    lineHeight: 18,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  statusVerified: {
    backgroundColor: COLORS.successMuted,
  },
  statusPending: {
    backgroundColor: COLORS.warningMuted,
  },
  statusFailed: {
    backgroundColor: COLORS.dangerMuted,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semibold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.medium,
  },
  proofStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blockchainMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  proofStatusText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.blockchain,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.semibold,
    fontFamily: 'monospace',
  },
  unanchoredText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actions: {
    marginTop: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sm,
    marginBottom: SPACING.lg,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  expiryButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  pickerText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textSecondary,
  },
  pickerActiveText: {
    color: COLORS.primary,
  },
  modalActions: {
    marginTop: SPACING.sm,
  },
});
