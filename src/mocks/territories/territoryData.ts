import type { TerritoryOwner, TerritoryStatus } from '@/features/territories/types';

export interface TerritoryGameSeed {
  owner: TerritoryOwner;
  ownerId: string | null;
  controlPercentage: number;
  playerInfluence: number;
  status: TerritoryStatus;
}

const owners: Record<Exclude<TerritoryOwner, 'Neutral'>, string> = {
  Rodolfo: 'player-rodolfo', Lucas: 'rival-lucas', Mariana: 'rival-mariana', Bruno: 'rival-bruno',
};

const territoryPattern: [TerritoryOwner, number, number, TerritoryStatus][] = [
  ['Rodolfo', 74, 74, 'player'], ['Lucas', 68, 21, 'contested'], ['Mariana', 81, 8, 'enemy'],
  ['Neutral', 0, 4, 'neutral'], ['Bruno', 55, 26, 'contested'], ['Lucas', 77, 12, 'enemy'],
  ['Rodolfo', 62, 62, 'player'], ['Neutral', 0, 9, 'neutral'], ['Mariana', 58, 24, 'contested'],
  ['Bruno', 83, 5, 'enemy'], ['Lucas', 49, 31, 'contested'], ['Neutral', 0, 2, 'neutral'],
];

export function getTerritoryGameSeed(index: number): TerritoryGameSeed {
  const [owner, controlPercentage, playerInfluence, status] = territoryPattern[index % territoryPattern.length]!;
  return { owner, ownerId: owner === 'Neutral' ? null : owners[owner], controlPercentage, playerInfluence, status };
}
