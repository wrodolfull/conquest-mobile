import type * as Location from 'expo-location';
import { processRuntimePoint, type TrackingRuntimeState } from '@/features/activity/tracking';
import { activeActivityRepository, activityPointRepository, loadTrackingRuntime } from '@/services/storage/activeActivityRepository';
import { fromLocation } from './locationTrackingOptions';

let ingestionQueue: Promise<void> = Promise.resolve();
let cachedRuntime: { sessionId: string; state: TrackingRuntimeState } | undefined;

async function ingest(locations: readonly Location.LocationObject[]): Promise<void> {
  const session = await activeActivityRepository.get();
  if (!session || session.status !== 'active') return;
  const coldStart = cachedRuntime?.sessionId !== session.id;
  let state = coldStart ? await loadTrackingRuntime(session) : cachedRuntime!.state;
  const started = Date.now();
  for (const location of [...locations].sort((a, b) => a.timestamp - b.timestamp)) {
    const result = processRuntimePoint(state, fromLocation(location));
    for (const item of result.decisions) {
      if (item.point.timestamp !== location.timestamp) await activityPointRepository.resolve(session.id, item.point, item.decision.accepted, item.decision.reason);
      else await activityPointRepository.append(session.id, [{ point: item.point, accepted: item.decision.accepted, provisional: Boolean(item.decision.provisional), reason: item.decision.reason }]);
    }
    // Advance memory only after the decisions for this fix are durable.
    state = result.runtime;
    cachedRuntime = { sessionId: session.id, state };
  }
  await activeActivityRepository.update({ id: session.id, phase: state.engine.phase, distanceMeters: state.distanceMeters });
  if (__DEV__ && locations.length >= 100) console.info(`[tracking] ${coldStart ? 'cold' : 'incremental'} batch: ${locations.length} fixes in ${Date.now() - started}ms`);
}

/** Serializes foreground and TaskManager fixes through one durable pipeline. */
export function ingestNativeLocations(locations: readonly Location.LocationObject[]): Promise<void> {
  const work = ingestionQueue.then(() => ingest(locations)).catch((error) => { cachedRuntime = undefined; throw error; });
  ingestionQueue = work.catch(() => undefined);
  return work;
}

export function waitForLocationIngestion(): Promise<void> { return ingestionQueue; }
