export const WEEKLY_OBJECTIVES = [
  { key: 'explorer', title: 'Explorer', unit: 'zones', target: 3, coins: 25 },
  { key: 'influence', title: 'Influence', unit: 'influence', target: 25, coins: 25 },
  { key: 'distance', title: 'Distance', unit: 'meters', target: 5_000, coins: 50 },
] as const;

export type WeeklyObjectiveKey = typeof WEEKLY_OBJECTIVES[number]['key'];

export interface ZoneDiscovery { territoryId: string; territoryName: string }
export interface CompletedObjective { key: WeeklyObjectiveKey; title: string; coins: number }
export interface ExplorationStats {
  totalZonesDiscovered: number;
  newZonesThisWeek: number;
  zonesControlled: number;
  totalInfluence: number;
}
export interface Achievement { key: string; title: string; description: string; unlockedAt: string }
export interface ObjectiveProgress { key: WeeklyObjectiveKey; title: string; progress: number; target: number; coins: number; rewardedAt: string | null }
export interface ExplorationSummary extends ExplorationStats {
  weekStart: string;
  weekEnd: string;
  coins: number;
  achievements: Achievement[];
  objectives: ObjectiveProgress[];
  source: 'server' | 'cache';
}
