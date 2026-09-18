import { POI_GEOFENCE_DEFAULTS } from './config';
import { distanceMeters } from './poiRules';
import type { Coordinate, GamePoi, PoiProvider } from './types';

function offset(origin: Coordinate, eastMeters: number, northMeters: number): Coordinate {
  const latitude = origin.latitude + northMeters / 110_574;
  const longitude = origin.longitude + eastMeters / (111_320 * Math.cos(origin.latitude * Math.PI / 180));
  return { latitude, longitude };
}

export class MockPoiProvider implements PoiProvider {
  private origin?: Coordinate;
  private pois: GamePoi[] = [];

  async getNearbyPois(location: Coordinate, radiusMeters: number): Promise<GamePoi[]> {
    if (!this.origin) {
      this.origin = location;
      this.pois = [
        { id: 'mock-gym', type: 'arena', name: 'Mock Gym', ...offset(location, 260, 90), ...POI_GEOFENCE_DEFAULTS, metadata: { source: 'local-mock' } },
        { id: 'mock-training-park', type: 'training_ground', name: 'Mock Training Park', ...offset(location, -390, 170), ...POI_GEOFENCE_DEFAULTS, metadata: { source: 'local-mock' } },
      ];
    }
    return this.pois.filter((poi) => distanceMeters(location, poi) <= radiusMeters);
  }
}

export const mockPoiProvider = new MockPoiProvider();
