import { supabase } from '@/lib/supabase';
import type { FriendsLeaderboardEntry } from '@/features/social/types';
import type { RankingScope, WeeklyRankingPage } from '@/features/ranking/types';

export const RANKING_PAGE_SIZE = 20;

export const leaderboardRepository = {
  async getFriendsWeekly(): Promise<FriendsLeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('get_my_friends_weekly_leaderboard');
    if (error) throw new Error('Friends leaderboard is unavailable.');
    return data as FriendsLeaderboardEntry[];
  },
  async getWeekly(scope: RankingScope, cursor: number | null = null): Promise<WeeklyRankingPage> {
    const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
      p_scope: scope,
      p_limit: RANKING_PAGE_SIZE,
      p_after_rank: cursor,
    });
    if (error) throw new Error('Weekly ranking is unavailable.');
    return data as WeeklyRankingPage;
  },
};
