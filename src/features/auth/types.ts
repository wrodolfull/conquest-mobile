export interface AuthUser { id: string; email?: string; user_metadata?: Record<string, unknown> }
export interface AuthSession { access_token: string; refresh_token: string; user: AuthUser }
export type ActivityPreference = 'walking' | 'running' | 'cycling' | 'indoor';
export type ProfileVisibility = 'public' | 'friends' | 'private';
export interface PlayerProfile { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; preferred_activities: ActivityPreference[]; city: string | null; region: string | null; onboarding_completed: boolean }
export interface PlayerProgress { user_id: string; level: number; xp: number; energy: number; coins: number }
export interface ProfilePrivacy { profile_visibility: ProfileVisibility; activity_visibility: ProfileVisibility; show_level: boolean; show_stats: boolean; show_territories: boolean; show_achievements: boolean }
export type RelationshipStatus = 'self'|'none'|'outgoing_pending'|'incoming_pending'|'friends'|'blocked_by_me'|'restricted';
export interface PublicPlayerProfile { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; preferred_activities: ActivityPreference[] | null; city: string | null; region: string | null; level: number | null; xp: number | null; total_distance: number | null; total_activities: number | null; territories_count: number | null; total_influence: number | null; relationship_status: RelationshipStatus; request_id: string|null; friends_count:number }
export interface AuthResult { ok: boolean; message?: string }
