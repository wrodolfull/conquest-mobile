export type PoiType = 'arena' | 'training_ground';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface GamePoi extends Coordinate {
  id: string;
  type: PoiType;
  name: string;
  enterRadiusMeters: number;
  exitRadiusMeters: number;
  gracePeriodSeconds: number;
  metadata?: { source?: string };
}

export interface PoiProvider {
  getNearbyPois(location: Coordinate, radiusMeters: number): Promise<GamePoi[]>;
}

export type GeofenceStatus = 'outside' | 'inside' | 'exit_pending';
export interface PoiPresence {
  poi: GamePoi;
  status: GeofenceStatus;
  distanceMeters: number;
  exitPendingSince?: number;
}
