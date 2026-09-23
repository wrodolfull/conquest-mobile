import { supabase } from '@/lib/supabase';
import type { Rivalry, RivalryDetail, SharedTerritory } from '@/features/social/types';

const rpc=async<T>(name:string,params?:Record<string,unknown>):Promise<T>=>{const{data,error}=await supabase.rpc(name,params);if(error)throw new Error('Rivalry data is unavailable.');return data as T};
export const rivalryRepository={
 getRivalries:(limit=20,before?:string)=>rpc<Rivalry[]>('get_my_rivalries',{p_limit:limit,p_before:before??null}),
 getDetail:(userId:string)=>rpc<RivalryDetail>('get_rivalry_detail',{p_target_user_id:userId}),
 getSharedTerritories:(userId:string,limit=20,offset=0)=>rpc<SharedTerritory[]>('get_rivalry_shared_territories',{p_target_user_id:userId,p_limit:limit,p_offset:offset}),
};
