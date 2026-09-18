/* eslint-disable import/no-unresolved -- Expo/native packages resolve in the development build. */
import * as SQLite from 'expo-sqlite';
import type { CompletedOutdoorActivity } from '@/features/activity/outdoorRules';
import type { CompletedIndoorActivity } from '@/features/activity/indoorRules';
export type ActivitySyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export interface StoredOutdoorActivity extends CompletedOutdoorActivity { clientActivityId: string; ownerUserId: string; syncStatus: ActivitySyncStatus; serverActivityId?: string; lastSyncError?: string; syncedAt?: number }
export interface StoredIndoorActivity extends CompletedIndoorActivity { clientActivityId: string; ownerUserId: string; syncStatus: ActivitySyncStatus; serverActivityId?: string; lastSyncError?: string; syncedAt?: number }
interface Row { payload: string; client_activity_id: string; owner_user_id: string; sync_status: ActivitySyncStatus; server_activity_id: string|null; last_sync_error:string|null; synced_at:number|null }
let dbPromise: Promise<SQLite.SQLiteDatabase>|undefined; const listeners=new Set<()=>void>(); const influence=new Map<string,number>();
async function database(){ if(!dbPromise) dbPromise=SQLite.openDatabaseAsync('conquest-tracking.db').then(async db=>{await db.execAsync(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS completed_activities(client_activity_id TEXT PRIMARY KEY NOT NULL,owner_user_id TEXT NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','syncing','synced','failed')),server_activity_id TEXT,last_sync_error TEXT,synced_at INTEGER,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS completed_activities_owner_created ON completed_activities(owner_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS completed_activities_owner_sync ON completed_activities(owner_user_id,sync_status);`);return db;}); return dbPromise; }
function outdoor(row:Row):StoredOutdoorActivity { return {...JSON.parse(row.payload) as CompletedOutdoorActivity,clientActivityId:row.client_activity_id,ownerUserId:row.owner_user_id,syncStatus:row.sync_status,serverActivityId:row.server_activity_id??undefined,lastSyncError:row.last_sync_error??undefined,syncedAt:row.synced_at??undefined}; }
function indoor(row:Row):StoredIndoorActivity { return {...JSON.parse(row.payload) as CompletedIndoorActivity,clientActivityId:row.client_activity_id,ownerUserId:row.owner_user_id,syncStatus:row.sync_status,serverActivityId:row.server_activity_id??undefined,lastSyncError:row.last_sync_error??undefined,syncedAt:row.synced_at??undefined}; }
const notify=()=>listeners.forEach(listener=>listener());
export const activityRepository={
 async save(activity:CompletedOutdoorActivity,ownerUserId:string){const db=await database();await db.runAsync("INSERT OR REPLACE INTO completed_activities(client_activity_id,owner_user_id,kind,payload,sync_status,created_at) VALUES(?,?,'outdoor',?,'pending',?)",activity.id,ownerUserId,JSON.stringify(activity),activity.endedAt);activity.traversals.forEach(t=>influence.set(t.territoryId,(influence.get(t.territoryId)??0)+t.influenceEarned));notify();},
 async list(ownerUserId?:string){const db=await database();const rows=ownerUserId?await db.getAllAsync<Row>("SELECT * FROM completed_activities WHERE kind='outdoor' AND owner_user_id=? ORDER BY created_at DESC",ownerUserId):await db.getAllAsync<Row>("SELECT * FROM completed_activities WHERE kind='outdoor' ORDER BY created_at DESC");return rows.map(outdoor);},
 async find(id:string){const db=await database();const row=await db.getFirstAsync<Row>("SELECT * FROM completed_activities WHERE client_activity_id=? AND kind='outdoor'",id);return row?outdoor(row):undefined;},
 async saveIndoor(activity:CompletedIndoorActivity,ownerUserId:string){const db=await database();await db.runAsync("INSERT OR REPLACE INTO completed_activities(client_activity_id,owner_user_id,kind,payload,sync_status,created_at) VALUES(?,?,'indoor',?,'pending',?)",activity.id,ownerUserId,JSON.stringify(activity),activity.endedAt);notify();},
 async findIndoor(id:string){const db=await database();const row=await db.getFirstAsync<Row>("SELECT * FROM completed_activities WHERE client_activity_id=? AND kind='indoor'",id);return row?indoor(row):undefined;},
 async pending(ownerUserId:string){const db=await database();return (await db.getAllAsync<Row>("SELECT * FROM completed_activities WHERE owner_user_id=? AND kind='outdoor' AND sync_status IN ('pending','failed') ORDER BY created_at",ownerUserId)).map(outdoor);},
 async markSyncing(id:string){const db=await database();await db.runAsync("UPDATE completed_activities SET sync_status='syncing',last_sync_error=NULL WHERE client_activity_id=?",id);notify();},
 async markSynced(id:string,serverId:string){const db=await database();await db.runAsync("UPDATE completed_activities SET sync_status='synced',server_activity_id=?,synced_at=?,last_sync_error=NULL WHERE client_activity_id=?",serverId,Date.now(),id);notify();},
 async markFailed(id:string,error:string){const db=await database();await db.runAsync("UPDATE completed_activities SET sync_status='failed',last_sync_error=? WHERE client_activity_id=?",error.slice(0,240),id);notify();},
 async recoverInterruptedSync(){const db=await database();await db.runAsync("UPDATE completed_activities SET sync_status='pending' WHERE sync_status='syncing'");},
 influenceFor:(territoryId:string)=>influence.get(territoryId)??0,
 subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
};
