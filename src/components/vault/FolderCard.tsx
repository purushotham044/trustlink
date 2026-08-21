// ============================================================
// TrustLink — Professional Folder Card Component
// Supports Long-Press Multi-Select Mode
// ============================================================

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { Folder } from '@/types';

interface FolderCardProps {
  folder: Folder;
  onPress: () => void;
  onLongPress?: () => void;
  onOptionsPress?: () => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

export function FolderCard({
  folder,
  onPress,
  onLongPress,
  onOptionsPress,
  isSelected = false,
  isSelectionMode = false,
}: FolderCardProps) {
  const { colors } = useTheme();

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
        <Feather name="folder" size={20} color={colors.primary} />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {folder.name}
        </Text>
      </View>

      {!isSelectionMode && (
        <>
          {onOptionsPress && (
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={onOptionsPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <Feather name="more-vertical" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
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
    width: 40,
    height: 40,
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
  },
  optionsButton: {
    padding: 6,
    marginRight: 4,
  },
});
