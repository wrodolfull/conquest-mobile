import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { ExplorationSummary } from '@/features/exploration/explorationRules';

const KEY = 'conquest.exploration-summary.v1';
let latest: ExplorationSummary | null | undefined;
const listeners = new Set<(value: ExplorationSummary | null) => void>();

async function fetchSummary(): Promise<ExplorationSummary | null> {
  try {
    const { data, error } = await supabase.rpc('get_my_exploration_summary');
    if (error) throw error;
    if (!data || typeof data !== 'object') return null;
    const value = { ...(data as Omit<ExplorationSummary, 'source'>), source: 'server' as const };
    await AsyncStorage.setItem(KEY, JSON.stringify(value));
    return value;
  } catch {
    const cached = await AsyncStorage.getItem(KEY);
    return cached ? { ...(JSON.parse(cached) as ExplorationSummary), source: 'cache' } : null;
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
