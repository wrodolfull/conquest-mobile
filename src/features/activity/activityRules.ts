import type { ActivityType, DistanceMilestone } from '@/types/game';

export const distanceMilestones: DistanceMilestone[] = [
  { distance: 1, rarity: 'Common' },
  { distance: 2, rarity: 'Uncommon' },
  { distance: 3, rarity: 'Rare' },
  { distance: 5, rarity: 'Epic' },
  { distance: 10, rarity: 'Legendary' },
];

const distancePerTick: Record<Exclude<ActivityType, 'indoor'>, number> = {
  walking: 0.18,
  running: 0.28,
  cycling: 0.52,
};

export function isActivityType(value: string | string[] | undefined): value is ActivityType {
  return typeof value === 'string' && ['walking', 'running', 'cycling', 'indoor'].includes(value);
}

export function getSimulatedDistance(type: ActivityType, ticks: number): number {
  return type === 'indoor' ? 0 : Number((ticks * distancePerTick[type]).toFixed(2));
}

export function reachedMilestones(distance: number): DistanceMilestone[] {
  return distanceMilestones.filter((milestone) => distance >= milestone.distance);
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
