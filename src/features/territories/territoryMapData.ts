import type { LatLng } from 'react-native-maps';
import { generateTerritories } from './territoryGenerator';
import type { TerritoryCell } from './territoryGrid';

/** Atomic cells are candidates for diagnostics only; the production map uses world regions. */
export function territoryCandidatesForLocation(location: LatLng | null | undefined, locationDenied: boolean): TerritoryCell[] {
  return location && !locationDenied ? generateTerritories(location) : [];
}

export function territoryGridDebugEnabled(isDev: boolean, flag: string | undefined): boolean {
  return isDev && flag === 'true';
}
