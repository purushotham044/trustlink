// ============================================================
// TrustLink — Professional Document Card Component
// ============================================================

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { Document } from '@/types';

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
}

export function DocumentCard({ document, onPress }: DocumentCardProps) {
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
      return <Feather name="file-text" size={22} color="#94A3B8" />;
    }
    return <Feather name="file" size={22} color={COLORS.primary} />;
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
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {getFileIcon()}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {document.name}
        </Text>
        <Text style={styles.meta}>
          {formattedSize} • {formattedDate}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        {isVerified ? (
          <View style={[styles.badge, styles.badgeVerified]}>
            <Feather name="check-circle" size={11} color={COLORS.success} />
            <Text style={[styles.badgeText, { color: COLORS.success }]}>Verified</Text>
          </View>
        ) : isFailed ? (
          <View style={[styles.badge, styles.badgeFailed]}>
            <Feather name="alert-triangle" size={11} color={COLORS.danger} />
            <Text style={[styles.badgeText, { color: COLORS.danger }]}>Tampered</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgePending]}>
            <Feather name="clock" size={11} color={COLORS.warning} />
            <Text style={[styles.badgeText, { color: COLORS.warning }]}>Pending</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={COLORS.textMuted} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  info: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  meta: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  badgeVerified: {
    backgroundColor: COLORS.successMuted,
  },
  badgeFailed: {
    backgroundColor: COLORS.dangerMuted,
  },
  badgePending: {
    backgroundColor: COLORS.warningMuted,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chevron: {
    marginLeft: SPACING.xs,
  },
});
