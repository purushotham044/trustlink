// ============================================================
// TrustLink — Professional Folder Card Component
// ============================================================

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { Folder } from '@/types';

interface FolderCardProps {
  folder: Folder;
  onPress: () => void;
}

export function FolderCard({ folder, onPress }: FolderCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Feather name="folder" size={20} color={COLORS.primary} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {folder.name}
        </Text>
      </View>

      <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
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
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
  },
});
