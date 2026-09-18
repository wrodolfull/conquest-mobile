import type { LatLng } from 'react-native-maps';
import { getTerritoryGameSeed } from '@/mocks/territories/territoryData';
import type { MapArena, MapTerritory } from './types';
import { territoryAt, territoryCell } from './territoryGrid';

// This small hex-grid adapter keeps geographic generation independent from rendering.
// It can be replaced with H3's gridDisk/cellToBoundary when the project adopts H3.
const EARTH_LAT_KM = 110.574;

function offsetCoordinate(origin: LatLng, eastKm: number, northKm: number): LatLng {
  const longitudeKm = 111.32 * Math.cos(origin.latitude * Math.PI / 180);
  return { latitude: origin.latitude + northKm / EARTH_LAT_KM, longitude: origin.longitude + eastKm / longitudeKm };
}

export function generateTerritories(origin: LatLng): MapTerritory[] {
  const cells: [number, number][] = [];
  for (let q = -2; q <= 2; q += 1) {
    const rMin = Math.max(-2, -q - 2);
    const rMax = Math.min(2, -q + 2);
    for (let r = rMin; r <= rMax; r += 1) cells.push([q, r]);
  }

  const originCell = territoryAt(origin);
  return cells.map(([qOffset, rOffset]) => {
    const cell = territoryCell(originCell.q + qOffset, originCell.r + rOffset);
    const gameData = getTerritoryGameSeed(Math.abs(cell.q * 31 + cell.r * 17));
    return { id: cell.id, name: cell.name, boundary: cell.boundary, ...gameData };
  });
}

export function generateArenas(origin: LatLng): MapArena[] {
  return [
    { id: 'arena-pulse', name: 'Pulse Training Arena', coordinate: offsetCoordinate(origin, 0.34, 0.22), distance: '410 m', level: 3, weeklyCompetitors: 14, playerRanking: 6 },
    { id: 'arena-forge', name: 'Iron Forge Arena', coordinate: offsetCoordinate(origin, -0.42, -0.18), distance: '520 m', level: 5, weeklyCompetitors: 27, playerRanking: 11 },
  ];
}
