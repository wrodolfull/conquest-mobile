export const LOOT_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type LootRarity = typeof LOOT_RARITIES[number];
export interface LootItem { id:string; name:string; description:string|null; rarity:LootRarity; category:'collectible'; iconKey:string|null }
export interface AuthoritativeLootGrant { milestoneMeters:number; rarity:LootRarity; item:LootItem }
export interface InventoryItem extends LootItem { quantity:number; firstAcquiredAt:string; lastAcquiredAt:string }
export const LOOT_MILESTONES: ReadonlyArray<{milestoneMeters:number;rarity:LootRarity}> = [
  {milestoneMeters:1000,rarity:'common'},{milestoneMeters:2000,rarity:'uncommon'},{milestoneMeters:3000,rarity:'rare'},
  {milestoneMeters:5000,rarity:'epic'},{milestoneMeters:10000,rarity:'legendary'},
];
export const pendingMilestones = (distanceMeters:number) => LOOT_MILESTONES.filter(({milestoneMeters})=>distanceMeters>=milestoneMeters);
export const rarityRank = (rarity:LootRarity) => LOOT_RARITIES.indexOf(rarity);
