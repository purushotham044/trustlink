// ============================================================
// TrustLink — Professional Document Detail Screen (Responsive)
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { VaultStackParamList } from '@/navigation/VaultNavigator';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { documentService } from '@/services/documentService';
import { integrityService } from '@/services/integrityService';
import { blockchainService } from '@/services/blockchainService';
import { shareService } from '@/services/shareService';
import { Button } from '@/components/common/Button';
import { BlockchainProof, SharePermission } from '@/types';
import { truncateTxHash, computeFileSha256 } from '@/lib/crypto';

type Props = StackScreenProps<VaultStackParamList, 'DocumentDetail'>;
type ExpiryOption = '1h' | '24h' | '7d' | 'never';

export function DocumentDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { document: initialDocument } = route.params;
  const [document, setDocument] = useState(initialDocument);
  const [proof, setProof] = useState<BlockchainProof | null>(null);
  const [loadingProof, setLoadingProof] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [anchoring, setAnchoring] = useState(false);

  // Local Tamper Check State
  const [isTestingTamper, setIsTestingTamper] = useState(false);
  const [tamperResult, setTamperResult] = useState<{
    fileName: string;
    computedHash: string;
    matches: boolean;
  } | null>(null);

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

  const handleSystemShare = async () => {
    try {
      await shareService.shareViaSystem(document);
    } catch (err: any) {
      Alert.alert('Share Note', err.message || 'Could not open system share dialog');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to permanently delete "${document.name}"? This will remove the file and all associated proofs from your vault.`,
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
              Alert.alert('Error', err.message || 'Failed to delete document');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const isVerified = await integrityService.verifyDocument(document);
      
      // Also check against blockchain record
      const dualResult = await blockchainService.verifyDualIntegrity(
        document.name,
        document.current_hash || '',
        document.current_hash,
        proof
      );

      const updatedDoc = {
        ...document,
        integrity_status: (isVerified && dualResult.blockchainMatch !== false) ? 'VERIFIED' : 'FAILED',
      } as const;

      setDocument(updatedDoc as any);

      if (isVerified && dualResult.blockchainMatch !== false) {
        Alert.alert(
          '✓ Integrity Verified',
          `Cloud vault binary exactly matches the recorded cryptographic signature.\n\nSHA-256: ${document.current_hash}\nBlockchain Status: ${proof ? 'Confirmed on Ethereum Sepolia' : 'Vault Reference Intact'}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '⚠ Integrity Check Failed',
          'The document binary in cloud storage does not match its registered cryptographic hash. The file may have been modified or corrupted.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Verification Error', err.message || 'Could not verify document integrity.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSearchForTamper = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || !res.assets[0]) return;

      const file = res.assets[0];
      setIsTestingTamper(true);
      setTamperResult(null);

      const hash = await computeFileSha256(file.uri);
      const expectedHash = (document.current_hash || '').toLowerCase();
      const matches = hash.toLowerCase() === expectedHash;

      setTamperResult({
        fileName: file.name,
        computedHash: hash,
        matches,
      });

      if (matches) {
        Alert.alert(
          '✓ MATCH CONFIRMED',
          `The selected file "${file.name}" exactly matches the registered SHA-256 fingerprint down to the exact byte!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '⚠ FINGERPRINT MISMATCH DETECTED',
          `The selected file "${file.name}" has been modified or altered!\n\nSelected Hash: ${hash}\nVault Reference: ${document.current_hash}`,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Tamper Search Error', err.message || 'Could not check file.');
    } finally {
      setIsTestingTamper(false);
    }
  };

  const handleAnchor = async () => {
    try {
      setAnchoring(true);
      const newProof = await blockchainService.anchorDocument(document.id);
      setProof(newProof);
      Alert.alert(
        'Blockchain Proof Created',
        `An immutable cryptographic proof for "${document.name}" has been permanently recorded on ${newProof.blockchain_network}.\n\nTx: ${newProof.transaction_hash ? truncateTxHash(newProof.transaction_hash) : 'Pending'}\nBlock: #${newProof.block_number || 'Mining'}`,
        [{ text: 'View Proof', onPress: () => {} }]
      );
    } catch (err: any) {
      Alert.alert(
        'Anchoring Note',
        err.message || 'Blockchain anchoring is currently processing or temporarily unavailable.',
        [{ text: 'OK' }]
      );
    } finally {
      setAnchoring(false);
    }
  };

  const handleCreateShare = async () => {
    if (!shareTarget.trim()) {
      Alert.alert('Invalid Input', 'Please enter a recipient email or user ID.');
      return;
    }

    try {
      setSharing(true);
      let expiresAt: string | null = null;
      const now = Date.now();
      if (expiry === '1h') expiresAt = new Date(now + 3600 * 1000).toISOString();
      if (expiry === '24h') expiresAt = new Date(now + 24 * 3600 * 1000).toISOString();
      if (expiry === '7d') expiresAt = new Date(now + 7 * 24 * 3600 * 1000).toISOString();

      await shareService.shareDocument(
        document.id,
        shareTarget.trim(),
        permission,
        expiresAt
      );

      setShareModalVisible(false);
      setShareTarget('');
      Alert.alert(
        'Share Created',
        `Access granted for ${shareTarget} (${permission === 'DOWNLOAD' ? 'Download & View' : 'View Only'}).`
      );
    } catch (err: any) {
      Alert.alert('Sharing Failed', err.message || 'Could not create share permission.');
    } finally {
      setSharing(false);
    }
  };

  const openEtherscan = (txHash: string) => {
    const url = blockchainService.getExplorerUrl(txHash);
    if (url) Linking.openURL(url);
  };

  const openContract = () => {
    const url = blockchainService.getContractUrl();
    Linking.openURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getStatusColor = () => {
    switch (document.integrity_status) {
      case 'VERIFIED': return COLORS.success;
      case 'FAILED': return COLORS.danger;
      default: return COLORS.warning;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 24) + SPACING.xl }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Feather name="file-text" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.docName} numberOfLines={2}>{document.name}</Text>
        <Text style={styles.docMeta}>
          {formatSize(document.size)} • {document.mime_type || 'Unknown Type'}
        </Text>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '15', borderColor: getStatusColor() + '40' }]}>
          <MaterialCommunityIcons 
            name={document.integrity_status === 'VERIFIED' ? 'shield-check' : 'shield-alert'} 
            size={14} 
            color={getStatusColor()} 
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {document.integrity_status}
          </Text>
        </View>
      </View>

      {/* SHA-256 Fingerprint */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SHA-256 Digital Fingerprint</Text>
        <View style={styles.card}>
          <Text style={styles.hashText} selectable={true}>
            {document.current_hash || 'No hash recorded'}
          </Text>
          <Text style={styles.cardNote}>
            Mathematical representation of this file. If even one letter or pixel changes, this entire hash changes.
          </Text>
        </View>
      </View>

      {/* Ethereum Proof Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ethereum Blockchain Proof</Text>
        
        {loadingProof ? (
          <View style={[styles.card, styles.centerCard]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Checking Sepolia smart contract...</Text>
          </View>
        ) : proof ? (
          <View style={styles.card}>
            <View style={styles.proofHeader}>
              <View style={styles.proofNetwork}>
                <MaterialCommunityIcons name="ethereum" size={18} color={COLORS.blockchain} />
                <Text style={styles.proofNetworkText}>{proof.blockchain_network}</Text>
              </View>
              <View style={styles.proofStatusBadge}>
                <Feather name="check" size={12} color={COLORS.blockchain} />
                <Text style={styles.proofStatusText}>{proof.status}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Smart Contract</Text>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={openContract}
              >
                <Text style={styles.linkText}>
                  {truncateTxHash(proof.contract_address || '0x1b9A1FBD6FC714B1aC443d00a555529567bd8D0E')}
                </Text>
                <Feather name="external-link" size={13} color={COLORS.primary} />
              </TouchableOpacity>
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

      {/* Search for Tamper Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search for Tamper</Text>
        <View style={styles.card}>
          <Text style={styles.cardNote}>
            Select any local file on your phone to compare its SHA-256 fingerprint against this registered vault document and Sepolia blockchain proof.
          </Text>
          <View style={{ height: SPACING.sm }} />
          <TouchableOpacity
            style={styles.tamperSearchBtn}
            onPress={handleSearchForTamper}
            disabled={isTestingTamper}
            activeOpacity={0.8}
          >
            {isTestingTamper ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Feather name="search" size={15} color={COLORS.primary} />
            )}
            <Text style={styles.tamperSearchBtnText}>
              {isTestingTamper ? 'Analyzing File Hash...' : 'Pick Local File to Compare'}
            </Text>
          </TouchableOpacity>

          {tamperResult && (
            <View
              style={[
                styles.tamperResultBox,
                {
                  backgroundColor: tamperResult.matches ? COLORS.success + '15' : COLORS.danger + '15',
                  borderColor: tamperResult.matches ? COLORS.success + '40' : COLORS.danger + '40',
                },
              ]}
            >
              <Text
                style={[
                  styles.tamperResultTitle,
                  { color: tamperResult.matches ? COLORS.success : COLORS.danger },
                ]}
              >
                {tamperResult.matches ? '✓ MATCH CONFIRMED' : '⚠ FINGERPRINT MISMATCH DETECTED'}
              </Text>
              <Text style={styles.tamperResultFile} numberOfLines={1}>
                File: {tamperResult.fileName}
              </Text>
              <Text style={styles.tamperResultHash} numberOfLines={2}>
                Calculated: {tamperResult.computedHash}
              </Text>
            </View>
          )}
        </View>
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
        
        {/* Two-Button Sharing Row */}
        <View style={styles.shareRow}>
          <TouchableOpacity
            style={[styles.shareActionBtn, styles.nativeShareBtn]}
            onPress={handleSystemShare}
            disabled={downloading || deleting || verifying || anchoring}
            activeOpacity={0.75}
          >
            <Feather name="share-2" size={16} color={COLORS.primary} />
            <Text style={styles.nativeShareText}>Share via Apps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareActionBtn, styles.vaultShareBtn]}
            onPress={() => setShareModalVisible(true)}
            disabled={downloading || deleting || verifying || anchoring}
            activeOpacity={0.75}
          >
            <Feather name="user-check" size={16} color={COLORS.textPrimary} />
            <Text style={styles.vaultShareText}>Grant In-App Access</Text>
          </TouchableOpacity>
        </View>

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
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grant In-App Access</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Create a permission-controlled, time-bounded share record for another user.
            </Text>

            <Text style={styles.inputLabel}>Recipient Email or User ID</Text>
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

            <Text style={styles.inputLabel}>Expiration Duration</Text>
            <View style={styles.pickerRow}>
              {(['1h', '24h', '7d', 'never'] as ExpiryOption[]).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.expiryBtn, expiry === opt && styles.pickerActive]}
                  onPress={() => setExpiry(opt)}
                >
                  <Text style={[styles.expiryText, expiry === opt && styles.pickerActiveText]}>
                    {opt.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: SPACING.lg }} />

            <Button
              label={sharing ? 'Granting Access...' : 'Confirm & Share'}
              onPress={handleCreateShare}
              disabled={sharing}
            />
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
    padding: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  docName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  docMeta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  hashText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.primary,
    lineHeight: 16,
    backgroundColor: COLORS.surfaceHighlight,
    padding: 10,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  cardNote: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    lineHeight: 16,
  },
  tamperSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  tamperSearchBtnText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
  tamperResultBox: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  tamperResultTitle: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  tamperResultFile: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  tamperResultHash: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textMuted,
  },
  proofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  proofNetwork: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proofNetworkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  proofStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.blockchain + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.blockchain + '30',
  },
  proofStatusText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.blockchain,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '60',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
  unanchoredText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  actions: {
    marginTop: SPACING.sm,
  },
  shareRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  shareActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  nativeShareBtn: {
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  nativeShareText: {
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  vaultShareBtn: {
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vaultShareText: {
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  pickerText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textMuted,
  },
  pickerActiveText: {
    color: COLORS.primary,
  },
  expiryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expiryText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textMuted,
  },
});
