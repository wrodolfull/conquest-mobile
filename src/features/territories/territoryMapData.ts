import type { LatLng } from '../map/mapbox/geoJsonTypes';
import { generateTerritories } from './territoryGenerator';
import type { TerritoryCell } from './territoryGrid';
import type { WorldViewport } from './types';

export const WORLD_VIEWPORT_MAX_DEGREES = 0.25;

export function worldViewportForRegion(region: LatLng & { latitudeDelta: number; longitudeDelta: number }): WorldViewport | null {
  if (region.latitudeDelta <= 0 || region.longitudeDelta <= 0
    || region.latitudeDelta > WORLD_VIEWPORT_MAX_DEGREES
    || region.longitudeDelta > WORLD_VIEWPORT_MAX_DEGREES) return null;
  const viewport = {
    west: region.longitude - region.longitudeDelta / 2,
    east: region.longitude + region.longitudeDelta / 2,
    south: region.latitude - region.latitudeDelta / 2,
    north: region.latitude + region.latitudeDelta / 2,
  };
  return viewport.west >= -180 && viewport.east <= 180 && viewport.south >= -85 && viewport.north <= 85
    ? viewport
    : null;
}

/** Atomic cells are candidates for diagnostics only; the production map uses world regions. */
export function territoryCandidatesForLocation(location: LatLng | null | undefined, locationDenied: boolean): TerritoryCell[] {
  return location && !locationDenied ? generateTerritories(location) : [];
}

export function territoryGridDebugEnabled(isDev: boolean, flag: string | undefined): boolean {
  return isDev && flag === 'true';
}
