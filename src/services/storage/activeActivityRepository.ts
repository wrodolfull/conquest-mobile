// Durable native storage is available in the development build, not Expo Go.
// eslint-disable-next-line import/no-unresolved
import * as SQLite from 'expo-sqlite';
import { createTrackingState, processPoint, type ActivityPoint, type OutdoorActivityType, type PointReason, type TrackingEngineState } from '@/features/activity/tracking';

export type ActiveActivityStatus = 'active' | 'interrupted';
export interface ActiveActivitySession {
  id: string;
  ownerUserId: string;
  type: OutdoorActivityType;
  startedAt: number;
  updatedAt: number;
  status: ActiveActivityStatus;
  phase: TrackingEngineState['phase'];
  distanceMeters: number;
  nativeTrackingStartedAt?: number;
  lastAcceptedPoint?: ActivityPoint;
}
export interface StoredActivityPoint extends ActivityPoint { id: number; accepted: boolean; provisional: boolean; reason: PointReason }
export interface TrackingDiagnostics {
  nativeTrackingStartedAt?: number; firstRawFixAt?: number; firstUsableFixAt?: number; gpsReadyAt?: number;
  rawFixCount: number; usableStartupFixCount: number; latestAccuracy?: number; latestReason?: PointReason;
  timeToFirstRawFixMs?: number; timeToFirstUsableFixMs?: number; timeToGpsReadyMs?: number;
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
async function database() {
  if (!databasePromise) databasePromise = SQLite.openDatabaseAsync('conquest-tracking.db').then(async (db) => {
    await db.execAsync(`PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS active_activity_sessions (
        id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, started_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL, status TEXT NOT NULL, phase TEXT NOT NULL, distance_meters REAL NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS activity_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, latitude REAL NOT NULL,
        longitude REAL NOT NULL, timestamp INTEGER NOT NULL, accuracy REAL, altitude REAL, speed REAL,
        heading REAL, break_before INTEGER NOT NULL DEFAULT 0, accepted INTEGER NOT NULL DEFAULT 0,
        provisional INTEGER NOT NULL DEFAULT 0, reason TEXT NOT NULL,
        UNIQUE(session_id, timestamp, latitude, longitude)
      );
      CREATE INDEX IF NOT EXISTS activity_points_session_time ON activity_points(session_id, timestamp);`);
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(active_activity_sessions)');
    if (!columns.some(({ name }) => name === 'owner_user_id')) await db.execAsync("ALTER TABLE active_activity_sessions ADD COLUMN owner_user_id TEXT NOT NULL DEFAULT '';");
    if (!columns.some(({ name }) => name === 'native_tracking_started_at')) await db.execAsync('ALTER TABLE active_activity_sessions ADD COLUMN native_tracking_started_at INTEGER;');
    return db;
  });
  return databasePromise;
}

interface SessionRow { id: string; owner_user_id: string; type: OutdoorActivityType; started_at: number; updated_at: number; status: ActiveActivityStatus; phase: TrackingEngineState['phase']; distance_meters: number; native_tracking_started_at: number | null }
interface PointRow { id: number; latitude: number; longitude: number; timestamp: number; accuracy: number | null; altitude: number | null; speed: number | null; heading: number | null; break_before: number; accepted: number; provisional: number; reason: PointReason }
const pointFromRow = (row: PointRow): StoredActivityPoint => ({ id: row.id, latitude: row.latitude, longitude: row.longitude, timestamp: row.timestamp, accuracy: row.accuracy ?? undefined, altitude: row.altitude ?? undefined, speed: row.speed ?? undefined, heading: row.heading ?? undefined, breakBefore: Boolean(row.break_before), accepted: Boolean(row.accepted), provisional: Boolean(row.provisional), reason: row.reason });

export const activityPointRepository = {
  async list(sessionId: string): Promise<StoredActivityPoint[]> { const db = await database(); return (await db.getAllAsync<PointRow>('SELECT id, latitude, longitude, timestamp, accuracy, altitude, speed, heading, break_before, accepted, provisional, reason FROM activity_points WHERE session_id = ? ORDER BY timestamp, id', sessionId)).map(pointFromRow); },
  async append(sessionId: string, points: readonly { point: ActivityPoint; accepted: boolean; provisional: boolean; reason: PointReason }[]) {
    if (!points.length) return; const db = await database();
    await db.withTransactionAsync(async () => { for (const value of points) { const p = value.point; await db.runAsync('INSERT OR IGNORE INTO activity_points (session_id, latitude, longitude, timestamp, accuracy, altitude, speed, heading, break_before, accepted, provisional, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', sessionId, p.latitude, p.longitude, p.timestamp, p.accuracy ?? null, p.altitude ?? null, p.speed ?? null, p.heading ?? null, p.breakBefore ? 1 : 0, value.accepted ? 1 : 0, value.provisional ? 1 : 0, value.reason); } });
  },
  async resolve(sessionId: string, point: ActivityPoint, accepted: boolean, reason: PointReason) { const db = await database(); await db.runAsync('UPDATE activity_points SET accepted = ?, provisional = 0, reason = ?, break_before = ? WHERE session_id = ? AND timestamp = ? AND latitude = ? AND longitude = ?', accepted ? 1 : 0, reason, point.breakBefore ? 1 : 0, sessionId, point.timestamp, point.latitude, point.longitude); },
  async removeAll(sessionId: string) { const db = await database(); await db.runAsync('DELETE FROM activity_points WHERE session_id = ?', sessionId); },
};

export const activeActivityRepository = {
  async create(type: OutdoorActivityType, ownerUserId: string, startedAt = Date.now()): Promise<ActiveActivitySession | undefined> { const db = await database(); const id = `${startedAt}-${type}`; let created=false;await db.withExclusiveTransactionAsync(async tx=>{const existing=await tx.getFirstAsync<{id:string}>('SELECT id FROM active_activity_sessions LIMIT 1');if(existing)return;await tx.runAsync("INSERT INTO active_activity_sessions (id, owner_user_id, type, started_at, updated_at, status, phase, distance_meters) VALUES (?, ?, ?, ?, ?, 'active', 'acquiring', 0)", id,ownerUserId,type,startedAt,startedAt);created=true;});if(!created)return undefined;notify();return { id, ownerUserId, type, startedAt, updatedAt: startedAt, status: 'active', phase: 'acquiring', distanceMeters: 0 }; },
  async get(ownerUserId?: string): Promise<ActiveActivitySession | undefined> {
    const db = await database(); const row = ownerUserId ? await db.getFirstAsync<SessionRow>('SELECT * FROM active_activity_sessions WHERE owner_user_id=? ORDER BY started_at DESC LIMIT 1',ownerUserId) : await db.getFirstAsync<SessionRow>('SELECT * FROM active_activity_sessions ORDER BY started_at DESC LIMIT 1'); if (!row) return undefined;
    const last = await db.getFirstAsync<PointRow>('SELECT id, latitude, longitude, timestamp, accuracy, altitude, speed, heading, break_before, accepted, provisional, reason FROM activity_points WHERE session_id = ? AND accepted = 1 ORDER BY timestamp DESC, id DESC LIMIT 1', row.id);
    return { id: row.id, ownerUserId: row.owner_user_id, type: row.type, startedAt: row.started_at, updatedAt: row.updated_at, status: row.status, phase: row.phase, distanceMeters: row.distance_meters, nativeTrackingStartedAt: row.native_tracking_started_at ?? undefined, lastAcceptedPoint: last ? pointFromRow(last) : undefined };
  },
  async update(session: Pick<ActiveActivitySession, 'id' | 'phase' | 'distanceMeters'>) { const db = await database(); await db.runAsync('UPDATE active_activity_sessions SET updated_at = ?, phase = ?, distance_meters = ? WHERE id = ?', Date.now(), session.phase, session.distanceMeters, session.id); notify();},
  async markInterrupted(id: string) { const db = await database(); await db.runAsync("UPDATE active_activity_sessions SET status = 'interrupted' WHERE id = ?", id);notify(); },
  async markActive(id: string) { const db = await database(); await db.runAsync("UPDATE active_activity_sessions SET status = 'active', updated_at = ? WHERE id = ?", Date.now(), id);notify(); },
  async markNativeTrackingStarted(id: string, timestamp: number) { const db = await database(); await db.runAsync('UPDATE active_activity_sessions SET native_tracking_started_at = ?, updated_at = ? WHERE id = ?', timestamp, timestamp, id); },
  async remove(id: string) { await activityPointRepository.removeAll(id); const db = await database(); await db.runAsync('DELETE FROM active_activity_sessions WHERE id = ?', id);notify(); },
  subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
};

export async function loadTrackingState(session: ActiveActivitySession): Promise<TrackingEngineState> {
  const points = await activityPointRepository.list(session.id);
  // Replaying the append-only raw stream makes recovery deterministic and avoids
  // rewriting one ever-growing route blob for every background update.
  let state = createTrackingState(session.type);
  for (const point of points) state = processPoint(state, point).state;
  return state;
}

export async function loadTrackingDiagnostics(session: ActiveActivitySession): Promise<TrackingDiagnostics> {
  const points = await activityPointRepository.list(session.id);
  const usable = points.filter((point) => (point.accuracy ?? Number.POSITIVE_INFINITY) <= 35);
  const ready = points.find((point) => point.accepted);
  const startupPoints = ready ? points.slice(0, points.indexOf(ready) + 1) : points.slice(-5);
  const start = session.nativeTrackingStartedAt;
  const elapsed = (timestamp: number | undefined) => start !== undefined && timestamp !== undefined ? Math.max(0, timestamp - start) : undefined;
  return {
    nativeTrackingStartedAt: start,
    firstRawFixAt: points[0]?.timestamp,
    firstUsableFixAt: usable[0]?.timestamp,
    gpsReadyAt: ready?.timestamp,
    rawFixCount: points.length,
    usableStartupFixCount: startupPoints.slice(-5).filter((point) => (point.accuracy ?? Number.POSITIVE_INFINITY) <= 35).length,
    latestAccuracy: points.at(-1)?.accuracy,
    latestReason: points.at(-1)?.reason,
    timeToFirstRawFixMs: elapsed(points[0]?.timestamp),
    timeToFirstUsableFixMs: elapsed(usable[0]?.timestamp),
    timeToGpsReadyMs: elapsed(ready?.timestamp),
  };
}
