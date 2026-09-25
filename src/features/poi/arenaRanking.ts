export interface LeaderboardEntry { id:string; name:string; points:number; isPlayer:boolean; rank:number }
export function isoWeekId(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
/** Arena competition is intentionally unavailable until a server-authoritative economy exists. */
export function buildLeaderboard(_playerPoints = 0):LeaderboardEntry[]{return []}
