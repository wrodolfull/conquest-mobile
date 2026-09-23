import type { MapTerritory } from '../territories/types';

const RIVAL_PALETTE = ['#40D9FF', '#A977FF', '#FF9B4A', '#FF625B', '#4D8CFF'] as const;
const NEUTRAL_COLOR = '#A2ADA9';
const OWNED_COLOR = '#BDFB46';
const CONTESTED_COLOR = '#FFD166';
const TERRITORY_STATUSES = ['owned', 'rival', 'neutral', 'contested'] as const;

export interface TerritoryVisual {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
}

export function territoryStatusLabel(status: unknown): string {
  return typeof status === 'string' && TERRITORY_STATUSES.some((value) => value === status)
    ? status.toUpperCase()
    : 'UNKNOWN';
}

export function rivalColor(ownerUserId: string): string {
  let hash = 2166136261;
  for (let index = 0; index < ownerUserId.length; index += 1) {
    hash ^= ownerUserId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return RIVAL_PALETTE[(hash >>> 0) % RIVAL_PALETTE.length]!;
}

export function territoryVisual(territory: MapTerritory, selected = false): TerritoryVisual {
  if (territory.status === 'neutral') {
    return {
      fillColor: NEUTRAL_COLOR,
      fillOpacity: 0,
      strokeColor: NEUTRAL_COLOR,
      strokeOpacity: selected ? 0.28 : 0.16,
      strokeWidth: selected ? 1.5 : 0.7,
    };
  }

  const color = territory.status === 'owned'
    ? OWNED_COLOR
    : territory.status === 'contested'
      ? CONTESTED_COLOR
      : rivalColor(territory.ownerUserId ?? 'unknown-rival');
  const contested = territory.status === 'contested';

  return {
    fillColor: color,
    fillOpacity: selected ? 0.23 : contested ? 0.16 : territory.status === 'owned' ? 0.16 : 0.14,
    strokeColor: color,
    strokeOpacity: selected ? 0.85 : contested ? 0.8 : territory.status === 'owned' ? 0.7 : 0.64,
    strokeWidth: selected ? 2 : contested ? 1.8 : 1.2,
  };
}
