export interface LeaderboardEntry { id:string; name:string; points:number; isPlayer:boolean; rank:number }
/** Arena competition is intentionally unavailable until a server-authoritative economy exists. */
export function buildLeaderboard():LeaderboardEntry[]{return []}
