// ============================================================
// TrustLink — Root Navigator
//
// Controls routing between Splash, Auth, and Main navigation
// with full dynamic theme support for React Navigation container
// ============================================================

import React, { useState, useCallback } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { SplashScreen } from '@/screens/auth/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export function RootNavigator() {
  const { user, initialized } = useAuth();
  const { colors, isDark } = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashReady = useCallback(() => {
    setSplashDone(true);
  }, []);

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: DefaultTheme.fonts,
  };

  // Show splash until auth is initialized and splash animation completes
  if (!splashDone) {
    return (
      <SplashScreen
        onReady={handleSplashReady}
        initialized={initialized}
        isAuthenticated={!!user}
      />
    );
  }

  const isAuthenticated = !!user;

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
