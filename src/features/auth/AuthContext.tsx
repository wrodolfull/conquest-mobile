import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { AuthSession, AuthResult, PlayerProfile, PlayerProgress } from './types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authRepository } from '@/services/backend/authRepository';
import { profileRepository, progressRepository } from '@/services/backend/profileRepository';

interface Value { session: AuthSession | null; user: AuthSession['user'] | null; profile: PlayerProfile | null; progress: PlayerProgress | null; loading: boolean; playerLoading:boolean; configured: boolean; refreshPlayer: () => Promise<void>; signInWithEmail: (e:string,p:string)=>Promise<AuthResult>; signUpWithEmail:(e:string,p:string)=>Promise<AuthResult>; signInWithGoogle:()=>Promise<AuthResult>; signOut:()=>Promise<AuthResult> }
const AuthContext = createContext<Value | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null); const [profile, setProfile] = useState<PlayerProfile | null>(null); const [progress, setProgress] = useState<PlayerProgress | null>(null); const [loading, setLoading] = useState(true); const [playerLoading,setPlayerLoading]=useState(false);
  const refreshPlayer = useCallback(async () => { if (!session?.user.id) { setProfile(null); setProgress(null); setPlayerLoading(false); return; } setPlayerLoading(true); try { const [nextProfile, nextProgress] = await Promise.all([profileRepository.get(session.user.id), progressRepository.get(session.user.id)]); setProfile(nextProfile); setProgress(nextProgress); } catch { setProfile(null); setProgress(null); } finally {setPlayerLoading(false);} }, [session?.user.id]);
  useEffect(() => { let mounted = true; if (!isSupabaseConfigured) { setLoading(false); return; } void supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => { if (mounted) { setSession(data.session as AuthSession | null); setLoading(false); } }); const { data } = supabase.auth.onAuthStateChange((_event: string, next: unknown) => { setSession(next as AuthSession | null); }); return () => { mounted = false; data.subscription.unsubscribe(); }; }, []);
  useEffect(() => { void refreshPlayer(); }, [refreshPlayer]);
  const value = useMemo<Value>(() => ({ session, user: session?.user ?? null, profile, progress, loading, playerLoading, configured: isSupabaseConfigured, refreshPlayer, signInWithEmail: authRepository.signInWithEmail, signUpWithEmail: authRepository.signUpWithEmail, signInWithGoogle: () => authRepository.signInWithOAuthProvider('google'), signOut: authRepository.signOut }), [session, profile, progress, loading, playerLoading, refreshPlayer]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(): Value { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }
