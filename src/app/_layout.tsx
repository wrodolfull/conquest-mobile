import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { PoiProvider } from '@/features/poi/PoiContext';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { activeActivityRepository } from '@/services/storage/activeActivityRepository';
import { CONQUEST_OUTDOOR_LOCATION_TASK } from '@/services/location/backgroundLocationTask';
import { colors } from '@/theme';
import { activitySyncService } from '@/services/backend/activitySyncService';

function Navigation() {
  const { loading, playerLoading, profile, session, refreshPlayer } = useAuth(); const segments = useSegments();
  useEffect(() => { void (async () => { const active = await activeActivityRepository.get(); if (active?.status !== 'active') return; try { const registered = await Location.hasStartedLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK); if (!registered || Date.now() - active.updatedAt > 120_000) await activeActivityRepository.markInterrupted(active.id); } catch { await activeActivityRepository.markInterrupted(active.id); } })(); }, []);
  useEffect(() => { if (!session?.user.id) return; const sync = () => void activitySyncService.syncPending(session.user.id).then(refreshPlayer); sync(); const subscription = AppState.addEventListener('change', state => { if (state === 'active') sync(); }); return () => subscription.remove(); }, [session?.user.id, refreshPlayer]);
  if (loading || (session && playerLoading)) return <View style={styles.loading}><ActivityIndicator color={colors.lime}/></View>;
  const inAuth = segments[0] === '(auth)' || segments[0] === 'auth';
  const inOnboarding=segments[0]==='onboarding';
  if (!session && !inAuth) return <Redirect href="/(auth)/sign-in"/>;
  if(session&&!profile)return <View style={styles.loading}><ActivityIndicator color={colors.lime}/></View>;
  if(session&&!profile?.onboarding_completed&&!inOnboarding)return <Redirect href="/onboarding"/>;
  if(session&&profile?.onboarding_completed&&(inAuth||inOnboarding))return <Redirect href="/map"/>;
  return <PoiProvider><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background}}}/></PoiProvider>;
}
export default function RootLayout(){ return <AuthProvider><Navigation/></AuthProvider>; }
const styles=StyleSheet.create({loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background}});
