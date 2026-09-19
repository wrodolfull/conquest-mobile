import { supabase } from '@/lib/supabase';
const invoke=async(name:'send_friend_request'|'accept_friend_request'|'remove_friend'|'block_player',targetUserId:string)=>{const {error}=await supabase.rpc(name,{target_user_id:targetUserId});if(error)throw new Error('Friend action could not be completed.');};
export const friendshipRepository={send:(id:string)=>invoke('send_friend_request',id),accept:(id:string)=>invoke('accept_friend_request',id),remove:(id:string)=>invoke('remove_friend',id),block:(id:string)=>invoke('block_player',id)};
