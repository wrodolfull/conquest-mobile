import { supabase } from '@/lib/supabase';
import { POI_GEOFENCE_DEFAULTS } from './config';
import type { Coordinate, GamePoi, PoiProvider, PoiType } from './types';

interface PoiRow { id:string; type:PoiType; name:string; latitude:number; longitude:number; enter_radius_meters:number; exit_radius_meters:number }
export class SupabasePoiProvider implements PoiProvider {
  async getNearbyPois(location:Coordinate,radiusMeters:number):Promise<GamePoi[]>{
    const radius=Math.min(20_000,Math.max(50,Math.round(radiusMeters)));
    const {data,error}=await supabase.rpc('get_nearby_game_pois',{latitude:location.latitude,longitude:location.longitude,radius_meters:radius});
    if(error) throw error;
    return (data as PoiRow[]).map(row=>({id:row.id,type:row.type,name:row.name,latitude:row.latitude,longitude:row.longitude,enterRadiusMeters:row.enter_radius_meters,exitRadiusMeters:row.exit_radius_meters,gracePeriodSeconds:POI_GEOFENCE_DEFAULTS.gracePeriodSeconds,metadata:{source:'server'}}));
  }
}
export const supabasePoiProvider=new SupabasePoiProvider();
