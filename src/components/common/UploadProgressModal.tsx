// ============================================================
// TrustLink — Executive Upload Progress & Animation Modal
// Provides rich visual feedback with step transitions during file upload
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';

export interface UploadProgressState {
  visible: boolean;
  fileName: string;
  step: number; // 1: Hashing, 2: Uploading, 3: Registering, 4: Complete
  statusText: string;
  isComplete: boolean;
}

interface UploadProgressModalProps {
  state: UploadProgressState;
}

export function UploadProgressModal({ state }: UploadProgressModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0.15)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state.visible && !state.isComplete) {
      // Pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Spin effect
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.visible, state.isComplete]);

  // Animate progress bar according to step
  useEffect(() => {
    let targetProgress = 0.2;
    if (state.step === 1) targetProgress = 0.35;
    if (state.step === 2) targetProgress = 0.7;
    if (state.step === 3) targetProgress = 0.9;
    if (state.isComplete || state.step >= 4) targetProgress = 1.0;

    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [state.step, state.isComplete]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressPercent = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!state.visible) return null;

  return (
    <Modal
      visible={state.visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Animated Glowing Icon Header */}
          <View style={styles.iconWrapper}>
            <Animated.View
              style={[
                styles.iconGlow,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: state.isComplete ? COLORS.successMuted : COLORS.primaryMuted,
                },
              ]}
            />
            <View style={[styles.iconCircle, state.isComplete && styles.iconCircleComplete]}>
              {state.isComplete ? (
                <Feather name="check" size={28} color={COLORS.textInverse} />
              ) : (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <MaterialCommunityIcons
                    name="cloud-sync"
                    size={28}
                    color={COLORS.primary}
                  />
                </Animated.View>
              )}
            </View>
          </View>

          {/* Title & Target Document Name */}
          <Text style={styles.title}>
            {state.isComplete ? 'Document Secured!' : 'Securing Document'}
          </Text>
          <Text style={styles.fileName} numberOfLines={1}>
            {state.fileName}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressPercent,
                  backgroundColor: state.isComplete ? COLORS.success : COLORS.primary,
                },
              ]}
            />
          </View>

          {/* Step Indicators */}
          <View style={styles.stepsContainer}>
            {/* Step 1 */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, state.step >= 1 && styles.stepDotActive, state.step > 1 && styles.stepDotDone]}>
                {state.step > 1 ? (
                  <Feather name="check" size={10} color={COLORS.textInverse} />
                ) : (
                  <View style={styles.innerDot} />
                )}
              </View>
              <Text style={[styles.stepLabel, state.step === 1 && styles.stepLabelActive]}>
                Generating SHA-256 cryptographic fingerprint
              </Text>
            </View>

            {/* Step 2 */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, state.step >= 2 && styles.stepDotActive, state.step > 2 && styles.stepDotDone]}>
                {state.step > 2 ? (
                  <Feather name="check" size={10} color={COLORS.textInverse} />
                ) : (
                  <View style={styles.innerDot} />
                )}
              </View>
              <Text style={[styles.stepLabel, state.step === 2 && styles.stepLabelActive]}>
                Encrypting & uploading to vault storage
              </Text>
            </View>

            {/* Step 3 */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, state.step >= 3 && styles.stepDotActive, state.step > 3 && styles.stepDotDone]}>
                {state.step > 3 ? (
                  <Feather name="check" size={10} color={COLORS.textInverse} />
                ) : (
                  <View style={styles.innerDot} />
                )}
              </View>
              <Text style={[styles.stepLabel, state.step === 3 && styles.stepLabelActive]}>
                Recording immutable integrity ledger entry
              </Text>
            </View>
          </View>

          <Text style={styles.statusText}>{state.statusText}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: 'rgba(15, 23, 42, 0.2)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleComplete: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  title: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  fileName: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    maxWidth: '90%',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    borderColor: COLORS.primary,
  },
  stepDotDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.medium,
  },
  stepLabelActive: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.semibold,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
