// ============================================================
// TrustLink — Professional Document Card Component
// Supports Long-Press Multi-Select Mode
// ============================================================

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { Document } from '@/types';

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

export function DocumentCard({
  document,
  onPress,
  onLongPress,
  isSelected = false,
  isSelectionMode = false,
}: DocumentCardProps) {
  const { colors } = useTheme();

  // Determine vector icon and color based on mime type
  const getFileIcon = () => {
    if (document.mime_type.includes('pdf')) {
      return <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />;
    }
    if (document.mime_type.includes('image')) {
      return <MaterialCommunityIcons name="file-image-outline" size={24} color="#3B82F6" />;
    }
    if (document.mime_type.includes('word') || document.mime_type.includes('officedocument.wordprocessingml')) {
      return <MaterialCommunityIcons name="file-word-box" size={24} color="#2563EB" />;
    }
    if (document.mime_type.includes('excel') || document.mime_type.includes('spreadsheetml')) {
      return <MaterialCommunityIcons name="file-excel-box" size={24} color="#10B981" />;
    }
    if (document.mime_type.includes('text')) {
      return <Feather name="file-text" size={22} color={colors.textMuted} />;
    }
    return <Feather name="file" size={22} color={colors.primary} />;
  };

  const formattedSize = document.size > 1024 * 1024
    ? `${(document.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(document.size / 1024))} KB`;

  const formattedDate = new Date(document.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isVerified = document.integrity_status === 'VERIFIED';
  const isFailed = document.integrity_status === 'FAILED';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      {/* Checkbox indicator when in selection mode */}
      {isSelectionMode && (
        <View
          style={[
            styles.checkbox,
            { borderColor: isSelected ? colors.primary : colors.border },
            isSelected && { backgroundColor: colors.primary },
          ]}
        >
          {isSelected && <Feather name="check" size={13} color="#FFFFFF" />}
        </View>
      )}

      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
        {getFileIcon()}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {document.name}
        </Text>
        <Text style={[styles.metadata, { color: colors.textMuted }]}>
          {formattedSize} • {formattedDate}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {!isSelectionMode ? (
          <>
            <View
              style={[
                styles.badge,
                isVerified && { backgroundColor: colors.successMuted, borderColor: colors.success + '40' },
                isFailed && { backgroundColor: colors.dangerMuted, borderColor: colors.danger + '40' },
                !isVerified && !isFailed && { backgroundColor: colors.warningMuted, borderColor: colors.warning + '40' },
              ]}
            >
              <Feather
                name={isVerified ? 'shield' : isFailed ? 'alert-triangle' : 'clock'}
                size={11}
                color={isVerified ? colors.success : isFailed ? colors.danger : colors.warning}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: isVerified ? colors.success : isFailed ? colors.danger : colors.warning },
                ]}
              >
                {isVerified ? 'VERIFIED' : isFailed ? 'FAILED' : 'PENDING'}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: 2,
  },
  metadata: {
    fontSize: TYPOGRAPHY.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.5,
  },
});
