// ============================================================
// TrustLink — Supabase Client
//
// Security rules:
//   - Only EXPO_PUBLIC_* vars are used here (safe for client)
//   - expo-secure-store is used for session persistence
//   - NEVER use service_role key here
// ============================================================

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[TrustLink] Missing Supabase environment variables.\n' +
    'Copy .env.example to .env and fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// ── Secure Storage Adapter ───────────────────────────────────
// Supabase session tokens are stored in expo-secure-store (device keychain/keystore)
// NOT in AsyncStorage, which is unencrypted.
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// ── Supabase Client ──────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // handled manually via deep link in React Native
  },
});
