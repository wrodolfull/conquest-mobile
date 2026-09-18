import * as Location from 'expo-location';
import type { OutdoorActivityType } from '@/features/activity/tracking';
import { LOCATION_OPTIONS } from './locationTrackingOptions';
import { activeActivityRepository } from '@/services/storage/activeActivityRepository';
import { CONQUEST_OUTDOOR_LOCATION_TASK } from './backgroundLocationTask';
import { ingestNativeLocations, waitForLocationIngestion } from './locationIngestion';

export type TrackingStartResult = { ok: true; sessionId: string } | { ok: false; reason: 'foreground-denied' | 'background-denied' | 'unavailable' | 'unresolved-session' };

const STARTUP_FIX_TIMEOUT_MS = 15_000;

async function permissionsGranted(): Promise<Exclude<TrackingStartResult, { ok: true }> | undefined> {
  const services = await Location.hasServicesEnabledAsync(); if (!services) return { ok: false, reason: 'unavailable' };
  const foreground = await Location.requestForegroundPermissionsAsync(); if (!foreground.granted) return { ok: false, reason: 'foreground-denied' };
  const background = await Location.requestBackgroundPermissionsAsync(); if (!background.granted) return { ok: false, reason: 'background-denied' };
}

function requestStartupFix(): void {
  let active = true;
  const timeout = setTimeout(() => { active = false; }, STARTUP_FIX_TIMEOUT_MS);
  void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation })
    .then(async (location) => { if (active) await ingestNativeLocations([location]); })
    .catch(() => undefined)
    .finally(() => clearTimeout(timeout));
}

async function startNativeTracking(sessionId: string): Promise<boolean> {
  try {
    if (!(await Location.hasStartedLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK))) await Location.startLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK, LOCATION_OPTIONS);
    await activeActivityRepository.markNativeTrackingStarted(sessionId, Date.now());
    return true;
  } catch { return false; }
}

export async function startOutdoorTracking(type: OutdoorActivityType): Promise<TrackingStartResult> {
  const existing = await activeActivityRepository.get();
  if (existing) return { ok: false, reason: 'unresolved-session' };
  const permissionFailure = await permissionsGranted(); if (permissionFailure) return permissionFailure;
  const session = await activeActivityRepository.create(type);
  if (await startNativeTracking(session.id)) { requestStartupFix(); return { ok: true, sessionId: session.id }; }
  await activeActivityRepository.remove(session.id);
  return { ok: false, reason: 'unavailable' };
}

export async function resumeOutdoorTracking(sessionId: string): Promise<TrackingStartResult> {
  const session = await activeActivityRepository.get();
  if (!session || session.id !== sessionId || session.status !== 'interrupted') return { ok: false, reason: 'unresolved-session' };
  const permissionFailure = await permissionsGranted(); if (permissionFailure) return permissionFailure;
  if (!(await startNativeTracking(session.id))) return { ok: false, reason: 'unavailable' };
  await activeActivityRepository.markActive(session.id);
  requestStartupFix();
  return { ok: true, sessionId: session.id };
}

export async function stopOutdoorTracking() {
  if (await Location.hasStartedLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK)) await Location.stopLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK);
  await waitForLocationIngestion();
}
