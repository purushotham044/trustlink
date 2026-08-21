// ============================================================
// TrustLink — Button Component (Fully Theme Responsive)
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
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const getVariantStyles = (): { button: ViewStyle; text: TextStyle; loaderColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          button: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
          text: {
            color: '#FFFFFF',
          },
          loaderColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          button: {
            backgroundColor: colors.surfaceHighlight,
            borderColor: colors.primary + '60',
          },
          text: {
            color: colors.primary,
          },
          loaderColor: colors.primary,
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          text: {
            color: colors.textPrimary,
          },
          loaderColor: colors.textPrimary,
        };
      case 'danger':
        return {
          button: {
            backgroundColor: colors.dangerMuted,
            borderColor: colors.danger + '60',
          },
          text: {
            color: colors.danger,
          },
          loaderColor: colors.danger,
        };
    }
  };

  const v = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        v.button,
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.loaderColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, v.text, styles[`labelSize_${size}`]]}>
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

  // Label sizes
  labelSize_sm: { fontSize: TYPOGRAPHY.sm } as TextStyle,
  labelSize_md: { fontSize: TYPOGRAPHY.base } as TextStyle,
  labelSize_lg: { fontSize: TYPOGRAPHY.md } as TextStyle,
});
