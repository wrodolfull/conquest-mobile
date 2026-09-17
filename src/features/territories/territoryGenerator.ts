import type { LatLng } from 'react-native-maps';
import { getTerritoryGameSeed } from '@/mocks/territories/territoryData';
import type { MapArena, MapTerritory } from './types';

// This small hex-grid adapter keeps geographic generation independent from rendering.
// It can be replaced with H3's gridDisk/cellToBoundary when the project adopts H3.
const HEX_RADIUS_KM = 0.19;
const EARTH_LAT_KM = 110.574;

function offsetCoordinate(origin: LatLng, eastKm: number, northKm: number): LatLng {
  const longitudeKm = 111.32 * Math.cos(origin.latitude * Math.PI / 180);
  return { latitude: origin.latitude + northKm / EARTH_LAT_KM, longitude: origin.longitude + eastKm / longitudeKm };
}

function createBoundary(center: LatLng): LatLng[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (60 * index - 30) * Math.PI / 180;
    return offsetCoordinate(center, HEX_RADIUS_KM * Math.cos(angle), HEX_RADIUS_KM * Math.sin(angle));
  });
}

export function generateTerritories(origin: LatLng): MapTerritory[] {
  const cells: [number, number][] = [];
  for (let q = -2; q <= 2; q += 1) {
    const rMin = Math.max(-2, -q - 2);
    const rMax = Math.min(2, -q + 2);
    for (let r = rMin; r <= rMax; r += 1) cells.push([q, r]);
  }

  return cells.map(([q, r], index) => {
    const center = offsetCoordinate(origin, HEX_RADIUS_KM * Math.sqrt(3) * (q + r / 2), HEX_RADIUS_KM * 1.5 * r);
    const gameData = getTerritoryGameSeed(index);
    const numericId = 1800 + ((Math.abs(Math.round(origin.latitude * 1000)) + index * 37) % 700);
    return { id: `local-${q}-${r}`, name: `Jardim #${numericId}`, boundary: createBoundary(center), ...gameData };
  });
}

export function generateArenas(origin: LatLng): MapArena[] {
  return [
    { id: 'arena-pulse', name: 'Pulse Training Arena', coordinate: offsetCoordinate(origin, 0.34, 0.22), distance: '410 m', level: 3, weeklyCompetitors: 14, playerRanking: 6 },
    { id: 'arena-forge', name: 'Iron Forge Arena', coordinate: offsetCoordinate(origin, -0.42, -0.18), distance: '520 m', level: 5, weeklyCompetitors: 27, playerRanking: 11 },
  ];
}
