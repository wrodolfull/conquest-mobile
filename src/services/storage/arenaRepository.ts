import { buildLeaderboard, isoWeekId, type LeaderboardEntry } from '@/features/poi/arenaRanking';

export interface ArenaWorkoutContribution { id: string; arenaId: string; weekId: string; points: number; completedAt: number }
export interface ArenaRepository {
  getWeeklyScore(arenaId: string, weekId?: string): Promise<number>;
  addPoints(arenaId: string, points: number, workoutId: string, completedAt?: number): Promise<number>;
  getLeaderboard(arenaId: string, weekId?: string): Promise<LeaderboardEntry[]>;
  getRecentActivity(arenaId: string, limit?: number): Promise<ArenaWorkoutContribution[]>;
  subscribe(listener: () => void): () => void;
}

// Kept behind an interface so durable AsyncStorage can replace this adapter without
// changing gameplay or screens. The current dependency set has no durable KV module.
const scores = new Map<string, number>();
const workouts: ArenaWorkoutContribution[] = [];
const listeners = new Set<() => void>();
const key = (arenaId: string, weekId: string) => `${arenaId}:${weekId}`;

export const arenaRepository: ArenaRepository = {
  async getWeeklyScore(arenaId, weekId = isoWeekId()) { return scores.get(key(arenaId, weekId)) ?? 0; },
  async addPoints(arenaId, points, workoutId, completedAt = Date.now()) {
    const safePoints = Math.max(0, Math.round(points));
    const weekId = isoWeekId(new Date(completedAt));
    const scoreKey = key(arenaId, weekId);
    if (safePoints > 0 && !workouts.some((item) => item.id === workoutId)) {
      workouts.unshift({ id: workoutId, arenaId, weekId, points: safePoints, completedAt });
      scores.set(scoreKey, (scores.get(scoreKey) ?? 0) + safePoints);
      listeners.forEach((listener) => listener());
    }
    return scores.get(scoreKey) ?? 0;
  },
  async getLeaderboard(arenaId, weekId = isoWeekId()) { return buildLeaderboard(scores.get(key(arenaId, weekId)) ?? 0); },
  async getRecentActivity(arenaId, limit = 5) { return workouts.filter((item) => item.arenaId === arenaId).slice(0, limit); },
  subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
};
