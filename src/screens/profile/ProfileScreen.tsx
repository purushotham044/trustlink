// ============================================================
// TrustLink — Professional Security & Profile Screen (Responsive)
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/common/Button';
import { HowItWorksModal } from '@/components/common/HowItWorksModal';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const { theme, isDark, colors, toggleTheme } = useTheme();
  const [explainerVisible, setExplainerVisible] = useState(false);

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? '—';
  const memberDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <Feather name="shield" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>{email}</Text>

        <View style={[styles.badge, { backgroundColor: colors.successMuted }]}>
          <Feather name="check" size={12} color={colors.success} />
          <Text style={[styles.badgeText, { color: colors.success }]}>Authenticated Session</Text>
        </View>
      </View>

      {/* Sleek Compact Appearance Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Feather name="sliders" size={14} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Appearance & Theme</Text>
        </View>

        <View style={styles.themeRow}>
          <View style={styles.themeInfo}>
            <Feather name={isDark ? 'moon' : 'sun'} size={18} color={isDark ? '#F59E0B' : colors.primary} />
            <Text style={[styles.themeModeTitle, { color: colors.textPrimary }]}>
              {isDark ? 'Dark Mode (Cyber Obsidian)' : 'Light Mode (Executive Slate)'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.compactToggleBtn,
              { backgroundColor: colors.surfaceHighlight, borderColor: colors.primary + '50' },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.75}
          >
            <Feather name={isDark ? 'sun' : 'moon'} size={14} color={colors.primary} />
            <Text style={[styles.compactToggleText, { color: colors.primary }]}>
              {isDark ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Guide Trigger Card */}
      <TouchableOpacity
        style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.primary }]}
        onPress={() => setExplainerVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.guideLeft}>
          <Feather name="help-circle" size={20} color={colors.primary} />
          <View>
            <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>How TrustLink Works</Text>
            <Text style={[styles.guideSubtitle, { color: colors.textMuted }]}>Store → Fingerprint → Blockchain Proof → Verify</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Account Details Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Feather name="user" size={14} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Account Profile</Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Display Name</Text>
          <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{displayName}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Email</Text>
          <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{email}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Registered</Text>
          <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{memberDate}</Text>
        </View>
      </View>

      {/* Security Architecture Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Feather name="lock" size={14} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Security Architecture</Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Authentication</Text>
          <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
            {user?.app_metadata?.provider === 'google' ? 'Google OAuth 2.0' : 'Email + Password'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Credential Vault</Text>
          <Text style={[styles.rowValue, { color: colors.textPrimary }]}>Platform SecureStore</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Database Access</Text>
          <Text style={[styles.rowValue, { color: colors.textPrimary }]}>PostgreSQL RLS (Row Level Security)</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Blockchain Proof Network</Text>
          <Text style={[styles.rowValue, { color: colors.blockchain }]}>Ethereum Sepolia</Text>
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

      {/* How It Works Explainer Modal */}
      <HowItWorksModal
        visible={explainerVisible}
        onClose={() => setExplainerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md + 2,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 2,
  },
  email: {
    fontSize: TYPOGRAPHY.xs,
    marginBottom: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  themeModeTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
  },
  compactToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  compactToggleText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  guideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  guideTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
  },
  guideSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
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
  },
  rowValue: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  actionContainer: {
    marginTop: SPACING.sm,
  },
});
