import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
export interface WeeklySummary { week_start:string; week_end:string; outdoor_distance_meters:number; activity_count:number; xp_earned:number; influence_earned:number; source:'server'|'cache' }
const KEY='conquest.weekly-summary.v1';
export const weeklySummaryRepository={async get():Promise<WeeklySummary|null>{try{const{data,error}=await supabase.rpc('get_my_weekly_summary');if(error)throw error;const row=(data as Omit<WeeklySummary,'source'>[])[0];if(!row)return null;const value={...row,source:'server' as const};await AsyncStorage.setItem(KEY,JSON.stringify(value));return value;}catch{const cached=await AsyncStorage.getItem(KEY);return cached?{...(JSON.parse(cached) as WeeklySummary),source:'cache'}:null;}}};
