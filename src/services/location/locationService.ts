import * as Location from 'expo-location';
import type { LatLng } from '../../features/map/mapbox/geoJsonTypes';

export const FALLBACK_LOCATION: LatLng = {
  latitude: -22.9698,
  longitude: -46.9974,
};

export interface PlayerLocationResult {
  coordinate: LatLng;
  accuracy: number | null;
  isFallback: boolean;
  permissionDenied: boolean;
}

const LOCATION_TIMEOUT_MS = 8_000;

function withTimeout<T>(operation: Promise<T>): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error('Location request timed out')),
        LOCATION_TIMEOUT_MS,
      ),
    ),
  ]);
}

export async function getPlayerLocation(): Promise<PlayerLocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      return {
        coordinate: FALLBACK_LOCATION,
        accuracy: null,
        isFallback: true,
        permissionDenied: true,
      };
    }

    const lastKnown = await Location.getLastKnownPositionAsync();

    const location =
      lastKnown ??
      (await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
      ));

    return {
      coordinate: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      accuracy: location.coords.accuracy,
      isFallback: false,
      permissionDenied: false,
    };
  } catch {
    return {
      coordinate: FALLBACK_LOCATION,
      accuracy: null,
      isFallback: true,
      permissionDenied: false,
    };
  }
}
