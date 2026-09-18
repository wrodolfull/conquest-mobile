import type { ActivityPoint, OutdoorActivityType } from './tracking';

export const INFLUENCE_METERS_PER_POINT = 100;
export const DISTANCE_MILESTONES = [
  { distanceKm: 1, rarity: 'Common' }, { distanceKm: 2, rarity: 'Uncommon' },
  { distanceKm: 3, rarity: 'Rare' }, { distanceKm: 5, rarity: 'Epic' },
  { distanceKm: 10, rarity: 'Legendary' },
] as const;

export interface TerritoryTraversal { territoryId: string; territoryName: string; distanceMeters: number; influenceEarned: number }
export interface CompletedOutdoorActivity {
  id: string; type: OutdoorActivityType; startedAt: number; endedAt: number; durationSeconds: number;
  distanceMeters: number; route: ActivityPoint[]; traversals: TerritoryTraversal[]; influenceEarned: number;
  unlockedRewards: string[]; energyEarned: number; xpEarned: number;
}

export const influenceForDistance = (meters: number) => Math.floor(Math.max(0, meters) / INFLUENCE_METERS_PER_POINT);
export const rewardsForDistance = (meters: number) => DISTANCE_MILESTONES.filter((item) => meters >= item.distanceKm * 1000);

// The existing local world is a lightweight geographic grid rather than H3. Segment
// midpoints are quantized to its approximately 380m territory footprint.
export function territoryAt(latitude: number, longitude: number) {
  const latBand = Math.floor((latitude + 90) / 0.0034);
  const longitudeScale = Math.max(0.2, Math.cos(latitude * Math.PI / 180));
  const lonBand = Math.floor((longitude + 180) * longitudeScale / 0.0034);
  const id = `local-${latBand}-${lonBand}`;
  const number = 1800 + Math.abs((latBand * 31 + lonBand * 17) % 700);
  return { id, name: `Jardim #${number}` };
}

export function calculateTraversals(points: readonly ActivityPoint[]): TerritoryTraversal[] {
  const distances = new Map<string, { name: string; meters: number }>();
  points.slice(1).forEach((point, index) => {
    const previous = points[index]!;
    const territory = territoryAt((previous.latitude + point.latitude) / 2, (previous.longitude + point.longitude) / 2);
    const current = distances.get(territory.id) ?? { name: territory.name, meters: 0 };
    current.meters += haversine(previous, point);
    distances.set(territory.id, current);
  });
  return [...distances].map(([territoryId, value]) => ({ territoryId, territoryName: value.name, distanceMeters: value.meters, influenceEarned: influenceForDistance(value.meters) }));
}

function haversine(a: ActivityPoint, b: ActivityPoint) {
  const r = 6_371_000; const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad; const dLon = (b.longitude - a.longitude) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
