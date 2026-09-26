import type { ActivitySyncStatus, StoredOutdoorActivity } from '@/services/storage/activityRepository';
import type { AuthoritativeLootGrant } from '@/features/inventory/lootRules';
import type { CompletedObjective, ZoneDiscovery } from '@/features/exploration/explorationRules';
import type { ActivityPoint } from './tracking';

export type OutdoorActivityType = 'walking'|'running'|'cycling';
export interface ActivityHistoryItem { source:'server'|'local'; activityId?:string; clientActivityId:string; localActivityId?:string; type:OutdoorActivityType; startedAt:number; endedAt:number; durationSeconds:number; distanceMeters:number; xpEarned:number; energyEarned:number; influenceEarned:number; territoryCount:number; syncStatus:ActivitySyncStatus; local?:StoredOutdoorActivity }
export interface ActivityDisplayRoute { type:'MultiLineString'; coordinates:[number,number][][] }
export interface ActivityDetail extends ActivityHistoryItem { routePointCount:number; route:ActivityDisplayRoute|null; territoryImpacts:{territoryId:string;territoryName:string;distanceMeters:number;influenceEarned:number}[]; loot:AuthoritativeLootGrant[]; newZonesDiscovered:ZoneDiscovery[]; completedObjectives:CompletedObjective[] }
export interface ActivityHistoryCursor { endedAt:string; activityId:string }
export interface ActivityHistoryPage { items:ActivityHistoryItem[]; nextCursor:ActivityHistoryCursor|null }

export function localHistoryItem(item:StoredOutdoorActivity):ActivityHistoryItem{return{source:'local',activityId:item.serverActivityId,clientActivityId:item.clientActivityId,localActivityId:item.id,type:item.type,startedAt:item.startedAt,endedAt:item.endedAt,durationSeconds:item.durationSeconds,distanceMeters:item.authoritativeDistanceMeters??item.distanceMeters,xpEarned:item.authoritativeXpEarned??item.xpEarned,energyEarned:item.authoritativeEnergyEarned??item.energyEarned,influenceEarned:item.authoritativeInfluenceEarned??item.influenceEarned,territoryCount:(item.authoritativeTerritoryImpacts??item.traversals).length,syncStatus:item.syncStatus,local:item}}
export function mergeActivityHistory(server:readonly ActivityHistoryItem[],local:readonly StoredOutdoorActivity[]):ActivityHistoryItem[]{
 const byKey=new Map<string,ActivityHistoryItem>();
 for(const value of server)byKey.set(`c:${value.clientActivityId}`,value);
 for(const stored of local){const value=localHistoryItem(stored);const serverMatch=(stored.serverActivityId&&server.find(item=>item.activityId===stored.serverActivityId))||server.find(item=>item.clientActivityId===stored.clientActivityId);if(serverMatch){byKey.set(`c:${serverMatch.clientActivityId}`,{...serverMatch,local:stored,localActivityId:stored.id});}else byKey.set(`c:${value.clientActivityId}`,value)}
 return [...byKey.values()].sort((a,b)=>b.endedAt-a.endedAt||b.clientActivityId.localeCompare(a.clientActivityId));
}
export function displayRoutePoints(route:ActivityDisplayRoute|null):ActivityPoint[]{if(!route)return[];return route.coordinates.flatMap((segment,segmentIndex)=>segment.map(([longitude,latitude],index)=>({longitude,latitude,timestamp:0,...(segmentIndex>0&&index===0?{breakBefore:true}: {})})));}
