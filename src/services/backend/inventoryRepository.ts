import { supabase } from '@/lib/supabase';
import { inventoryCacheRepository } from '@/services/storage/inventoryCacheRepository';
import type { InventoryItem, LootRarity } from '@/features/inventory/lootRules';

interface InventoryRow { item_id:string;name:string;description:string|null;rarity:LootRarity;category:'collectible';icon_key:string|null;quantity:number;first_acquired_at:string;last_acquired_at:string }
const listeners=new Set<()=>void>();
const inFlight=new Map<string,Promise<{items:InventoryItem[];refreshedAt:number}>>();
const mapRow=(row:InventoryRow):InventoryItem=>({id:row.item_id,name:row.name,description:row.description,rarity:row.rarity,category:row.category,iconKey:row.icon_key,quantity:row.quantity,firstAcquiredAt:row.first_acquired_at,lastAcquiredAt:row.last_acquired_at});
export const inventoryRepository={
  subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
  cached(ownerUserId:string){return inventoryCacheRepository.get(ownerUserId);},
  refresh(ownerUserId:string){const existing=inFlight.get(ownerUserId);if(existing)return existing;const request=(async()=>{const{data,error}=await supabase.rpc('get_my_inventory');if(error)throw error;const items=((data??[]) as InventoryRow[]).map(mapRow);const refreshedAt=await inventoryCacheRepository.set(ownerUserId,items);listeners.forEach(listener=>listener());return{items,refreshedAt};})();inFlight.set(ownerUserId,request);void request.finally(()=>{if(inFlight.get(ownerUserId)===request)inFlight.delete(ownerUserId);}).catch(()=>undefined);return request;},
};
