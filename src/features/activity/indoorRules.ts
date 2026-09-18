export interface CompletedIndoorActivity {
  id: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  trainingPower: number;
  xpEarned: number;
  energyEarned: number;
  arenaId?: string;
  arenaName?: string;
  arenaPointsEarned: number;
  arenaWeeklyTotal?: number;
  arenaWeeklyRank?: number;
}
