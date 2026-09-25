import type { MapState } from '@rnmapbox/maps';
import type { WorldViewport } from '../territories/types';

export const TERRITORY_DETAIL_MIN_ZOOM = 14;
export const TERRITORY_VIEWPORT_PADDING_RATIO = 0.2;
export const TERRITORY_ROUTE_DISPLAY_POINT_BUDGET = 800;
export const WORLD_VIEWPORT_MAX_DEGREES = 0.25;

const MIN_LATITUDE = -85;
const MAX_LATITUDE = 85;

export function territoryDetailEnabled(zoom: number): boolean {
  return Number.isFinite(zoom) && zoom >= TERRITORY_DETAIL_MIN_ZOOM;
}

export function isValidWorldViewport(viewport: WorldViewport): boolean {
  const { west, south, east, north } = viewport;
  return [west, south, east, north].every(Number.isFinite)
    && west >= -180 && east <= 180 && south >= MIN_LATITUDE && north <= MAX_LATITUDE
    && west < east && south < north
    && east - west <= WORLD_VIEWPORT_MAX_DEGREES
    && north - south <= WORLD_VIEWPORT_MAX_DEGREES;
}

export function viewportFromMapState(state: MapState): WorldViewport | null {
  const { ne, sw } = state.properties.bounds;
  if (ne.length < 2 || sw.length < 2) return null;
  const viewport = { west: sw[0]!, south: sw[1]!, east: ne[0]!, north: ne[1]! };
  return isValidWorldViewport(viewport) ? viewport : null;
}

const paddedAxis = (low: number, high: number, minimum: number, maximum: number): [number, number] | null => {
  const size = high - low;
  if (!(size > 0) || size > WORLD_VIEWPORT_MAX_DEGREES) return null;
  const targetSize = Math.min(WORLD_VIEWPORT_MAX_DEGREES, size * (1 + TERRITORY_VIEWPORT_PADDING_RATIO * 2));
  let paddedLow = low - (targetSize - size) / 2;
  let paddedHigh = high + (targetSize - size) / 2;
  if (paddedLow < minimum) { paddedHigh += minimum - paddedLow; paddedLow = minimum; }
  if (paddedHigh > maximum) { paddedLow -= paddedHigh - maximum; paddedHigh = maximum; }
  return [Math.max(minimum, paddedLow), Math.min(maximum, paddedHigh)];
};

export function paddedTerritoryViewport(visible: WorldViewport): WorldViewport | null {
  if (!isValidWorldViewport(visible)) return null;
  const longitude = paddedAxis(visible.west, visible.east, -180, 180);
  const latitude = paddedAxis(visible.south, visible.north, MIN_LATITUDE, MAX_LATITUDE);
  if (!longitude || !latitude) return null;
  const viewport = { west: longitude[0], east: longitude[1], south: latitude[0], north: latitude[1] };
  return isValidWorldViewport(viewport) ? viewport : null;
}

export function viewportContains(coverage: WorldViewport | null, visible: WorldViewport): boolean {
  return !!coverage && coverage.west <= visible.west && coverage.east >= visible.east
    && coverage.south <= visible.south && coverage.north >= visible.north;
}

export function isLatestTerritoryRequest(responseGeneration: number, currentGeneration: number): boolean {
  return responseGeneration === currentGeneration;
}

export function selectedTerritoryFilter(regionId: string): ['==', ['get', 'regionId'], string] {
  return ['==', ['get', 'regionId'], regionId];
}
