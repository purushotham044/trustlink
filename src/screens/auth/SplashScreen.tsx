// ============================================================
// TrustLink — Splash Screen
//
// Shown at app startup while session is being restored.
// Routes to Login if unauthenticated, Dashboard if authenticated.
// ============================================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants';

interface SplashScreenProps {
  onReady: (isAuthenticated: boolean) => void;
  initialized: boolean;
  isAuthenticated: boolean;
}

export function SplashScreen({ onReady, initialized, isAuthenticated }: SplashScreenProps) {
  useEffect(() => {
    if (initialized) {
      // Small delay for polish
      const timer = setTimeout(() => {
        onReady(isAuthenticated);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [initialized, isAuthenticated, onReady]);

  return (
    <View style={styles.container}>
      {/* Logo mark */}
      <View style={styles.logoContainer}>
        <View style={styles.logoRing}>
          <View style={styles.logoInner}>
            <Text style={styles.logoIcon}>🔐</Text>
          </View>
        </View>
        <Text style={styles.logoText}>TRUSTLINK</Text>
        <Text style={styles.tagline}>Blockchain-Backed Document Integrity</Text>
      </View>

      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Verifying session...</Text>
      </View>

      {/* Bottom decoration */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secured with SHA-256 + Blockchain</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  } as ViewStyle,

  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  } as ViewStyle,

  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.primaryMuted,
  } as ViewStyle,

  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  logoIcon: {
    fontSize: 36,
  } as TextStyle,

  logoText: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    letterSpacing: 6,
    marginBottom: SPACING.sm,
  } as TextStyle,

  tagline: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  } as TextStyle,

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,

  loadingText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
  } as TextStyle,

  footer: {
    position: 'absolute',
    bottom: SPACING.xxxl,
  } as ViewStyle,

  footerText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  } as TextStyle,
});
