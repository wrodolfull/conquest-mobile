import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { parseCachedJson } from '@/services/storage/cacheJson';
export interface WeeklySummary { week_start:string; week_end:string; outdoor_distance_meters:number; activity_count:number; xp_earned:number; influence_earned:number; source:'server'|'cache' }
type Listener=(summary:WeeklySummary|null)=>void;
const KEY='conquest.weekly-summary.v1';
const listeners=new Set<Listener>();
let latest:WeeklySummary|null|undefined;
let inFlight:Promise<WeeklySummary|null>|undefined;
const notify=(value:WeeklySummary|null)=>listeners.forEach(listener=>listener(value));
async function fetchSummary():Promise<WeeklySummary|null>{try{const{data,error}=await supabase.rpc('get_my_weekly_summary');if(error)throw error;const row=(data as Omit<WeeklySummary,'source'>[])[0];if(!row)return null;const value={...row,source:'server' as const};try{await AsyncStorage.setItem(KEY,JSON.stringify(value));}catch{/* Valid server data remains usable when cache storage is unavailable. */}return value;}catch{try{const cached=await AsyncStorage.getItem(KEY);const value=cached?parseCachedJson(cached,(candidate):candidate is WeeklySummary=>candidate!==null&&typeof candidate==='object'&&'week_start' in candidate):undefined;return value?{...value,source:'cache'}:null;}catch{return null;}}}
export const weeklySummaryRepository={
 getLatest(){return latest;},
 refresh(){if(inFlight)return inFlight;const request=fetchSummary().then(value=>{latest=value;notify(value);return value;});inFlight=request;void request.finally(()=>{if(inFlight===request)inFlight=undefined;}).catch(()=>undefined);return request;},
 subscribe(listener:Listener){listeners.add(listener);return()=>{listeners.delete(listener);};},
};
