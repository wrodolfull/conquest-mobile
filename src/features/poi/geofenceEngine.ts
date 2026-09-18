import type { GamePoi, GeofenceStatus } from './types';

export interface GeofenceState { status: GeofenceStatus; exitPendingSince?: number }

export function updateGeofence(
  previous: GeofenceState,
  distanceMeters: number,
  poi: Pick<GamePoi, 'enterRadiusMeters' | 'exitRadiusMeters' | 'gracePeriodSeconds'>,
  now: number,
): GeofenceState {
  if (!Number.isFinite(distanceMeters)) return previous;
  if (previous.status === 'outside') return distanceMeters <= poi.enterRadiusMeters ? { status: 'inside' } : previous;
  if (distanceMeters <= poi.exitRadiusMeters) return { status: 'inside' };
  if (previous.status === 'inside') return { status: 'exit_pending', exitPendingSince: now };
  const pendingSince = previous.exitPendingSince ?? now;
  return now - pendingSince >= poi.gracePeriodSeconds * 1000
    ? { status: 'outside' }
    : { status: 'exit_pending', exitPendingSince: pendingSince };
}

export const isGeofenceActive = (status: GeofenceStatus) => status !== 'outside';
