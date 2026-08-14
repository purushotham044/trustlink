// ============================================================
// TrustLink — Professional Security & Profile Screen
// ============================================================

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';

export function ProfileScreen() {
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? '—';
  const memberDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Feather name="shield" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.badge}>
          <Feather name="check" size={12} color={COLORS.success} />
          <Text style={styles.badgeText}>Authenticated Session</Text>
        </View>
      </View>

      {/* Account Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="user" size={14} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Account Profile</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Display Name</Text>
          <Text style={styles.rowValue}>{displayName}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{email}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Registered</Text>
          <Text style={styles.rowValue}>{memberDate}</Text>
        </View>
      </View>

      {/* Security Architecture Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="lock" size={14} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Security Architecture</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Authentication</Text>
          <Text style={styles.rowValue}>
            {user?.app_metadata?.provider === 'google' ? 'Google OAuth 2.0' : 'Email + Password'}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Credential Vault</Text>
          <Text style={styles.rowValue}>Platform SecureStore</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Database Access</Text>
          <Text style={styles.rowValue}>PostgreSQL RLS</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Blockchain Network</Text>
          <Text style={[styles.rowValue, { color: COLORS.blockchain }]}>Ethereum Sepolia</Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <View style={styles.actionContainer}>
        <Button
          label="Sign Out"
          onPress={signOut}
          variant="danger"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  email: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
  },
  rowLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  rowValue: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  actionContainer: {
    marginTop: SPACING.md,
  },
});
