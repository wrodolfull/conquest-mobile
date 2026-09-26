import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(url && publishableKey);

// The non-secret fallback keeps local GPS recording and the auth setup screen
// operable before an environment is configured. No remote call is attempted then.
export const supabase = createClient(url ?? 'https://unconfigured.invalid', publishableKey ?? 'unconfigured', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
});

if (Platform.OS !== 'web') AppState.addEventListener('change', (state) => {
  if (!isSupabaseConfigured) return;
  if (state === 'active') supabase.auth.startAutoRefresh(); else supabase.auth.stopAutoRefresh();
});
