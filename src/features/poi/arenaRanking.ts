export interface LeaderboardEntry { id: string; name: string; points: number; isPlayer?: boolean; rank: number }
export interface SeededCompetitor { id: string; name: string; points: number }

export const SEEDED_COMPETITORS: readonly SeededCompetitor[] = [
  { id: 'mariana', name: 'Mariana', points: 4920 },
  { id: 'lucas', name: 'Lucas', points: 4480 },
  { id: 'bruno', name: 'Bruno', points: 3910 },
  { id: 'camila', name: 'Camila', points: 2860 },
  { id: 'diego', name: 'Diego', points: 2380 },
  { id: 'bia', name: 'Bia', points: 1320 },
];

export function buildLeaderboard(playerPoints: number, competitors = SEEDED_COMPETITORS): LeaderboardEntry[] {
  return [...competitors.map((entry) => ({ ...entry, isPlayer: false })), { id: 'player', name: 'Rodolfo', points: playerPoints, isPlayer: true }]
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function isoWeekId(date = new Date()): string {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((value.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${value.getUTCFullYear()}-W${week.toString().padStart(2, '0')}`;
}
