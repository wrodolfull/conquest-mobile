import type { ActivityType } from '../../types/game';

export type OutdoorActivityType = Exclude<ActivityType, 'indoor'>;
export type TrackingPhase = 'acquiring' | 'tracking';
export type GpsQuality = 'ACQUIRING' | 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export interface ActivityPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  /** A route break means this point is retained, but no segment is drawn/counted from its predecessor. */
  breakBefore?: boolean;
}

export type PointReason = 'accepted' | 'stabilizing' | 'invalid-coordinate' | 'poor-accuracy' | 'duplicate-timestamp' | 'stationary-drift' | 'impossible-speed' | 'reported-speed' | 'sudden-acceleration' | 'isolated-spike' | 'gps-gap' | 'provisional';
export interface PointDecision { accepted: boolean; provisional?: boolean; reason: PointReason }

export const GPS_FILTER = {
  maximumAccuracyMeters: 45,
  startupAccuracyMeters: 35,
  startupRequiredUsableSamples: 3,
  startupWindowSize: 5,
  startupCoherenceMeters: 35,
  minimumIntervalMs: 900,
  gapIntervalMs: 20_000,
  minimumMovementMeters: 3,
  accuracyNoiseRatio: 0.65,
  suspiciousSegmentMeters: { walking: 45, running: 65, cycling: 100 } satisfies Record<OutdoorActivityType, number>,
  maximumSpeedMetersPerSecond: { walking: 3.2, running: 7.5, cycling: 18 } satisfies Record<OutdoorActivityType, number>,
  maximumAccelerationMetersPerSecondSquared: { walking: 2.5, running: 4, cycling: 6 } satisfies Record<OutdoorActivityType, number>,
  spikeReturnRadiusMeters: 45,
  confirmationDirectionDegrees: 65,
  qualityWindowSize: 8,
} as const;

export interface TrackingEngineState {
  type: OutdoorActivityType;
  phase: TrackingPhase;
  accepted: ActivityPoint[];
  rejected: ActivityPoint[];
  startup: ActivityPoint[];
  candidate?: ActivityPoint;
  previousSpeed?: number;
  recentAccuracies: number[];
}

export interface ProcessResult { state: TrackingEngineState; decisions: { point: ActivityPoint; decision: PointDecision }[] }

export const createTrackingState = (type: OutdoorActivityType): TrackingEngineState => ({ type, phase: 'acquiring', accepted: [], rejected: [], startup: [], recentAccuracies: [] });

export function segmentDistanceMeters(a: ActivityPoint, b: ActivityPoint): number {
  const radius = 6_371_000; const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(b.latitude - a.latitude); const longitudeDelta = radians(b.longitude - a.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function routeDistanceMeters(points: readonly ActivityPoint[]): number {
  return points.slice(1).reduce((total, point, index) => total + (point.breakBefore ? 0 : segmentDistanceMeters(points[index]!, point)), 0);
}

export function splitRouteAtGaps(points: readonly ActivityPoint[]): ActivityPoint[][] {
  return points.reduce<ActivityPoint[][]>((segments, point) => {
    if (!segments.length || point.breakBefore) segments.push([point]);
    else segments.at(-1)!.push(point);
    return segments;
  }, []);
}

const validCoordinate = (point: ActivityPoint) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
const accuracyOf = (point: ActivityPoint) => point.accuracy ?? GPS_FILTER.maximumAccuracyMeters;

function baseDecision(point: ActivityPoint, previous: ActivityPoint | undefined, type: OutdoorActivityType): PointDecision {
  if (!validCoordinate(point)) return { accepted: false, reason: 'invalid-coordinate' };
  if (accuracyOf(point) > GPS_FILTER.maximumAccuracyMeters) return { accepted: false, reason: 'poor-accuracy' };
  if (!previous) return { accepted: true, reason: 'accepted' };
  const elapsed = (point.timestamp - previous.timestamp) / 1000;
  if (elapsed < GPS_FILTER.minimumIntervalMs / 1000) return { accepted: false, reason: 'duplicate-timestamp' };
  if (elapsed > GPS_FILTER.gapIntervalMs / 1000) return { accepted: true, reason: 'gps-gap' };
  const distance = segmentDistanceMeters(previous, point);
  const noiseRadius = Math.max(GPS_FILTER.minimumMovementMeters, Math.min(accuracyOf(previous), accuracyOf(point)) * GPS_FILTER.accuracyNoiseRatio);
  if (distance <= noiseRadius) return { accepted: false, reason: 'stationary-drift' };
  const maximumSpeed = GPS_FILTER.maximumSpeedMetersPerSecond[type]; const calculatedSpeed = distance / elapsed;
  if (point.speed !== undefined && point.speed > maximumSpeed) return { accepted: false, reason: 'reported-speed' };
  if (calculatedSpeed > maximumSpeed) return { accepted: false, reason: 'impossible-speed' };
  return { accepted: true, reason: 'accepted' };
}

export function assessPoint(point: ActivityPoint, previous: ActivityPoint | undefined, type: OutdoorActivityType): PointDecision {
  return baseDecision(point, previous, type);
}

function bearing(a: ActivityPoint, b: ActivityPoint) { return Math.atan2(b.longitude - a.longitude, b.latitude - a.latitude) * 180 / Math.PI; }
function bearingDifference(a: number, b: number) { const value = Math.abs(a - b) % 360; return Math.min(value, 360 - value); }

export function processPoint(current: TrackingEngineState, point: ActivityPoint): ProcessResult {
  const state: TrackingEngineState = { ...current, accepted: [...current.accepted], rejected: [...current.rejected], startup: [...current.startup], recentAccuracies: [...current.recentAccuracies, accuracyOf(point)].slice(-GPS_FILTER.qualityWindowSize) };
  const decisions: ProcessResult['decisions'] = [];
  if (state.phase === 'acquiring') {
    const usable = validCoordinate(point) && accuracyOf(point) <= GPS_FILTER.startupAccuracyMeters;
    state.startup = [...state.startup, point].slice(-GPS_FILTER.startupWindowSize);
    const usableWindow = state.startup.filter((sample) => validCoordinate(sample) && accuracyOf(sample) <= GPS_FILTER.startupAccuracyMeters);
    const coherent = usableWindow.every((sample, index) => index === 0 || (
      sample.timestamp > usableWindow[index - 1]!.timestamp
      && segmentDistanceMeters(usableWindow[index - 1]!, sample) <= GPS_FILTER.startupCoherenceMeters
    ));
    if (!usable || usableWindow.length < GPS_FILTER.startupRequiredUsableSamples || !coherent) {
      state.rejected.push(point); decisions.push({ point, decision: { accepted: false, reason: usable ? 'stabilizing' : accuracyOf(point) > GPS_FILTER.startupAccuracyMeters ? 'poor-accuracy' : 'stabilizing' } }); return { state, decisions };
    }
    // Only the reliable point that completes stabilization becomes the route
    // anchor. Acquisition movement is deliberately never connected to it.
    state.phase = 'tracking'; state.accepted.push(point); decisions.push({ point, decision: { accepted: true, reason: 'accepted' } }); return { state, decisions };
  }

  const previous = state.accepted.at(-1);
  if (state.candidate) {
    const candidate = state.candidate; state.candidate = undefined;
    if (previous && segmentDistanceMeters(previous, point) <= GPS_FILTER.spikeReturnRadiusMeters) {
      state.rejected.push(candidate); decisions.push({ point: candidate, decision: { accepted: false, reason: 'isolated-spike' } });
    } else if (previous) {
      const candidateDecision = baseDecision(candidate, previous, state.type); const nextDecision = baseDecision(point, candidate, state.type);
      const directionOkay = bearingDifference(bearing(previous, candidate), bearing(candidate, point)) <= GPS_FILTER.confirmationDirectionDegrees;
      if (candidateDecision.accepted && nextDecision.accepted && directionOkay) {
        state.accepted.push(candidate, point); decisions.push({ point: candidate, decision: { accepted: true, reason: 'accepted' } }, { point, decision: { accepted: true, reason: 'accepted' } }); return { state, decisions };
      }
      state.rejected.push(candidate); decisions.push({ point: candidate, decision: { accepted: false, reason: 'isolated-spike' } });
    }
  }

  const decision = baseDecision(point, previous, state.type);
  if (!decision.accepted) { state.rejected.push(point); decisions.push({ point, decision }); return { state, decisions }; }
  if (decision.reason === 'gps-gap') { state.accepted.push({ ...point, breakBefore: true }); decisions.push({ point, decision }); return { state, decisions }; }
  const distance = previous ? segmentDistanceMeters(previous, point) : 0; const elapsed = previous ? (point.timestamp - previous.timestamp) / 1000 : 1; const speed = distance / elapsed;
  const acceleration = state.previousSpeed === undefined ? 0 : Math.abs(speed - state.previousSpeed) / elapsed;
  const suspicious = distance >= GPS_FILTER.suspiciousSegmentMeters[state.type] || acceleration > GPS_FILTER.maximumAccelerationMetersPerSecondSquared[state.type];
  if (suspicious) { state.candidate = point; decisions.push({ point, decision: { accepted: false, provisional: true, reason: 'provisional' } }); return { state, decisions }; }
  state.previousSpeed = speed; state.accepted.push(point); decisions.push({ point, decision }); return { state, decisions };
}

export function rollingGpsQuality(state: TrackingEngineState): GpsQuality {
  if (state.phase === 'acquiring' || state.recentAccuracies.length < GPS_FILTER.startupRequiredUsableSamples) return 'ACQUIRING';
  const mean = state.recentAccuracies.reduce((sum, value) => sum + value, 0) / state.recentAccuracies.length;
  return mean <= 8 ? 'EXCELLENT' : mean <= 18 ? 'GOOD' : mean <= 30 ? 'FAIR' : 'POOR';
}
