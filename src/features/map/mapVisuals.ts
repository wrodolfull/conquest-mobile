import type { MapTerritory } from '../territories/types';

const RIVAL_PALETTE = ['#40D9FF', '#A977FF', '#FF9B4A', '#FF625B', '#4D8CFF'] as const;
const NEUTRAL_COLOR = '#A2ADA9';
const TERRITORY_STATUSES = ['player', 'enemy', 'neutral', 'contested'] as const;

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

export function territoryVisual(territory: MapTerritory) {
  const neutral = territory.status === 'neutral' || territory.ownerUserId === null;
  let color = NEUTRAL_COLOR;
  if (territory.status !== 'neutral' && territory.ownerUserId !== null) {
    color = territory.status === 'player'
      ? '#BDFB46'
      : rivalColor(territory.ownerUserId);
  }

  const contested = !neutral && territory.status === 'contested';
  return {
    fillColor: `${color}${neutral ? '1F' : '42'}`,
    strokeColor: contested ? '#FFF4C7' : `${color}D9`,
    strokeWidth: contested ? 3 : 1.4,
  };
}
