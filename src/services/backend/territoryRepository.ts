/* eslint-disable import/no-unresolved -- Expo/native packages resolve in the development build. */
import * as SQLite from 'expo-sqlite';
import { supabase } from '@/lib/supabase';
import { isWorldRegionRow, mapWorldRegion, viewportKey, type WorldRegionRow } from '@/features/territories/worldRegions';
import type { MapTerritory, WorldViewport } from '@/features/territories/types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | undefined;
const listeners = new Set<() => void>();
async function db() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('conquest-tracking.db').then(async (value) => {
    await value.execAsync('CREATE TABLE IF NOT EXISTS world_region_cache(viewport_key TEXT PRIMARY KEY NOT NULL,west REAL NOT NULL,south REAL NOT NULL,east REAL NOT NULL,north REAL NOT NULL,payload TEXT NOT NULL,updated_at INTEGER NOT NULL);');
    return value;
  });
  return dbPromise;
}

const parseRows = (payload: unknown): WorldRegionRow[] => Array.isArray(payload) ? payload.filter(isWorldRegionRow) : [];

export const territoryRepository = {
  invalidate() { listeners.forEach((listener) => listener()); },
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  async getWorldRegions(viewport: WorldViewport): Promise<MapTerritory[]> {
    const key = viewportKey(viewport);
    try {
      const { data, error } = await supabase.rpc('get_world_regions', viewport);
      if (error) throw error;
      const rows = parseRows(data);
      const database = await db();
      await database.runAsync('INSERT OR REPLACE INTO world_region_cache VALUES(?,?,?,?,?,?,?)', key, viewport.west, viewport.south, viewport.east, viewport.north, JSON.stringify(rows), Date.now());
      await database.runAsync('DELETE FROM world_region_cache WHERE viewport_key NOT IN (SELECT viewport_key FROM world_region_cache ORDER BY updated_at DESC LIMIT 24)');
      return rows.map((row) => mapWorldRegion(row, 'server'));
    } catch {
      const database = await db();
      const cached = await database.getFirstAsync<{payload:string}>('SELECT payload FROM world_region_cache WHERE west<=? AND east>=? AND south<=? AND north>=? ORDER BY updated_at DESC LIMIT 1', viewport.west, viewport.east, viewport.south, viewport.north);
      return cached ? parseRows(JSON.parse(cached.payload)).map((row) => mapWorldRegion(row, 'cache')) : [];
    }
  },
};
