interface ShareableActivity {
  type: 'walking' | 'running' | 'cycling';
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  distanceMeters: number; durationSeconds: number; xpEarned: number; energyEarned: number; influenceEarned: number; endedAt: number;
  traversals: readonly unknown[];
  authoritativeDistanceMeters?: number; authoritativeXpEarned?: number; authoritativeEnergyEarned?: number; authoritativeInfluenceEarned?: number;
  authoritativeTerritoryImpacts?: readonly unknown[];
  authoritativeLoot?: readonly { item: { name: string } }[];
}

export interface ActivityShareModel {
  activityType: ShareableActivity['type'];
  distanceMeters: number;
  durationSeconds: number;
  xpEarned: number;
  energyEarned: number;
  influenceEarned: number;
  territoriesImpacted: number;
  lootSummary?: string;
  completedAt: number;
  includeRoute: false;
}

/** A deliberately route-free projection of a completed activity for sharing. */
export function createActivityShareModel(activity: ShareableActivity): ActivityShareModel {
  const authoritative = activity.syncStatus === 'synced';
  const impacts = authoritative && activity.authoritativeTerritoryImpacts
    ? activity.authoritativeTerritoryImpacts
    : activity.traversals;
  const loot = authoritative ? activity.authoritativeLoot : undefined;

  return {
    activityType: activity.type,
    distanceMeters: authoritative
      ? activity.authoritativeDistanceMeters ?? activity.distanceMeters
      : activity.distanceMeters,
    durationSeconds: activity.durationSeconds,
    xpEarned: authoritative ? activity.authoritativeXpEarned ?? activity.xpEarned : activity.xpEarned,
    energyEarned: authoritative ? activity.authoritativeEnergyEarned ?? activity.energyEarned : activity.energyEarned,
    influenceEarned: authoritative
      ? activity.authoritativeInfluenceEarned ?? activity.influenceEarned
      : activity.influenceEarned,
    territoriesImpacted: impacts.length,
    lootSummary: loot?.length
      ? loot.map(({ item }) => item.name).join(' · ')
      : undefined,
    completedAt: activity.endedAt,
    includeRoute: false,
  };
}
