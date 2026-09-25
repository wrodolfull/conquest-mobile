export type RankingScope = 'friends' | 'city' | 'global';
export type WeeklyRankingCursor = number;

export interface WeeklyRankingEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  distanceMeters: number;
  weeklyInfluence: number;
  newZones: number;
  isMe: boolean;
}

export interface MyWeeklyRankingEntry extends Omit<WeeklyRankingEntry, 'rank'> {
  rank: number | null;
  listed: boolean;
}

export interface WeeklyRankingPage {
  scope: RankingScope;
  scopeLabel: string;
  weekStart: string;
  weekEnd: string;
  cityAvailable: boolean;
  entries: WeeklyRankingEntry[];
  nextCursor: WeeklyRankingCursor | null;
  myEntry: MyWeeklyRankingEntry;
}
