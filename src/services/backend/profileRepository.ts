import { supabase } from '@/lib/supabase';
import type { PlayerProfile, PlayerProgress } from '@/features/auth/types';

export const profileRepository = {
  async get(userId: string): Promise<PlayerProfile | null> {
    const { data, error } = await supabase.from('profiles').select('id,username,display_name,avatar_url').eq('id', userId).maybeSingle();
    if (error) throw error; return data as PlayerProfile | null;
  },
};
export const progressRepository = {
  async get(userId: string): Promise<PlayerProgress | null> {
    const { data, error } = await supabase.from('player_progress').select('user_id,level,xp,energy,coins').eq('user_id', userId).maybeSingle();
    if (error) throw error; return data as PlayerProgress | null;
  },
};
