/* eslint-disable import/no-unresolved -- Expo SQLite resolves in the development build. */
import * as SQLite from 'expo-sqlite';
import type { InventoryItem } from '@/features/inventory/lootRules';
import { parseCachedJson } from './cacheJson';

interface CacheRow { payload:string; refreshed_at:number }
let dbPromise:Promise<SQLite.SQLiteDatabase>|undefined;
async function database(){
  if(!dbPromise) dbPromise=SQLite.openDatabaseAsync('conquest-tracking.db').then(async db=>{
    await db.execAsync('CREATE TABLE IF NOT EXISTS inventory_cache(owner_user_id TEXT PRIMARY KEY NOT NULL,payload TEXT NOT NULL,refreshed_at INTEGER NOT NULL);');
    return db;
  });
  return dbPromise;
}
export const inventoryCacheRepository={
  async get(ownerUserId:string){const row=await (await database()).getFirstAsync<CacheRow>('SELECT payload,refreshed_at FROM inventory_cache WHERE owner_user_id=?',ownerUserId);if(!row)return undefined;const items=parseCachedJson(row.payload,(value):value is InventoryItem[]=>Array.isArray(value));return items?{items,refreshedAt:row.refreshed_at}:undefined;},
  async set(ownerUserId:string,items:InventoryItem[]){const refreshedAt=Date.now();await (await database()).runAsync('INSERT INTO inventory_cache(owner_user_id,payload,refreshed_at) VALUES(?,?,?) ON CONFLICT(owner_user_id) DO UPDATE SET payload=excluded.payload,refreshed_at=excluded.refreshed_at',ownerUserId,JSON.stringify(items),refreshedAt);return refreshedAt;},
};
