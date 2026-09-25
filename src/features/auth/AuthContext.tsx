import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { AuthSession, AuthResult, PlayerProfile, PlayerProgress } from './types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authRepository } from '@/services/backend/authRepository';
import { profileRepository, progressRepository } from '@/services/backend/profileRepository';

export type PlayerLoadState = 'idle' | 'loading' | 'ready' | 'missing-profile' | 'error';

interface Value {
  session: AuthSession | null;
  user: AuthSession['user'] | null;
  profile: PlayerProfile | null;
  progress: PlayerProgress | null;
  loading: boolean;
  authError: boolean;
  playerState: PlayerLoadState;
  playerLoading: boolean;
  configured: boolean;
  refreshAuth: () => Promise<void>;
  refreshPlayer: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<AuthResult>;
  signUpWithEmail: (e: string, p: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
}

const AuthContext = createContext<Value | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerLoadState>('idle');
  const playerRequest = useRef<Promise<void> | null>(null);
  const playerGeneration = useRef(0);

  const refreshAuth = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    setAuthError(false);
    const { data, error } = await supabase.auth.getSession();
    if (error) { setAuthError(true); setLoading(false); return; }
    setSession(data.session as AuthSession | null);
    setLoading(false);
  }, []);

  const refreshPlayer = useCallback((): Promise<void> => {
    if (playerRequest.current) return playerRequest.current;
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null); setProgress(null); setPlayerState('idle');
      return Promise.resolve();
    }
    const generation = ++playerGeneration.current;
    setPlayerState('loading');
    const request = Promise.all([profileRepository.get(userId), progressRepository.get(userId)])
      .then(([nextProfile, nextProgress]) => {
        if (generation !== playerGeneration.current) return;
        setProfile(nextProfile); setProgress(nextProgress);
        setPlayerState(nextProfile ? 'ready' : 'missing-profile');
      })
      .catch(() => {
        if (generation === playerGeneration.current) setPlayerState('error');
      })
      .finally(() => { if (playerRequest.current === request) playerRequest.current = null; });
    playerRequest.current = request;
    return request;
  }, [session?.user.id]);

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, next: unknown) => {
      if (!mounted) return;
      authEventReceived = true;
      setSession(next as AuthSession | null);
      setAuthError(false);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data, error }: { data: { session: unknown }; error: unknown }) => {
      if (!mounted || authEventReceived) return;
      if (error) setAuthError(true);
      else setSession(data.session as AuthSession | null);
      setLoading(false);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    playerGeneration.current += 1;
    playerRequest.current = null;
    void refreshPlayer();
  }, [refreshPlayer]);

  const value = useMemo<Value>(() => ({
    session, user: session?.user ?? null, profile, progress, loading, authError,
    playerState, playerLoading: playerState === 'loading', configured: isSupabaseConfigured,
    refreshAuth, refreshPlayer,
    signInWithEmail: authRepository.signInWithEmail,
    signUpWithEmail: authRepository.signUpWithEmail,
    signInWithGoogle: () => authRepository.signInWithOAuthProvider('google'),
    signOut: authRepository.signOut,
  }), [session, profile, progress, loading, authError, playerState, refreshAuth, refreshPlayer]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Value {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
