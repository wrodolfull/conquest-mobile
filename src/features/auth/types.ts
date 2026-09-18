export interface AuthUser { id: string; email?: string }
export interface AuthSession { access_token: string; refresh_token: string; user: AuthUser }
export interface PlayerProfile { id: string; username: string; display_name: string; avatar_url: string | null }
export interface PlayerProgress { user_id: string; level: number; xp: number; energy: number; coins: number }
export interface AuthResult { ok: boolean; message?: string }
