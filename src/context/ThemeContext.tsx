// ============================================================
// TrustLink Mobile — Theme Context (Light & Dark Mode)
// Persisted in SecureStore with real-time color token switching
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants';

export type ThemeMode = 'light' | 'dark';
export type ColorTheme = Record<keyof typeof LIGHT_COLORS, string>;

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ColorTheme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'trustlink_mobile_theme';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved);
      }
    } catch (e) {
      // ignore storage error
    }
  };

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch (e) {
      // ignore storage error
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  const isDark = theme === 'dark';
  const colors: ColorTheme = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
