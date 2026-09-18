import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PoiProvider } from '@/features/poi/PoiContext';

export default function RootLayout() {
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
