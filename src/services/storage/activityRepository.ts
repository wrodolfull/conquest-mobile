/* eslint-disable import/no-unresolved -- Expo/native packages resolve in the development build. */
import * as SQLite from 'expo-sqlite';
import type { CompletedOutdoorActivity } from '@/features/activity/outdoorRules';
import type { CompletedIndoorActivity } from '@/features/activity/indoorRules';
import type { AuthoritativeLootGrant } from '@/features/inventory/lootRules';
import type { CompletedObjective, ZoneDiscovery } from '@/features/exploration/explorationRules';
export type ActivitySyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export interface StoredOutdoorActivity extends CompletedOutdoorActivity { clientActivityId: string; ownerUserId: string; syncStatus: ActivitySyncStatus; serverActivityId?: string; lastSyncError?: string; lastSyncErrorCode?: string; syncedAt?: number; authoritativeDistanceMeters?:number; authoritativeXpEarned?:number; authoritativeEnergyEarned?:number; authoritativeInfluenceEarned?:number; authoritativeTerritoryImpacts?:CompletedOutdoorActivity['traversals']; authoritativeLoot?:AuthoritativeLootGrant[]; newZonesDiscovered?:ZoneDiscovery[]; completedObjectives?:CompletedObjective[]; lootSyncedAt?:number }
export interface StoredIndoorActivity extends CompletedIndoorActivity { clientActivityId:string; ownerUserId:string; syncStatus:ActivitySyncStatus; serverActivityId?:string; lastSyncError?:string; syncedAt?:number }
interface Row { payload: string; client_activity_id: string; owner_user_id: string; sync_status: ActivitySyncStatus; server_activity_id: string|null; last_sync_error:string|null; last_sync_error_code:string|null; synced_at:number|null; created_at:number }
export const ACTIVITY_PAGE_SIZE = 10;
export interface ActivityCursor { createdAt:number; clientActivityId:string }
export interface ActivityPage { items:StoredOutdoorActivity[]; nextCursor:ActivityCursor|null }
let dbPromise: Promise<SQLite.SQLiteDatabase>|undefined; const listeners=new Set<()=>void>(); const influence=new Map<string,number>();
async function database(){ if(!dbPromise) dbPromise=SQLite.openDatabaseAsync('conquest-tracking.db').then(async db=>{await db.execAsync(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS completed_activities(client_activity_id TEXT PRIMARY KEY NOT NULL,owner_user_id TEXT NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','syncing','synced','failed')),server_activity_id TEXT,last_sync_error TEXT,last_sync_error_code TEXT,synced_at INTEGER,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS completed_activities_owner_created ON completed_activities(owner_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS completed_activities_history_page ON completed_activities(owner_user_id,kind,created_at DESC,client_activity_id DESC);
CREATE INDEX IF NOT EXISTS completed_activities_owner_sync ON completed_activities(owner_user_id,sync_status);`);const columns=await db.getAllAsync<{name:string}>('PRAGMA table_info(completed_activities)');if(!columns.some(({name})=>name==='last_sync_error_code'))await db.execAsync('ALTER TABLE completed_activities ADD COLUMN last_sync_error_code TEXT;');return db;}); return dbPromise; }
function outdoor(row:Row):StoredOutdoorActivity { return {...JSON.parse(row.payload) as CompletedOutdoorActivity,clientActivityId:row.client_activity_id,ownerUserId:row.owner_user_id,syncStatus:row.sync_status,serverActivityId:row.server_activity_id??undefined,lastSyncError:row.last_sync_error??undefined,lastSyncErrorCode:row.last_sync_error_code??undefined,syncedAt:row.synced_at??undefined}; }
function indoor(row:Row):StoredIndoorActivity { return {...JSON.parse(row.payload) as CompletedIndoorActivity,clientActivityId:row.client_activity_id,ownerUserId:row.owner_user_id,syncStatus:row.sync_status,serverActivityId:row.server_activity_id??undefined,lastSyncError:row.last_sync_error??undefined,syncedAt:row.synced_at??undefined}; }
const notify=()=>listeners.forEach(listener=>listener());
export const activityRepository={
 async save(activity:CompletedOutdoorActivity,ownerUserId:string){const db=await database();await db.runAsync("INSERT OR REPLACE INTO completed_activities(client_activity_id,owner_user_id,kind,payload,sync_status,created_at) VALUES(?,?,'outdoor',?,'pending',?)",activity.id,ownerUserId,JSON.stringify(activity),activity.endedAt);activity.traversals.forEach(t=>influence.set(t.territoryId,(influence.get(t.territoryId)??0)+t.influenceEarned));notify();},
 async list(ownerUserId?:string){const db=await database();const rows=ownerUserId?await db.getAllAsync<Row>("SELECT * FROM completed_activities WHERE kind='outdoor' AND owner_user_id=? ORDER BY created_at DESC",ownerUserId):await db.getAllAsync<Row>("SELECT * FROM completed_activities WHERE kind='outdoor' ORDER BY created_at DESC");return rows.map(outdoor);},
 async listPage(ownerUserId:string,cursor?:ActivityCursor,pageSize=ACTIVITY_PAGE_SIZE):Promise<ActivityPage>{
  const db=await database();
  const limit=pageSize+1;
  const rows=cursor
   ?await db.getAllAsync<Row>("SELECT * FROM completed_activities WHERE owner_user_id=? AND kind='outdoor' AND (created_at<? OR (created_at=? AND client_activity_id<?)) ORDER BY created_at DESC,client_activity_id DESC LIMIT ?",ownerUserId,cursor.createdAt,cursor.createdAt,cursor.clientActivityId,limit)
   :await db.getAllAsync<Row>("SELECT * FROM completed_activities WHERE owner_user_id=? AND kind='outdoor' ORDER BY created_at DESC,client_activity_id DESC LIMIT ?",ownerUserId,limit);
  const visible=rows.slice(0,pageSize);
  const last=visible.at(-1);
  return{items:visible.map(outdoor),nextCursor:rows.length>pageSize&&last?{createdAt:last.created_at,clientActivityId:last.client_activity_id}:null};
 },
 async find(id:string,ownerUserId:string){const db=await database();const row=await db.getFirstAsync<Row>("SELECT * FROM completed_activities WHERE client_activity_id=? AND owner_user_id=? AND kind='outdoor'",id,ownerUserId);return row?outdoor(row):undefined;},
 async saveIndoor(activity:CompletedIndoorActivity,ownerUserId:string){const db=await database();await db.runAsync("INSERT OR REPLACE INTO completed_activities(client_activity_id,owner_user_id,kind,payload,sync_status,created_at) VALUES(?,?,'indoor',?,'pending',?)",activity.id,ownerUserId,JSON.stringify(activity),activity.endedAt);notify();},
 async findIndoor(id:string){const db=await database();const row=await db.getFirstAsync<Row>("SELECT * FROM completed_activities WHERE client_activity_id=? AND kind='indoor'",id);return row?indoor(row):undefined;},
 async pending(ownerUserId:string){const db=await database();return (await db.getAllAsync<Row>("SELECT * FROM completed_activities WHERE owner_user_id=? AND kind='outdoor' AND (sync_status='pending' OR (sync_status='failed' AND COALESCE(last_sync_error_code,'')<>'INSUFFICIENT_GPS_DATA')) ORDER BY created_at",ownerUserId)).map(outdoor);},
 async markSyncing(id:string){const db=await database();await db.runAsync("UPDATE completed_activities SET sync_status='syncing',last_sync_error=NULL,last_sync_error_code=NULL WHERE client_activity_id=?",id);notify();},
 async markSynced(id:string,result:{activityId:string;distanceMeters:number;xpEarned:number;energyEarned:number;influenceEarned:number;territoryImpacts:CompletedOutdoorActivity['traversals'];loot:AuthoritativeLootGrant[];newZonesDiscovered:ZoneDiscovery[];completedObjectives:CompletedObjective[]}){const db=await database();const row=await db.getFirstAsync<Row>("SELECT * FROM completed_activities WHERE client_activity_id=?",id);if(!row)return;const current=JSON.parse(row.payload) as CompletedOutdoorActivity;const now=Date.now();const payload={...current,authoritativeDistanceMeters:result.distanceMeters,authoritativeXpEarned:result.xpEarned,authoritativeEnergyEarned:result.energyEarned,authoritativeInfluenceEarned:result.influenceEarned,authoritativeTerritoryImpacts:result.territoryImpacts,authoritativeLoot:result.loot,newZonesDiscovered:result.newZonesDiscovered,completedObjectives:result.completedObjectives,lootSyncedAt:now};await db.runAsync("UPDATE completed_activities SET payload=?,sync_status='synced',server_activity_id=?,synced_at=?,last_sync_error=NULL WHERE client_activity_id=?",JSON.stringify(payload),result.activityId,now,id);notify();},
 async markFailed(id:string,code:string,error:string){const db=await database();await db.runAsync("UPDATE completed_activities SET sync_status='failed',last_sync_error_code=?,last_sync_error=? WHERE client_activity_id=?",code,error.slice(0,240),id);notify();},
 async recoverInterruptedSync(){const db=await database();await db.runAsync("UPDATE completed_activities SET sync_status='pending' WHERE sync_status='syncing'");},
 influenceFor:(territoryId:string)=>influence.get(territoryId)??0,
 subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
};
