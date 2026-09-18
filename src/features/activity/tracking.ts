import * as Location from 'expo-location';
import type { ActivityType } from '@/types/game';

export type OutdoorActivityType = Exclude<ActivityType, 'indoor'>;

export interface ActivityPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface PointDecision { accepted: boolean; reason?: string }

export const GPS_FILTER = {
  maximumAccuracyMeters: 50,
  minimumIntervalMs: 750,
  maximumSpeedMetersPerSecond: { walking: 4.5, running: 9, cycling: 22 } satisfies Record<OutdoorActivityType, number>,
} as const;

export function fromLocation(location: Location.LocationObject): ActivityPoint {
  const optional = (value: number | null) => value === null || value < 0 ? undefined : value;
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    timestamp: location.timestamp,
    accuracy: optional(location.coords.accuracy),
    altitude: optional(location.coords.altitude),
    speed: optional(location.coords.speed),
    heading: optional(location.coords.heading),
  };
}

export function segmentDistanceMeters(a: ActivityPoint, b: ActivityPoint): number {
  const radius = 6_371_000;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function routeDistanceMeters(points: readonly ActivityPoint[]): number {
  return points.slice(1).reduce((total, point, index) => total + segmentDistanceMeters(points[index]!, point), 0);
}

export function assessPoint(point: ActivityPoint, previous: ActivityPoint | undefined, type: OutdoorActivityType): PointDecision {
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) || Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180) return { accepted: false, reason: 'invalid-coordinate' };
  if (point.accuracy !== undefined && point.accuracy > GPS_FILTER.maximumAccuracyMeters) return { accepted: false, reason: 'poor-accuracy' };
  if (!previous) return { accepted: true };
  const elapsedSeconds = (point.timestamp - previous.timestamp) / 1000;
  if (elapsedSeconds < GPS_FILTER.minimumIntervalMs / 1000) return { accepted: false, reason: 'duplicate-timestamp' };
  const speed = segmentDistanceMeters(previous, point) / elapsedSeconds;
  return speed <= GPS_FILTER.maximumSpeedMetersPerSecond[type] ? { accepted: true } : { accepted: false, reason: 'impossible-speed' };
}

export const gpsQuality = (accuracy?: number) => accuracy === undefined ? 'Waiting' : accuracy <= 10 ? 'Excellent' : accuracy <= 25 ? 'Good' : accuracy <= 50 ? 'Fair' : 'Poor';

export const LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  distanceInterval: 3,
  timeInterval: 1_000,
};
