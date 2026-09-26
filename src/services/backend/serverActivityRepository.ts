import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ActivityDetail, ActivityHistoryCursor, ActivityHistoryItem, ActivityHistoryPage, ActivityDisplayRoute, OutdoorActivityType } from '@/features/activity/activityHistory';
import type { AuthoritativeLootGrant } from '@/features/inventory/lootRules';
import type { CompletedObjective, ZoneDiscovery } from '@/features/exploration/explorationRules';

type JsonRecord=Record<string,unknown>;
const record=(value:unknown):JsonRecord=>typeof value==='object'&&value!==null&&!Array.isArray(value)?value as JsonRecord:{};
const number=(value:unknown)=>typeof value==='number'?value:Number(value)||0;
const string=(value:unknown)=>typeof value==='string'?value:'';
const list=(value:unknown)=>Array.isArray(value)?value:[];
const activityType=(value:unknown):OutdoorActivityType=>value==='running'||value==='cycling'?value:'walking';
function history(value:unknown):ActivityHistoryItem{const row=record(value);return{source:'server',activityId:string(row.activityId),clientActivityId:string(row.clientActivityId),type:activityType(row.activityType),startedAt:Date.parse(string(row.startedAt)),endedAt:Date.parse(string(row.endedAt)),durationSeconds:number(row.durationSeconds),distanceMeters:number(row.distanceMeters),xpEarned:number(row.xpEarned),energyEarned:number(row.energyEarned),influenceEarned:number(row.influenceEarned),territoryCount:number(row.territoryCount),syncStatus:'synced'}}
export const serverActivityRepository={
 async listPage(cursor?:ActivityHistoryCursor,pageSize=10):Promise<ActivityHistoryPage>{if(!isSupabaseConfigured)throw new Error('Server unavailable');const{data,error}=await supabase.rpc('get_my_activity_history',{p_cursor_ended_at:cursor?.endedAt??null,p_cursor_id:cursor?.activityId??null,p_page_size:pageSize});if(error)throw error;const payload=record(data);return{items:list(payload.items).map(history),nextCursor:payload.nextCursor?{endedAt:string(record(payload.nextCursor).endedAt),activityId:string(record(payload.nextCursor).activityId)}:null}},
 async getDetail(activityId:string):Promise<ActivityDetail|undefined>{if(!isSupabaseConfigured)throw new Error('Server unavailable');const{data,error}=await supabase.rpc('get_my_activity_detail',{p_activity_id:activityId});if(error)throw error;if(!data)return undefined;const row=record(data),base=history(row);return{...base,routePointCount:number(row.routePointCount),route:(row.route??null) as ActivityDisplayRoute|null,territoryImpacts:list(row.territoryImpacts) as ActivityDetail['territoryImpacts'],loot:list(row.loot) as AuthoritativeLootGrant[],newZonesDiscovered:list(row.newZonesDiscovered) as ZoneDiscovery[],completedObjectives:list(row.completedObjectives) as CompletedObjective[]}}
};
