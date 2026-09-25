/* eslint-disable import/no-unresolved -- Expo/native packages resolve in the development build. */
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AuthResult } from '@/features/auth/types';

WebBrowser.maybeCompleteAuthSession();
const friendly = (message: string): string => {
  const text = message.toLowerCase();
  if (text.includes('invalid login')) return 'Email or password is incorrect.';
  if (text.includes('already registered')) return 'An account already exists for this email.';
  if (text.includes('network') || text.includes('fetch')) return 'Ruqest could not reach the server. Try again when connected.';
  return 'Authentication could not be completed. Please try again.';
};
export type OAuthProvider = 'google'; // Add 'apple' here when Apple Sign In ships.
export const authRepository = {
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured) return { ok: false, message: 'Ruqest services are unavailable in this build. Please contact the beta team.' };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { ok: false, message: friendly(error.message) } : { ok: true };
  },
  async signUpWithEmail(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured) return { ok: false, message: 'Ruqest services are unavailable in this build. Please contact the beta team.' };
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    return error ? { ok: false, message: friendly(error.message) } : { ok: true, message: 'Account created. Check your email if confirmation is enabled.' };
  },
  async signInWithOAuthProvider(provider: OAuthProvider): Promise<AuthResult> {
    if (!isSupabaseConfigured) return { ok: false, message: 'Ruqest services are unavailable in this build. Please contact the beta team.' };
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
    if (error || !data.url) return { ok: false, message: friendly(error?.message ?? 'OAuth URL missing') };
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return { ok: false, message: result.type === 'cancel' ? 'Google sign-in was cancelled.' : 'Google sign-in could not be completed.' };
    const parsed = Linking.parse(result.url); const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : undefined;
    if (!code) return { ok: false, message: 'The provider returned an invalid sign-in response.' };
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return exchangeError ? { ok: false, message: friendly(exchangeError.message) } : { ok: true };
  },
  async signOut(): Promise<AuthResult> { const { error } = await supabase.auth.signOut(); return error ? { ok: false, message: friendly(error.message) } : { ok: true }; },
};
