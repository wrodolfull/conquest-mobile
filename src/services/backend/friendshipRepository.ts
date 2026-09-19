import { supabase } from '@/lib/supabase';
import type { ActivityPreference, RelationshipStatus } from '@/features/auth/types';

export interface SocialPlayer {
  request_id: string | null;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  level: number | null;
  preferred_activities: ActivityPreference[] | null;
  relationship_status: Exclude<RelationshipStatus, 'self'|'blocked_by_me'|'restricted'>;
  created_at: string;
}
export interface PlayerSearchResult extends Omit<SocialPlayer, 'user_id'|'preferred_activities'|'created_at'> { id:string }
export interface SocialCounts { friends_count:number; pending_request_count:number }
export interface BlockedPlayer { user_id:string; username:string; display_name:string; avatar_url:string|null }

const friendlyError = (message: string): Error => {
  const value=message.toLowerCase();
  if(value.includes('authentication')) return new Error('Your session expired. Sign in again.');
  if(value.includes('self')) return new Error('You cannot choose your own player.');
  if(value.includes('incoming')) return new Error('This player already sent you a request.');
  if(value.includes('already')) return new Error('That relationship has already changed. Refresh and try again.');
  if(value.includes('blocked')||value.includes('unavailable')) return new Error('This player is unavailable.');
  if(value.includes('not found')) return new Error('That player or request is no longer available.');
  return new Error('Social action could not be completed. Check your connection and try again.');
};
const invoke=async(name:'send_friend_request'|'accept_friend_request'|'decline_friend_request'|'cancel_friend_request'|'remove_friend'|'block_player'|'unblock_player',params:Record<string,string>)=>{const {error}=await supabase.rpc(name,params);if(error)throw friendlyError(error.message);};

export const friendshipRepository={
  async searchPlayers(query:string):Promise<PlayerSearchResult[]>{const normalized=query.trim().replace(/^@/,'');if(normalized.length<3)return [];const{data,error}=await supabase.rpc('search_players',{search_query:normalized});if(error)throw friendlyError(error.message);return (data??[]) as PlayerSearchResult[];},
  async getSocialList():Promise<SocialPlayer[]>{const{data,error}=await supabase.rpc('get_my_social_list');if(error)throw friendlyError(error.message);return (data??[]) as SocialPlayer[];},
  async getFriends(){return (await this.getSocialList()).filter(item=>item.relationship_status==='friends');},
  async getIncomingRequests(){return (await this.getSocialList()).filter(item=>item.relationship_status==='incoming_pending');},
  async getOutgoingRequests(){return (await this.getSocialList()).filter(item=>item.relationship_status==='outgoing_pending');},
  async getCounts():Promise<SocialCounts>{const{data,error}=await supabase.rpc('get_my_social_counts').maybeSingle();if(error)throw friendlyError(error.message);return {friends_count:Number(data?.friends_count??0),pending_request_count:Number(data?.pending_request_count??0)};},
  async getBlockedPlayers():Promise<BlockedPlayer[]>{const{data,error}=await supabase.rpc('get_blocked_players');if(error)throw friendlyError(error.message);return (data??[]) as BlockedPlayer[];},
  sendRequest:(userId:string)=>invoke('send_friend_request',{target_user_id:userId}),
  acceptRequest:(requestId:string)=>invoke('accept_friend_request',{request_id:requestId}),
  declineRequest:(requestId:string)=>invoke('decline_friend_request',{request_id:requestId}),
  cancelRequest:(requestId:string)=>invoke('cancel_friend_request',{request_id:requestId}),
  removeFriend:(userId:string)=>invoke('remove_friend',{target_user_id:userId}),
  blockPlayer:(userId:string)=>invoke('block_player',{target_user_id:userId}),
  unblockPlayer:(userId:string)=>invoke('unblock_player',{target_user_id:userId}),
  async getRelationship(userId:string):Promise<{request_id:string|null;relationship_status:RelationshipStatus}>{const{data,error}=await supabase.rpc('get_relationship',{target_user_id:userId}).single();if(error)throw friendlyError(error.message);return data as {request_id:string|null;relationship_status:RelationshipStatus};},
};
