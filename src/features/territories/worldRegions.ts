import type { LatLng } from 'react-native-maps';
import type { MapTerritory, TerritoryGeometry, TerritoryStatus } from './types';

export interface WorldRegionRow {
  region_id: string;
  owner_user_id: string | null;
  owner_display_name: string | null;
  geometry: TerritoryGeometry;
  total_influence: number;
  owner_influence: number;
  my_influence: number;
  control_percentage: number;
  territory_count: number;
  status: TerritoryStatus;
}

const statuses: readonly TerritoryStatus[] = ['neutral', 'owned', 'contested', 'rival'];
const point = ([longitude, latitude]: [number, number]): LatLng => ({ latitude, longitude });

export function isWorldRegionRow(value: unknown): value is WorldRegionRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<WorldRegionRow>;
  const geometry = row.geometry;
  return typeof row.region_id === 'string'
    && (row.owner_user_id === null || typeof row.owner_user_id === 'string')
    && (row.owner_display_name === null || typeof row.owner_display_name === 'string')
    && !!geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')
    && Array.isArray(geometry.coordinates)
    && statuses.some((status) => status === row.status)
    && [row.total_influence, row.owner_influence, row.my_influence, row.control_percentage, row.territory_count]
      .every((number) => typeof number === 'number' && Number.isFinite(number));
}

export function mapWorldRegion(row: WorldRegionRow, source: MapTerritory['source']): MapTerritory {
  const polygons = row.geometry.type === 'Polygon' ? [row.geometry.coordinates] : row.geometry.coordinates;
  return {
    id: row.region_id,
    ownerUserId: row.owner_user_id,
    ownerDisplayName: row.owner_display_name,
    ownerInfluencePoints: row.owner_influence,
    totalInfluencePoints: row.total_influence,
    myInfluencePoints: row.my_influence,
    controlPercentage: row.control_percentage,
    territoryCount: row.territory_count,
    status: row.status,
    geometryType: row.geometry.type,
    polygons: polygons.flatMap((rings) => rings.length ? [{ outer: rings[0]!.map(point), holes: rings.slice(1).map((ring) => ring.map(point)) }] : []),
    source,
  };
}

export function viewportKey({ west, south, east, north }: {west:number;south:number;east:number;north:number}): string {
  return [west, south, east, north].map((value) => value.toFixed(4)).join(':');
}
