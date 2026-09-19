import type { RelationshipStatus } from '@/features/auth/types';

export const SOCIAL_SEARCH_MIN_LENGTH=3;
export const SOCIAL_SEARCH_DEBOUNCE_MS=400;
export const canSearchPlayers=(query:string)=>query.trim().replace(/^@/,'').length>=SOCIAL_SEARCH_MIN_LENGTH;
export const relationshipLabel=(status:RelationshipStatus)=>({none:'ADD',outgoing_pending:'REQUESTED',incoming_pending:'ACCEPT',friends:'FRIENDS',blocked_by_me:'BLOCKED',restricted:'UNAVAILABLE',self:'YOU'} as const)[status];
