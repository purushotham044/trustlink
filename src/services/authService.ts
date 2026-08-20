// ============================================================
// TrustLink — Authentication Service
//
// All auth flows through Supabase Auth.
// No custom password management.
// No manual JWT handling.
// Google OAuth via Supabase + expo-web-browser.
// Automatically records user security audit logs to PostgreSQL.
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

// ── Helper: Audit Event Logging ───────────────────────────────

async function logAuthAudit(action: 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_REGISTERED', userId?: string, metadata?: Record<string, unknown>) {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return;

    await supabase.from('audit_logs').insert({
      user_id: targetUserId,
      action,
      metadata: metadata || {},
    });
  } catch (e) {
    // Non-blocking
  }
}

// ── Email Authentication ──────────────────────────────────────

/**
 * Register a new user with email and password.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
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

  if (data?.user?.id) {
    await logAuthAudit('USER_REGISTERED', data.user.id, { email: cleanEmail, full_name: fullName.trim() });
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
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.user?.id) {
    await logAuthAudit('USER_LOGIN', data.user.id, { method: 'email_password', email: cleanEmail });
  }

  return { success: true };
}

// ── Google OAuth ──────────────────────────────────────────────

/**
 * Initiate Google OAuth via Supabase.
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
    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        return { success: false, error: sessionError.message };
      }
      if (sessionData?.user?.id) {
        await logAuthAudit('USER_LOGIN', sessionData.user.id, { method: 'google_oauth' });
      }
      return { success: true };
    }

    const qParams = url.searchParams;
    const qAccessToken = qParams.get('access_token');
    const qRefreshToken = qParams.get('refresh_token');
    if (qAccessToken && qRefreshToken) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: qAccessToken,
        refresh_token: qRefreshToken,
      });
      if (sessionError) {
        return { success: false, error: sessionError.message };
      }
      if (sessionData?.user?.id) {
        await logAuthAudit('USER_LOGIN', sessionData.user.id, { method: 'google_oauth' });
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
 * Sign out — logs event and clears session from secure store.
 */
export async function signOut(): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (user?.user?.id) {
    await logAuthAudit('USER_LOGOUT', user.user.id);
  }
  await supabase.auth.signOut();
}
