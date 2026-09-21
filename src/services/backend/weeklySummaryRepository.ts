import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
export interface WeeklySummary { week_start:string; week_end:string; outdoor_distance_meters:number; activity_count:number; xp_earned:number; influence_earned:number; source:'server'|'cache' }
type Listener=(summary:WeeklySummary|null)=>void;
const KEY='conquest.weekly-summary.v1';
const listeners=new Set<Listener>();
let latest:WeeklySummary|null|undefined;
let refreshQueue:Promise<void>=Promise.resolve();
const notify=(value:WeeklySummary|null)=>listeners.forEach(listener=>listener(value));
async function fetchSummary():Promise<WeeklySummary|null>{try{const{data,error}=await supabase.rpc('get_my_weekly_summary');if(error)throw error;const row=(data as Omit<WeeklySummary,'source'>[])[0];if(!row)return null;const value={...row,source:'server' as const};await AsyncStorage.setItem(KEY,JSON.stringify(value));return value;}catch{const cached=await AsyncStorage.getItem(KEY);return cached?{...(JSON.parse(cached) as WeeklySummary),source:'cache'}:null;}}
export const weeklySummaryRepository={
 getLatest(){return latest;},
 refresh(){const request=refreshQueue.then(fetchSummary).then(value=>{latest=value;notify(value);return value;});refreshQueue=request.then(()=>undefined,()=>undefined);return request;},
 subscribe(listener:Listener){listeners.add(listener);return()=>{listeners.delete(listener);};},
};
