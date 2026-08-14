// ============================================================
// TrustLink — Auth Navigator (Login / Register Stack)
// ============================================================

import React, { useState } from 'react';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';

export function AuthNavigator() {
  const [screen, setScreen] = useState<'login' | 'register'>('login');

  if (screen === 'register') {
    return <RegisterScreen onNavigateToLogin={() => setScreen('login')} />;
  }
  return <LoginScreen onNavigateToRegister={() => setScreen('register')} />;
}
