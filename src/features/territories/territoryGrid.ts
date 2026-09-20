import type { LatLng } from '../map/mapbox/geoJsonTypes';

const EARTH_RADIUS_METERS = 6_378_137;
export const TERRITORY_RADIUS_METERS = 190;

export interface TerritoryCell {
  id: string;
  name: string;
  q: number;
  r: number;
  center: LatLng;
  boundary: LatLng[];
}

const toRadians = (degrees: number) => degrees * Math.PI / 180;
const toDegrees = (radians: number) => radians * 180 / Math.PI;

function project(coordinate: LatLng) {
  const latitude = Math.max(-85, Math.min(85, coordinate.latitude));
  return {
    x: EARTH_RADIUS_METERS * toRadians(coordinate.longitude),
    y: EARTH_RADIUS_METERS * Math.log(Math.tan(Math.PI / 4 + toRadians(latitude) / 2)),
  };
}

function unproject(x: number, y: number): LatLng {
  return {
    latitude: toDegrees(2 * Math.atan(Math.exp(y / EARTH_RADIUS_METERS)) - Math.PI / 2),
    longitude: toDegrees(x / EARTH_RADIUS_METERS),
  };
}

function roundAxial(q: number, r: number): { q: number; r: number } {
  let roundedQ = Math.round(q);
  let roundedR = Math.round(r);
  const roundedS = Math.round(-q - r);
  const qDifference = Math.abs(roundedQ - q);
  const rDifference = Math.abs(roundedR - r);
  const sDifference = Math.abs(roundedS + q + r);

  if (qDifference > rDifference && qDifference > sDifference) roundedQ = -roundedR - roundedS;
  else if (rDifference > sDifference) roundedR = -roundedQ - roundedS;
  return { q: roundedQ, r: roundedR };
}

export function territoryCoordinatesAt(coordinate: LatLng): { q: number; r: number } {
  const { x, y } = project(coordinate);
  return roundAxial(
    (Math.sqrt(3) / 3 * x - y / 3) / TERRITORY_RADIUS_METERS,
    (2 * y / 3) / TERRITORY_RADIUS_METERS,
  );
}

export function territoryId(q: number, r: number): string {
  return `local-${q}-${r}`;
}

export function territoryName(q: number, r: number): string {
  const hash = Math.abs((q * 31 + r * 17) % 700);
  return `Jardim #${1800 + hash}`;
}

export function territoryCell(q: number, r: number): TerritoryCell {
  const centerX = TERRITORY_RADIUS_METERS * Math.sqrt(3) * (q + r / 2);
  const centerY = TERRITORY_RADIUS_METERS * 1.5 * r;
  return {
    id: territoryId(q, r),
    name: territoryName(q, r),
    q,
    r,
    center: unproject(centerX, centerY),
    boundary: Array.from({ length: 6 }, (_, index) => {
      const angle = toRadians(60 * index - 30);
      return unproject(
        centerX + TERRITORY_RADIUS_METERS * Math.cos(angle),
        centerY + TERRITORY_RADIUS_METERS * Math.sin(angle),
      );
    }),
  };
}

export function territoryAt(coordinate: LatLng): TerritoryCell {
  const { q, r } = territoryCoordinatesAt(coordinate);
  return territoryCell(q, r);
}
