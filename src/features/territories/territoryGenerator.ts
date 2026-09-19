import type { LatLng } from 'react-native-maps';
import type { MapTerritory } from './types';
import { territoryAt, territoryCell } from './territoryGrid';

const CANDIDATE_RADIUS = 2;

/**
 * Builds the deterministic cells that may have authoritative state nearby.
 *
 * The neutral values are only a type-safe query candidate. They must not be
 * treated as world state or rendered unless the repository returns a snapshot.
 */
export function generateTerritories(origin: LatLng): MapTerritory[] {
  const originCell = territoryAt(origin);
  const territories: MapTerritory[] = [];

  for (let qOffset = -CANDIDATE_RADIUS; qOffset <= CANDIDATE_RADIUS; qOffset += 1) {
    const rMin = Math.max(-CANDIDATE_RADIUS, -qOffset - CANDIDATE_RADIUS);
    const rMax = Math.min(CANDIDATE_RADIUS, -qOffset + CANDIDATE_RADIUS);

    for (let rOffset = rMin; rOffset <= rMax; rOffset += 1) {
      const cell = territoryCell(originCell.q + qOffset, originCell.r + rOffset);
      territories.push({
        id: cell.id,
        name: cell.name,
        boundary: cell.boundary,
        ownerUserId: null,
        ownerDisplayName: null,
        ownerInfluencePoints: 0,
        totalInfluencePoints: 0,
        myInfluencePoints: 0,
        controlPercentage: 0,
        status: 'neutral',
      });
    }
  }

  return territories;
}
