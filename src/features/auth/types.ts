export interface AuthUser { id: string; email?: string; user_metadata?: Record<string, unknown> }
export interface AuthSession { access_token: string; refresh_token: string; user: AuthUser }
export type ActivityPreference = 'walking' | 'running' | 'cycling' | 'indoor';
export type ProfileVisibility = 'public' | 'friends' | 'private';
export interface PlayerProfile { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; preferred_activities: ActivityPreference[]; city: string | null; region: string | null; onboarding_completed: boolean }
export interface PlayerProgress { user_id: string; level: number; xp: number; energy: number; coins: number }
export interface ProfilePrivacy { profile_visibility: ProfileVisibility; activity_visibility: ProfileVisibility; show_level: boolean; show_stats: boolean; show_territories: boolean; show_achievements: boolean }
export interface PublicPlayerProfile { id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null; preferred_activities: ActivityPreference[] | null; city: string | null; region: string | null; level: number | null; xp: number | null; total_distance: number | null; total_activities: number | null; territories_count: number | null; total_influence: number | null; relationship_status: 'self'|'none'|'pending_sent'|'pending_received'|'friends'|'blocked' }
export interface AuthResult { ok: boolean; message?: string }
