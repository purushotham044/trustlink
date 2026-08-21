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
  TouchableOpacity,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export interface UploadProgressState {
  visible: boolean;
  fileName: string;
  step: number; // 1: Hashing, 2: Uploading, 3: Registering, 4: Complete
  statusText: string;
  isComplete: boolean;
}

interface UploadProgressModalProps {
  state: UploadProgressState;
  onClose?: () => void;
}

export function UploadProgressModal({ state, onClose }: UploadProgressModalProps) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0.15)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Auto-close after completion
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.visible && state.isComplete && onClose) {
      timer = setTimeout(() => {
        onClose();
      }, 1400);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [state.visible, state.isComplete, onClose]);

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
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Animated Glowing Icon Header */}
          <View style={styles.iconWrapper}>
            <Animated.View
              style={[
                styles.iconGlow,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: state.isComplete ? colors.successMuted : colors.primaryMuted,
                },
              ]}
            />
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.surfaceHighlight, borderColor: colors.primary },
                state.isComplete && { backgroundColor: colors.success, borderColor: colors.success },
              ]}
            >
              {state.isComplete ? (
                <Feather name="check" size={28} color="#FFFFFF" />
              ) : (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <MaterialCommunityIcons
                    name="cloud-sync"
                    size={28}
                    color={colors.primary}
                  />
                </Animated.View>
              )}
            </View>
          </View>

          {/* Title & Target Document Name */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {state.isComplete ? 'Document Secured!' : 'Securing Document'}
          </Text>
          <Text style={[styles.fileName, { color: colors.textMuted }]} numberOfLines={1}>
            {state.fileName}
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.surfaceHighlight }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressPercent,
                  backgroundColor: state.isComplete ? colors.success : colors.primary,
                },
              ]}
            />
          </View>

          {/* Step Indicators */}
          <View style={[styles.stepsContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
            {/* Step 1 */}
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  state.step >= 1 && { borderColor: colors.primary, backgroundColor: colors.primary },
                  state.step > 1 && { borderColor: colors.success, backgroundColor: colors.success },
                ]}
              >
                {state.step > 1 ? (
                  <Feather name="check" size={10} color="#FFFFFF" />
                ) : (
                  <View style={[styles.innerDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: colors.textMuted },
                  state.step === 1 && [styles.stepLabelActive, { color: colors.primary }],
                  state.step > 1 && { color: colors.textPrimary },
                ]}
              >
                Generating SHA-256 cryptographic fingerprint
              </Text>
            </View>

            {/* Step 2 */}
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  state.step >= 2 && { borderColor: colors.primary, backgroundColor: colors.primary },
                  state.step > 2 && { borderColor: colors.success, backgroundColor: colors.success },
                ]}
              >
                {state.step > 2 ? (
                  <Feather name="check" size={10} color="#FFFFFF" />
                ) : (
                  <View style={[styles.innerDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: colors.textMuted },
                  state.step === 2 && [styles.stepLabelActive, { color: colors.primary }],
                  state.step > 2 && { color: colors.textPrimary },
                ]}
              >
                Encrypting & uploading to vault storage
              </Text>
            </View>

            {/* Step 3 */}
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  state.step >= 3 && { borderColor: colors.primary, backgroundColor: colors.primary },
                  state.step > 3 && { borderColor: colors.success, backgroundColor: colors.success },
                ]}
              >
                {state.step > 3 ? (
                  <Feather name="check" size={10} color="#FFFFFF" />
                ) : (
                  <View style={[styles.innerDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: colors.textMuted },
                  state.step === 3 && [styles.stepLabelActive, { color: colors.primary }],
                  state.step > 3 && { color: colors.textPrimary },
                ]}
              >
                Recording immutable integrity ledger entry
              </Text>
            </View>
          </View>

          <Text style={[styles.statusText, { color: colors.textMuted }]}>{state.statusText}</Text>

          {/* Dismiss Done Button when Complete */}
          {state.isComplete && onClose && (
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.success }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: 'rgba(15, 23, 42, 0.25)',
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
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  fileName: {
    fontSize: TYPOGRAPHY.xs,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  stepsContainer: {
    width: '100%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepLabel: {
    fontSize: 11,
    flex: 1,
  },
  stepLabelActive: {
    fontWeight: TYPOGRAPHY.bold,
  },
  statusText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  doneButton: {
    marginTop: SPACING.md,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.bold,
  },
});
