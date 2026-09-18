import * as Location from 'expo-location';
import type { OutdoorActivityType } from '@/features/activity/tracking';
import { LOCATION_OPTIONS } from './locationTrackingOptions';
import { activeActivityRepository } from '@/services/storage/activeActivityRepository';
import { CONQUEST_OUTDOOR_LOCATION_TASK } from './backgroundLocationTask';

export type TrackingStartResult = { ok: true; sessionId: string } | { ok: false; reason: 'foreground-denied' | 'background-denied' | 'unavailable' };

export async function startOutdoorTracking(type: OutdoorActivityType): Promise<TrackingStartResult> {
  const services = await Location.hasServicesEnabledAsync(); if (!services) return { ok: false, reason: 'unavailable' };
  const foreground = await Location.requestForegroundPermissionsAsync(); if (!foreground.granted) return { ok: false, reason: 'foreground-denied' };
  const background = await Location.requestBackgroundPermissionsAsync(); if (!background.granted) return { ok: false, reason: 'background-denied' };
  const existing = await activeActivityRepository.get(); const session = existing ?? await activeActivityRepository.create(type);
  if (!(await Location.hasStartedLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK))) await Location.startLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK, LOCATION_OPTIONS);
  return { ok: true, sessionId: session.id };
}

export async function stopOutdoorTracking() {
  if (await Location.hasStartedLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK)) await Location.stopLocationUpdatesAsync(CONQUEST_OUTDOOR_LOCATION_TASK);
}
