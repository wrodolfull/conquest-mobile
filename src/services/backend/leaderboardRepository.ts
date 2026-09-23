import { supabase } from '@/lib/supabase';
import type { FriendsLeaderboardEntry } from '@/features/social/types';

export const leaderboardRepository={async getFriendsWeekly():Promise<FriendsLeaderboardEntry[]>{const{data,error}=await supabase.rpc('get_my_friends_weekly_leaderboard');if(error)throw new Error('Friends leaderboard is unavailable.');return data as FriendsLeaderboardEntry[]}};
