// ============================================================
// TrustLink — useAuth Hook
//
// Centralized authentication state.
// Listens to Supabase auth state changes.
// Exposes: user, session, profile, loading state, and auth actions.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as authService from '@/services/authService';
import type { UserProfile } from '@/types';

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ── Fetch user profile from DB ──────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    }
  }, []);

  // ── Listen to auth state changes ─────────────────────────────
  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setInitialized(true);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
        setInitialized(true);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Auth actions ─────────────────────────────────────────────

  const handleSignUp = useCallback(async (
    email: string,
    password: string,
    fullName: string
  ) => {
    setLoading(true);
    try {
      return await authService.signUpWithEmail(email, password, fullName);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      return await authService.signInWithEmail(email, password);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    try {
      return await authService.signInWithGoogle();
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    try {
      await authService.signOut();
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    session,
    profile,
    loading,
    initialized,
    signUpWithEmail: handleSignUp,
    signInWithEmail: handleSignIn,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
  };
}
