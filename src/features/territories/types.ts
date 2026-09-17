import type { LatLng } from 'react-native-maps';

export type TerritoryStatus = 'player' | 'enemy' | 'neutral' | 'contested';
export type TerritoryOwner = 'Rodolfo' | 'Lucas' | 'Mariana' | 'Bruno' | 'Neutral';

export interface MapTerritory {
  id: string;
  name: string;
  owner: TerritoryOwner;
  ownerId: string | null;
  controlPercentage: number;
  playerInfluence: number;
  status: TerritoryStatus;
  boundary: LatLng[];
}

export interface MapArena {
  id: string;
  name: string;
  coordinate: LatLng;
  distance: string;
  level: number;
  weeklyCompetitors: number;
  playerRanking: number;
}
