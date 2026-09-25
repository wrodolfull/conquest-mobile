import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { ExplorationSummary } from '@/features/exploration/explorationRules';
import { parseCachedJson } from '@/services/storage/cacheJson';

const KEY = 'conquest.exploration-summary.v1';
let latest: ExplorationSummary | null | undefined;
const listeners = new Set<(value: ExplorationSummary | null) => void>();

async function fetchSummary(): Promise<ExplorationSummary | null> {
  try {
    const { data, error } = await supabase.rpc('get_my_exploration_summary');
    if (error) throw error;
    if (!data || typeof data !== 'object') return null;
    const value = { ...(data as Omit<ExplorationSummary, 'source'>), source: 'server' as const };
    try { await AsyncStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Keep valid server data even if the presentation cache cannot be written. */ }
    return value;
  } catch {
    try {
      const cached = await AsyncStorage.getItem(KEY);
      const value = cached ? parseCachedJson(cached, (candidate): candidate is ExplorationSummary => Boolean(candidate) && typeof candidate === 'object') : undefined;
      return value ? { ...value, source: 'cache' } : null;
    } catch { return null; }
  }
}

export const explorationRepository = {
  getLatest: () => latest,
  async refresh() {
    latest = await fetchSummary();
    listeners.forEach(listener => listener(latest ?? null));
    return latest;
  },
  subscribe(listener: (value: ExplorationSummary | null) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
