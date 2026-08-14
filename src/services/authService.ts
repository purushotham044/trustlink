// ============================================================
// TrustLink — Authentication Service
//
// All auth flows through Supabase Auth.
// No custom password management.
// No manual JWT handling.
// Google OAuth via Supabase + expo-web-browser.
// ============================================================

import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// Required for expo-web-browser OAuth flow on Android
WebBrowser.maybeCompleteAuthSession();

// ── Types ─────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  error?: string;
}

// ── Email Authentication ──────────────────────────────────────

/**
 * Register a new user with email and password.
 * Supabase handles password hashing — we never store passwords ourselves.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ── Google OAuth ──────────────────────────────────────────────

/**
 * Initiate Google OAuth via Supabase.
 *
 * Flow:
 *   1. Generate redirect URI using app's trustlink:// scheme
 *   2. Get OAuth URL from Supabase
 *   3. Open browser for user sign-in
 *   4. Supabase handles the callback and sets the session
 *
 * Security: OAuth secrets live only in Supabase — never in this app.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectUri = makeRedirectUri({
    scheme: 'trustlink',
    path: 'auth/callback',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return { success: false, error: error?.message ?? 'Failed to initiate Google sign-in' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === 'success' && result.url) {
    // Extract tokens from the callback URL and set the session
    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        return { success: false, error: sessionError.message };
      }
      return { success: true };
    }

    // Some providers use query params instead of hash
    const qParams = url.searchParams;
    const qAccessToken = qParams.get('access_token');
    const qRefreshToken = qParams.get('refresh_token');
    if (qAccessToken && qRefreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: qAccessToken,
        refresh_token: qRefreshToken,
      });
      if (sessionError) {
        return { success: false, error: sessionError.message };
      }
      return { success: true };
    }

    return { success: false, error: 'OAuth callback did not return tokens' };
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { success: false, error: 'Sign-in was cancelled' };
  }

  return { success: false, error: 'Google sign-in failed' };
}

// ── Session ───────────────────────────────────────────────────

/**
 * Get the current session (restored from expo-secure-store).
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get the current authenticated user.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Sign out — clears session from secure store.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
