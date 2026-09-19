import type { LatLng } from 'react-native-maps';

export type TerritoryStatus = 'neutral' | 'owned' | 'contested' | 'rival';
export type RegionSource = 'server' | 'cache';
export type GeoJsonPosition = [longitude: number, latitude: number];
export type TerritoryGeometry =
  | { type: 'Polygon'; coordinates: GeoJsonPosition[][] }
  | { type: 'MultiPolygon'; coordinates: GeoJsonPosition[][][] };

export interface RegionPolygon {
  outer: LatLng[];
  holes: LatLng[][];
}

/** A display-only aggregate. Persistent gameplay continues to target atomic territory ids. */
export interface MapTerritory {
  id: string;
  ownerUserId: string | null;
  ownerDisplayName: string | null;
  ownerInfluencePoints: number;
  totalInfluencePoints: number;
  myInfluencePoints: number;
  controlPercentage: number;
  territoryCount: number;
  status: TerritoryStatus;
  geometryType: TerritoryGeometry['type'];
  polygons: RegionPolygon[];
  source: RegionSource;
}

export interface WorldViewport {
  west: number;
  south: number;
  east: number;
  north: number;
}
