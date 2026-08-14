// ============================================================
// TrustLink — ErrorBanner Component
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';

interface ErrorBannerProps {
  message: string | null;
  style?: ViewStyle;
}

export function ErrorBanner({ message, style }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>⚠</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.dangerMuted,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  icon: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.danger,
  } as TextStyle,
  message: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.danger,
    lineHeight: 18,
  } as TextStyle,
});
