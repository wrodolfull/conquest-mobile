import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PoiProvider } from '@/features/poi/PoiContext';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { activeActivityRepository } from '@/services/storage/activeActivityRepository';
import { CONQUEST_OUTDOOR_LOCATION_TASK } from '@/services/location/backgroundLocationTask';

export default function RootLayout() {
  useEffect(() => { void (async () => {
    const session = await activeActivityRepository.get();
    if (session?.status !== 'active') return;
    try {
      const registered = await Location.hasStartedLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK);
      // A force-stopped process can retain a task registration while delivering
      // no locations. A stale durable heartbeat catches that case on relaunch.
      const stale = Date.now() - session.updatedAt > 2 * 60_000;
      if (!registered || stale) await activeActivityRepository.markInterrupted(session.id);
    } catch {
      await activeActivityRepository.markInterrupted(session.id);
    }
  })(); }, []);
  return (
    <PoiProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#07100E' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="activity/select" />
        <Stack.Screen name="activity/active" />
        <Stack.Screen name="activity/results" />
        <Stack.Screen name="poi/[id]" />
      </Stack>
    </PoiProvider>
  );
}
