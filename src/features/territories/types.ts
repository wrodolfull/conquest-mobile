import type { LatLng } from 'react-native-maps';
export type TerritoryStatus = 'player' | 'enemy' | 'neutral' | 'contested';
export interface MapTerritory { id:string; name:string; ownerUserId:string|null; ownerDisplayName:string|null; ownerInfluencePoints:number; totalInfluencePoints:number; myInfluencePoints:number; controlPercentage:number; status:TerritoryStatus; boundary:LatLng[] }
