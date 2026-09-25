import type { WeeklyRankingEntry } from './types';

export function mergeRankingEntries(current: WeeklyRankingEntry[], incoming: WeeklyRankingEntry[]): WeeklyRankingEntry[] {
  const seen = new Set(current.map((entry) => entry.userId));
  const unique = incoming.filter((entry) => {
    if (seen.has(entry.userId)) return false;
    seen.add(entry.userId);
    return true;
  });
  return [...current, ...unique];
}

export function isCurrentRankingRequest(requestGeneration: number, currentGeneration: number): boolean {
  return requestGeneration === currentGeneration;
}
