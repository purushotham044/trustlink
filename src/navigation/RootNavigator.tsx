// ============================================================
// TrustLink — Root Navigator
//
// The security gate of the application.
// Controls routing between:
//   - Splash (session restoring)
//   - Auth  (unauthenticated)
//   - Main  (authenticated)
//
// The mobile app is NEVER the security boundary —
// Supabase RLS enforces authorization at the database/storage layer.
// This navigator only controls UX routing.
// ============================================================

import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/screens/auth/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export function RootNavigator() {
  const { user, initialized } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashReady = useCallback(() => {
    setSplashDone(true);
  }, []);

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
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
