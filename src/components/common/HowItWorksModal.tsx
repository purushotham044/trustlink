// ============================================================
// TrustLink — How It Works / Security Pipeline Explainer Modal
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { Button } from '@/components/common/Button';

interface HowItWorksModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ visible, onClose }: HowItWorksModalProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: '1',
      title: 'Store Safely',
      subtitle: 'Private Cloud Vault',
      icon: <Feather name="shield" size={28} color={COLORS.primary} />,
      color: COLORS.primary,
      bgColor: COLORS.primaryMuted,
      description:
        'Your documents are encrypted and stored in private cloud storage. PostgreSQL Row Level Security (RLS) ensures that only you and authorized share recipients can ever access your files.',
      badge: 'Step 1: Private Storage',
    },
    {
      step: '2',
      title: 'Digital Fingerprint',
      subtitle: 'Deterministic SHA-256',
      icon: <Feather name="lock" size={28} color={COLORS.primary} />,
      color: COLORS.primary,
      bgColor: COLORS.primaryMuted,
      description:
        'The moment you upload a file, TrustLink computes a unique 256-bit cryptographic fingerprint (SHA-256) of its exact binary bytes. If even one letter or pixel changes, the fingerprint completely alters.',
      badge: 'Step 2: Cryptography',
    },
    {
      step: '3',
      title: 'Blockchain Proof',
      subtitle: 'Ethereum Sepolia Anchoring',
      icon: <Feather name="link" size={28} color={COLORS.blockchain} />,
      color: COLORS.blockchain,
      bgColor: COLORS.blockchainMuted,
      description:
        'Your document’s digital fingerprint is recorded on the Ethereum blockchain via a smart contract. This creates an unalterable, timestamped public proof of existence that cannot be deleted or manipulated by anyone.',
      badge: 'Step 3: Public Immutability',
    },
    {
      step: '4',
      title: 'Verify & Share',
      subtitle: 'Tamper Detection & Control',
      icon: <Feather name="check-circle" size={28} color={COLORS.success} />,
      color: COLORS.success,
      bgColor: COLORS.successMuted,
      description:
        'Verify document authenticity anytime by re-checking file bytes against the original blockchain proof. Share access with colleagues using time-bounded permissions (1h, 24h, 7d) and instant revocation.',
      badge: 'Step 4: Truth & Control',
    },
  ];

  const current = steps[activeStep];

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Feather name="shield" size={18} color={COLORS.primary} />
              <Text style={styles.headerTitle}>How TrustLink Works</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.pipelineTitle}>
            Store → Fingerprint → Blockchain Proof → Verify → Share
          </Text>

          {/* Step Indicator Dots */}
          <View style={styles.stepDotsRow}>
            {steps.map((s, idx) => (
              <TouchableOpacity
                key={s.step}
                style={[
                  styles.stepDot,
                  activeStep === idx && styles.stepDotActive,
                  activeStep === idx && { backgroundColor: s.color },
                ]}
                onPress={() => setActiveStep(idx)}
              >
                <Text
                  style={[
                    styles.stepDotText,
                    activeStep === idx && styles.stepDotTextActive,
                  ]}
                >
                  {s.step}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Active Step Card */}
          <ScrollView contentContainerStyle={styles.cardContent}>
            <View style={[styles.iconBox, { backgroundColor: current.bgColor, borderColor: current.color }]}>
              {current.icon}
            </View>

            <View style={[styles.badgePill, { backgroundColor: current.bgColor }]}>
              <Text style={[styles.badgePillText, { color: current.color }]}>{current.badge}</Text>
            </View>

            <Text style={styles.stepTitle}>{current.title}</Text>
            <Text style={styles.stepSubtitle}>{current.subtitle}</Text>
            <Text style={styles.stepDescription}>{current.description}</Text>
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.footer}>
            {activeStep < steps.length - 1 ? (
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={onClose}
                >
                  <Text style={styles.skipButtonText}>Close</Text>
                </TouchableOpacity>
                <Button
                  label="Next Step ›"
                  onPress={() => setActiveStep(activeStep + 1)}
                  variant="primary"
                />
              </View>
            ) : (
              <Button
                label="Got It — Back to Vault"
                onPress={onClose}
                variant="primary"
                fullWidth
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pipelineTitle: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: SPACING.md,
  },
  stepDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    borderColor: 'transparent',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textMuted,
  },
  stepDotTextActive: {
    color: COLORS.textInverse,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badgePill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.medium,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.sm,
  },
  footer: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  skipButtonText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.medium,
  },
});
