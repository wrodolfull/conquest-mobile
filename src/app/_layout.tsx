import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { PoiProvider } from '@/features/poi/PoiContext';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { activeActivityRepository } from '@/services/storage/activeActivityRepository';
import { CONQUEST_OUTDOOR_LOCATION_TASK } from '@/services/location/backgroundLocationTask';
import { colors } from '@/theme';
import { activitySyncService } from '@/services/backend/activitySyncService';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

const INTERRUPTION_GRACE_MS = 5 * 60_000;

function RecoverableBootError({ retry, retrying }: { retry: () => void; retrying: boolean }) {
  return <View style={styles.error}>
    <Text style={styles.title}>RUQEST COULDN&apos;T CONNECT</Text>
    <Text style={styles.message}>Your session and locally recorded activities are still safe. Check your connection and try again.</Text>
    <Pressable accessibilityRole="button" disabled={retrying} onPress={retry} style={[styles.button, retrying && styles.buttonDisabled]}>
      {retrying ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>TRY AGAIN</Text>}
    </Pressable>
  </View>;
}

function Navigation() {
  const { loading, authError, playerState, profile, session, refreshAuth, refreshPlayer } = useAuth();
  const segments = useSegments();
  useEffect(() => {
    void (async () => {
      try {
        const active = await activeActivityRepository.get();
        if (active?.status !== 'active' || Date.now() - active.updatedAt <= INTERRUPTION_GRACE_MS) return;
        const registered = await Location.hasStartedLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK);
        if (!registered) await activeActivityRepository.markInterrupted(active.id);
      } catch (error) {
        // A native/SQLite startup race is not proof that recording stopped. Keep
        // the durable session recoverable and let the activity screen re-check it.
        if (__DEV__) console.warn('[Activity recovery] Startup health check unavailable.', String(error));
      }
    })();
  }, []);
  useEffect(() => {
    if (!session?.user.id) return;
    const userId = session.user.id;
    const sync = () => void activitySyncService.syncPending(userId).then((synced) => { if (synced) void refreshPlayer(); });
    sync();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') sync(); });
    return () => subscription.remove();
  }, [session?.user.id, refreshPlayer]);

  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.lime} /></View>;
  if (authError) return <RecoverableBootError retry={() => void refreshAuth()} retrying={loading} />;
  const inAuth = segments[0] === '(auth)' || segments[0] === 'auth';
  const inOnboarding = segments[0] === 'onboarding';
  if (!session && !inAuth) return <Redirect href="/(auth)/sign-in" />;
  if (session && playerState === 'loading') return <View style={styles.loading}><ActivityIndicator color={colors.lime} /></View>;
  if (session && playerState === 'error') return <RecoverableBootError retry={() => void refreshPlayer()} retrying={false} />;
  if (session && playerState === 'missing-profile' && !inOnboarding) return <Redirect href="/onboarding" />;
  if (session && playerState === 'ready' && !profile?.onboarding_completed && !inOnboarding) return <Redirect href="/onboarding" />;
  if (session && profile?.onboarding_completed && (inAuth || inOnboarding)) return <Redirect href="/map" />;
  return <PoiProvider><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} /></PoiProvider>;
}

export default function RootLayout() {
  return <AppErrorBoundary><AuthProvider><Navigation /></AuthProvider></AppErrorBoundary>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  message: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 12, textAlign: 'center' },
  button: { minWidth: 150, alignItems: 'center', marginTop: 24, borderRadius: 12, padding: 14, backgroundColor: colors.lime },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.background, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
