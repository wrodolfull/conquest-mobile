import { supabase } from '@/lib/supabase';
import type { BattleHistoryItem, BattleResult, BattleState } from '@/features/battles/battleRules';

function clientBattleId():string {return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.floor(Math.random()*16);return(c==='x'?r:(r&3)|8).toString(16)});}
export const battleRepository={
 async getState(territoryId:string):Promise<BattleState>{const{data,error}=await supabase.rpc('get_territory_battle_state',{p_territory_id:territoryId});if(error)throw error;return data as BattleState;},
 async start(territoryId:string,id=clientBattleId()):Promise<BattleResult>{const{data,error}=await supabase.rpc('start_territory_battle',{p_territory_id:territoryId,p_client_battle_id:id});if(error)throw error;return data as BattleResult;},
 async history(limit=10):Promise<BattleHistoryItem[]>{const{data,error}=await supabase.rpc('get_my_battle_history',{p_limit:limit});if(error)throw error;return Array.isArray(data)?data as BattleHistoryItem[]:[];},
};
