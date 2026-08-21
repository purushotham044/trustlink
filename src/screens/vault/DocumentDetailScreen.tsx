// ============================================================
// TrustLink — Professional Document Detail Screen (Responsive)
// Clean Integrity, Blockchain Proofs & File Actions
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { VaultStackParamList } from '@/navigation/VaultNavigator';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { documentService } from '@/services/documentService';
import { integrityService } from '@/services/integrityService';
import { blockchainService } from '@/services/blockchainService';
import { Button } from '@/components/common/Button';
import { BlockchainProof } from '@/types';
import { truncateTxHash, computeFileSha256 } from '@/lib/crypto';

type Props = StackScreenProps<VaultStackParamList, 'DocumentDetail'>;

export function DocumentDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const isMatch = await integrityService.verifyDocument(document);
      
      setDocument(prev => ({
        ...prev,
        integrity_status: isMatch ? 'VERIFIED' : 'FAILED',
      }));

      if (isMatch) {
        Alert.alert(
          'Cryptographic Integrity Verified',
          'The document bytes in vault cloud storage perfectly match the mathematical SHA-256 fingerprint recorded at registration. No tampering or alteration detected.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Tamper Warning',
          'The SHA-256 hash of the stored file does NOT match the cryptographic ledger. The file may have been altered.',
          [{ text: 'OK', style: 'destructive' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Could not verify document integrity');
    } finally {
      setVerifying(false);
    }
  };

  const handleAnchor = async () => {
    try {
      setAnchoring(true);
      const newProof = await blockchainService.anchorDocument(document.id);
      setProof(newProof);
      Alert.alert(
        'Anchored on Ethereum Sepolia',
        `Document fingerprint successfully anchored to smart contract at block #${newProof.block_number || 'Confirmed'}.\n\nTx Hash: ${newProof.transaction_hash}`
      );
    } catch (err: any) {
      Alert.alert('Blockchain Anchoring Error', err.message || 'Could not complete blockchain anchoring');
    } finally {
      setAnchoring(false);
    }
  };

  const handleSearchForTamper = async () => {
    try {
      setIsTestingTamper(true);
      setTamperResult(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsTestingTamper(false);
        return;
      }

      const asset = result.assets[0];
      const localHash = await computeFileSha256(asset.uri);
      const matches = localHash.toLowerCase() === (document.current_hash || '').toLowerCase();

      setTamperResult({
        fileName: asset.name,
        computedHash: localHash,
        matches,
      });

      if (matches) {
        Alert.alert(
          'Cryptographic Match (Intact)',
          `Selected file "${asset.name}" matches the vaulted SHA-256 fingerprint exactly.\n\nFile is 100% genuine and unaltered.`
        );
      } else {
        Alert.alert(
          'Mismatch / Tampered File Detected',
          `Selected file "${asset.name}" has a different cryptographic fingerprint:\n\nVault: ${document.current_hash?.slice(0, 16)}...\nSelected: ${localHash.slice(0, 16)}...\n\nThis confirms the file has different content or has been modified.`,
          [{ text: 'Acknowledge', style: 'destructive' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Tamper Analysis Failed', err.message || 'Could not analyze local file');
    } finally {
      setIsTestingTamper(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to permanently delete "${document.name}"? This action cannot be undone.`,
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
          },
        },
      ]
    );
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
      case 'VERIFIED': return colors.success;
      case 'FAILED': return colors.danger;
      default: return colors.warning;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 24) + SPACING.xl }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.primary + '30' }]}>
          <Feather name="file-text" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.docName, { color: colors.textPrimary }]} numberOfLines={2}>{document.name}</Text>
        <Text style={[styles.docMeta, { color: colors.textMuted }]}>
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
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SHA-256 Digital Fingerprint</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.hashText, { color: colors.primary, backgroundColor: colors.surfaceHighlight }]} selectable={true}>
            {document.current_hash || 'No hash recorded'}
          </Text>
          <Text style={[styles.cardNote, { color: colors.textMuted }]}>
            Mathematical representation of this file. If even one letter or pixel changes, this entire hash changes.
          </Text>
        </View>
      </View>

      {/* Ethereum Proof Status */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Ethereum Blockchain Proof</Text>
        
        {loadingProof ? (
          <View style={[styles.card, styles.centerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Checking Sepolia smart contract...</Text>
          </View>
        ) : proof ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.proofHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.proofNetwork}>
                <MaterialCommunityIcons name="ethereum" size={18} color={colors.blockchain} />
                <Text style={[styles.proofNetworkText, { color: colors.textPrimary }]}>{proof.blockchain_network}</Text>
              </View>
              <View style={[styles.proofStatusBadge, { backgroundColor: colors.blockchain + '15', borderColor: colors.blockchain + '30' }]}>
                <Feather name="check" size={12} color={colors.blockchain} />
                <Text style={[styles.proofStatusText, { color: colors.blockchain }]}>{proof.status}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: colors.border + '60' }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Smart Contract</Text>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={openContract}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {truncateTxHash(proof.contract_address || '0x1b9A1FBD6FC714B1aC443d00a555529567bd8D0E')}
                </Text>
                <Feather name="external-link" size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {proof.transaction_hash && (
              <View style={[styles.infoRow, { borderBottomColor: colors.border + '60' }]}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Transaction Proof</Text>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => openEtherscan(proof.transaction_hash!)}
                >
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    {truncateTxHash(proof.transaction_hash)}
                  </Text>
                  <Feather name="external-link" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {proof.block_number && (
              <View style={[styles.infoRow, { borderBottomColor: colors.border + '60' }]}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Block Height</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>#{proof.block_number}</Text>
              </View>
            )}

            {proof.anchored_at && (
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Anchored Timestamp</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {new Date(proof.anchored_at).toLocaleDateString()} {new Date(proof.anchored_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.unanchoredText, { color: colors.textMuted }]}>
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
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Search for Tamper</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardNote, { color: colors.textMuted }]}>
            Select any local file on your phone to compare its SHA-256 fingerprint against this registered vault document and Sepolia blockchain proof.
          </Text>
          <View style={{ height: SPACING.sm }} />
          <TouchableOpacity
            style={[styles.tamperSearchBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.primary + '40' }]}
            onPress={handleSearchForTamper}
            disabled={isTestingTamper}
            activeOpacity={0.8}
          >
            {isTestingTamper ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="search" size={15} color={colors.primary} />
            )}
            <Text style={[styles.tamperSearchBtnText, { color: colors.primary }]}>
              {isTestingTamper ? 'Analyzing File Hash...' : 'Pick Local File to Compare'}
            </Text>
          </TouchableOpacity>

          {tamperResult && (
            <View
              style={[
                styles.tamperResultBox,
                {
                  backgroundColor: tamperResult.matches ? colors.success + '15' : colors.danger + '15',
                  borderColor: tamperResult.matches ? colors.success + '40' : colors.danger + '40',
                },
              ]}
            >
              <Text
                style={[
                  styles.tamperResultTitle,
                  { color: tamperResult.matches ? colors.success : colors.danger },
                ]}
              >
                {tamperResult.matches ? '✓ MATCH CONFIRMED' : '⚠ FINGERPRINT MISMATCH DETECTED'}
              </Text>
              <Text style={[styles.tamperResultFile, { color: colors.textPrimary }]} numberOfLines={1}>
                File: {tamperResult.fileName}
              </Text>
              <Text style={[styles.tamperResultHash, { color: colors.textMuted }]} numberOfLines={2}>
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
        
        <Button 
          label={downloading ? 'Downloading File...' : 'Download / Export File'} 
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  docName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  docMeta: {
    fontSize: TYPOGRAPHY.xs,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
    marginLeft: 2,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.xs,
  },
  hashText: {
    fontSize: 11,
    fontFamily: 'monospace',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  cardNote: {
    fontSize: 11,
    lineHeight: 16,
  },
  proofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  proofNetwork: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proofNetworkText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
  },
  proofStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  proofStatusText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.xs,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    textDecorationLine: 'underline',
  },
  unanchoredText: {
    fontSize: TYPOGRAPHY.xs,
    lineHeight: 18,
  },
  tamperSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  tamperSearchBtnText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
  },
  tamperResultBox: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  tamperResultTitle: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 2,
  },
  tamperResultFile: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.medium,
  },
  tamperResultHash: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  actions: {
    marginTop: SPACING.sm,
  },
});
