import type { RelationshipStatus } from '@/features/auth/types';

export interface SocialSummary { friendsCount: number; pendingRequests: number; unreadNotifications: number; activeRivalries: number }
export interface Rivalry {
  rivalUserId:string; username:string; displayName:string; avatarUrl:string|null; level:number|null;
  battlesLast30Days:number; myBattleWins:number; theirBattleWins:number; contestedBattles:number;
  sharedTerritories:number; territoriesILead:number; territoriesTheyLead:number; lastInteractionAt:string|null;
  relationshipStatus:RelationshipStatus;
}
export interface RivalryBattle { battleId:string; territoryId:string; territoryName:string; result:'pressure'|'contested'|'captured'; role:'attack'|'defense'; createdAt:string }
export interface RivalryDetail extends Rivalry { recentBattles:RivalryBattle[] }
export interface SharedTerritory { territoryId:string; territoryName:string; myInfluence:number; theirInfluence:number; leaderUserId:string|null; status:'i_lead'|'they_lead'|'tied'|'other_leads' }
export interface FriendsLeaderboardEntry { rank:number; userId:string; username:string; displayName:string; avatarUrl:string|null; distanceMeters:number|null; weeklyInfluence:number|null; newZones:number|null; statsVisible:boolean }
export type NotificationType='FRIEND_REQUEST'|'FRIEND_ACCEPTED'|'BATTLE_PRESSURE_RECEIVED'|'TERRITORY_CONTESTED'|'TERRITORY_LOST'|'RIVALRY_STARTED'|'ACHIEVEMENT_UNLOCKED'|'OBJECTIVE_COMPLETED';
export interface SocialNotification { id:string; type:NotificationType; actorUserId:string|null; actorUsername:string|null; actorDisplayName:string|null; actorAvatarUrl:string|null; territoryId:string|null; territoryName:string|null; battleId:string|null; metadata:Record<string,unknown>; createdAt:string; readAt:string|null }
