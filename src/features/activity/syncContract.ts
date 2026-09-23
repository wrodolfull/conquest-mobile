export type ActivitySyncFailureCode =
  | 'NETWORK_UNAVAILABLE'
  | 'BACKEND_VERSION_MISMATCH'
  | 'AUTHENTICATION_FAILURE'
  | 'ACTIVITY_REJECTED'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface ActivitySyncFailure {
  code: ActivitySyncFailureCode;
  message: string;
  global: boolean;
}

export interface CompleteActivityResponse {
  activityId: string;
  distanceMeters: number;
  xpEarned: number;
  energyEarned: number;
  influenceEarned: number;
  territoryImpacts: unknown[];
  loot: unknown[];
  newZonesDiscovered: { territoryId: string; territoryName: string }[];
  newZonesCount: number;
  completedObjectives: { key: string; title: string; coins: number }[];
}

export function isCompleteActivityResponse(value: unknown): value is CompleteActivityResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<CompleteActivityResponse>;
  return typeof response.activityId === 'string'
    && typeof response.distanceMeters === 'number'
    && typeof response.xpEarned === 'number'
    && typeof response.energyEarned === 'number'
    && typeof response.influenceEarned === 'number'
    && Array.isArray(response.territoryImpacts)
    && Array.isArray(response.loot)
    && Array.isArray(response.newZonesDiscovered)
    && typeof response.newZonesCount === 'number'
    && Array.isArray(response.completedObjectives);
}

export function classifySyncFailure(error: unknown): ActivitySyncFailure {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const message = raw.toLowerCase();
  const directStatus = typeof error === 'object' && error !== null && 'status' in error ? (error as { status?: unknown }).status : undefined;
  const contextStatus = typeof error === 'object' && error !== null && 'context' in error ? (error as { context?: { status?: unknown } }).context?.status : undefined;
  const statusValue = directStatus ?? contextStatus;
  const status = statusValue === undefined ? undefined : Number(statusValue);
  if (status === 401 || status === 403 || /jwt|unauthori[sz]ed|authentication|required.*auth/.test(message)) {
    return { code: 'AUTHENTICATION_FAILURE', message: 'Sign in again, then retry synchronization.', global: true };
  }
  if (/network|fetch failed|offline|timed? ?out|connection/.test(message)) {
    return { code: 'NETWORK_UNAVAILABLE', message: 'No server connection. Check your network and retry.', global: false };
  }
  if (/contract mismatch|malformed activity response|function.*not found|does not exist|schema cache/.test(message)) {
    return { code: 'BACKEND_VERSION_MISMATCH', message: 'The server needs an update before this activity can sync.', global: false };
  }
  if (status !== undefined && status >= 500) return { code: 'SERVER_ERROR', message: 'The server is temporarily unavailable. Retry shortly.', global: false };
  if (status === 400 || status === 409 || status === 422 || /invalid|rejected|impossible route/.test(message)) {
    return { code: 'ACTIVITY_REJECTED', message: 'The server could not accept this activity. Review diagnostics or contact support.', global: false };
  }
  return { code: 'UNKNOWN_ERROR', message: 'Synchronization failed. Your activity remains safe on this device.', global: false };
}
