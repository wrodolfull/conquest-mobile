import type { LatLng } from 'react-native-maps';
import { generateTerritories } from './territoryGenerator';
import { geometryRings, type TerritoryGeometry } from './geometry';
import type { MapTerritory } from './types';

interface AuthoritativeTerritorySnapshot {
  territory_id: string;
  name: string;
  geometry: TerritoryGeometry;
  owner_user_id: string | null;
  owner_display_name: string | null;
  owner_influence_points: number;
  total_influence_points: number;
  my_influence_points: number;
  control_percentage: number;
  status: unknown;
}

const TERRITORY_STATUSES: readonly MapTerritory['status'][] = [
  'player',
  'enemy',
  'neutral',
  'contested',
];

function isTerritoryStatus(value: unknown): value is MapTerritory['status'] {
  return TERRITORY_STATUSES.some((status) => status === value);
}

function hasCompleteSnapshot(snapshot: AuthoritativeTerritorySnapshot): boolean {
  const geometry = snapshot.geometry;
  const influenceValues = [
    snapshot.owner_influence_points,
    snapshot.total_influence_points,
    snapshot.my_influence_points,
    snapshot.control_percentage,
  ];
  return typeof snapshot.name === 'string'
    && (snapshot.owner_user_id === null || typeof snapshot.owner_user_id === 'string')
    && (snapshot.owner_display_name === null || typeof snapshot.owner_display_name === 'string')
    && influenceValues.every((value) => typeof value === 'number' && Number.isFinite(value))
    && geometry !== null
    && typeof geometry === 'object'
    && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')
    && Array.isArray(geometry.coordinates);
}

export function territoryCandidatesForLocation(
  location: LatLng | null | undefined,
  locationDenied: boolean,
): MapTerritory[] {
  return location && !locationDenied ? generateTerritories(location) : [];
}

/** Returns only repository-backed world state; local candidates are never playable. */
export function renderableTerritories(
  candidates: readonly MapTerritory[],
  snapshots: ReadonlyMap<string, AuthoritativeTerritorySnapshot>,
): MapTerritory[] {
  return candidates.flatMap((candidate) => {
    const snapshot = snapshots.get(candidate.id);
    if (!snapshot || !hasCompleteSnapshot(snapshot)) return [];

    // An ownerless snapshot is neutral even if stale cached data contains a
    // contradictory status. This also keeps map styling safe at the data edge.
    const status = snapshot.owner_user_id === null ? 'neutral' : snapshot.status;
    if (!isTerritoryStatus(status)) return [];
    const authoritativeRing = geometryRings(snapshot.geometry)[0];
    return [{
      ...candidate,
      name: snapshot.name,
      ownerUserId: snapshot.owner_user_id,
      ownerDisplayName: snapshot.owner_display_name,
      ownerInfluencePoints: snapshot.owner_influence_points,
      totalInfluencePoints: snapshot.total_influence_points,
      myInfluencePoints: snapshot.my_influence_points,
      controlPercentage: snapshot.control_percentage,
      status,
      boundary: authoritativeRing?.length ? authoritativeRing : candidate.boundary,
    }];
  });
}
