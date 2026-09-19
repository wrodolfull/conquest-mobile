import { supabase } from '@/lib/supabase';
import type { ActivityPreference, PlayerProfile, PlayerProgress, ProfilePrivacy, PublicPlayerProfile } from '@/features/auth/types';

const profileFields = 'id,username,display_name,avatar_url,bio,preferred_activities,city,region,onboarding_completed';
export interface ProfileDraft { username:string; displayName:string; avatarUrl:string|null; bio:string; preferredActivities:ActivityPreference[]; city:string; region:string }

export const profileRepository = {
  async get(userId: string): Promise<PlayerProfile | null> {
    const { data, error } = await supabase.from('profiles').select(profileFields).eq('id', userId).maybeSingle();
    if (error) throw error; return data as PlayerProfile | null;
  },
  async usernameAvailable(username:string):Promise<boolean>{ const {data,error}=await supabase.rpc('is_username_available',{candidate:username}); if(error) throw error; return Boolean(data); },
  async complete(draft:ProfileDraft,privacy:ProfilePrivacy):Promise<void>{ const {error}=await supabase.rpc('complete_player_onboarding',{p_username:draft.username,p_display_name:draft.displayName,p_avatar_url:draft.avatarUrl,p_bio:draft.bio,p_preferred_activities:draft.preferredActivities,p_city:draft.city,p_region:draft.region,p_profile_visibility:privacy.profile_visibility,p_activity_visibility:privacy.activity_visibility,p_show_level:privacy.show_level,p_show_stats:privacy.show_stats,p_show_territories:privacy.show_territories,p_show_achievements:privacy.show_achievements}); if(error) throw new Error(error.code==='23505'||error.message.toLowerCase().includes('username')?'That username is unavailable.':'Could not save your player. Try again.'); },
  async update(draft:ProfileDraft):Promise<void>{ const {error}=await supabase.rpc('update_player_profile',{p_username:draft.username,p_display_name:draft.displayName,p_avatar_url:draft.avatarUrl,p_bio:draft.bio,p_preferred_activities:draft.preferredActivities,p_city:draft.city,p_region:draft.region}); if(error) throw new Error(error.code==='23505'||error.message.toLowerCase().includes('username')?'That username is unavailable.':'Could not update profile.'); },
  async getPublic(userId:string):Promise<PublicPlayerProfile|null>{ const {data,error}=await supabase.rpc('get_player_profile',{target_user_id:userId}).maybeSingle(); if(error) throw error; return data as PublicPlayerProfile|null; },
  async search(query:string):Promise<Pick<PublicPlayerProfile,'id'|'username'|'display_name'|'avatar_url'|'level'>[]>{ if(query.trim().length<3)return []; const {data,error}=await supabase.rpc('search_players',{search_query:query.trim()}); if(error)throw error; return data ?? []; },
};
export const privacyRepository={async get():Promise<ProfilePrivacy>{const {data,error}=await supabase.from('profile_privacy').select('profile_visibility,activity_visibility,show_level,show_stats,show_territories,show_achievements').single();if(error)throw error;return data as ProfilePrivacy;},async update(value:ProfilePrivacy){const {error}=await supabase.from('profile_privacy').update(value).eq('user_id',(await supabase.auth.getUser()).data.user?.id);if(error)throw error;}};
export const progressRepository = {
  async get(userId: string): Promise<PlayerProgress | null> {
    const { data, error } = await supabase.from('player_progress').select('user_id,level,xp,energy,coins').eq('user_id', userId).maybeSingle();
    if (error) throw error; return data as PlayerProgress | null;
  },
};
