// ============================================================
// TrustLink — Button Component
// ============================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? COLORS.textInverse : COLORS.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  } as ViewStyle,

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  } as ViewStyle,
  secondary: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  } as ViewStyle,
  ghost: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
  } as ViewStyle,
  danger: {
    backgroundColor: COLORS.dangerMuted,
    borderColor: COLORS.danger,
  } as ViewStyle,

  // Sizes
  size_sm: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md } as ViewStyle,
  size_md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg } as ViewStyle,
  size_lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl } as ViewStyle,

  fullWidth: { width: '100%' } as ViewStyle,

  disabled: { opacity: 0.45 } as ViewStyle,

  // Label base
  label: {
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: 0.3,
  } as TextStyle,

  // Label variants
  label_primary: { color: COLORS.textInverse } as TextStyle,
  label_secondary: { color: COLORS.primary } as TextStyle,
  label_ghost: { color: COLORS.textSecondary } as TextStyle,
  label_danger: { color: COLORS.danger } as TextStyle,

  // Label sizes
  labelSize_sm: { fontSize: TYPOGRAPHY.sm } as TextStyle,
  labelSize_md: { fontSize: TYPOGRAPHY.base } as TextStyle,
  labelSize_lg: { fontSize: TYPOGRAPHY.md } as TextStyle,
});
