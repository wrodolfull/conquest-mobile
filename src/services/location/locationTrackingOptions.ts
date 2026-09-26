import * as Location from 'expo-location';
import type { ActivityPoint } from '@/features/activity/tracking';

export function fromLocation(location: Location.LocationObject): ActivityPoint {
  const optional = (value: number | null) => value === null || value < 0 ? undefined : value;
  return { latitude: location.coords.latitude, longitude: location.coords.longitude, timestamp: location.timestamp, accuracy: optional(location.coords.accuracy), altitude: optional(location.coords.altitude), speed: optional(location.coords.speed), heading: optional(location.coords.heading) };
}

export const LOCATION_OPTIONS: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  distanceInterval: 3,
  timeInterval: 1_000,
  pausesUpdatesAutomatically: false,
  activityType: Location.ActivityType.Fitness,
  showsBackgroundLocationIndicator: true,
  foregroundService: { notificationTitle: 'RUQEST activity in progress', notificationBody: 'Your route is still being recorded.', killServiceOnDestroy: false },
};
