// eslint-disable-next-line import/no-unresolved
import * as Location from 'expo-location';
import type { LatLng } from 'react-native-maps';

export const FALLBACK_LOCATION: LatLng = { latitude: -22.9698, longitude: -46.9974 };

export interface PlayerLocationResult {
  coordinate: LatLng;
  isFallback: boolean;
  permissionDenied: boolean;
}

export async function getPlayerLocation(): Promise<PlayerLocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return { coordinate: FALLBACK_LOCATION, isFallback: true, permissionDenied: true };
    }

    const lastKnown = await Location.getLastKnownPositionAsync();
    const location = lastKnown ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      coordinate: { latitude: location.coords.latitude, longitude: location.coords.longitude },
      isFallback: false,
      permissionDenied: false,
    };
  } catch {
    return { coordinate: FALLBACK_LOCATION, isFallback: true, permissionDenied: false };
  }
}
