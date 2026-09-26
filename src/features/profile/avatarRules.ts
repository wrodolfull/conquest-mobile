export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AvatarMimeType = typeof AVATAR_MIME_TYPES[number];

export function validateAvatarAsset(asset: { mimeType?: string | null; fileSize?: number | null }): AvatarMimeType {
  if (!asset.mimeType || !AVATAR_MIME_TYPES.includes(asset.mimeType as AvatarMimeType)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (asset.fileSize != null && asset.fileSize > AVATAR_MAX_BYTES) throw new Error('Choose an image smaller than 5 MB.');
  return asset.mimeType as AvatarMimeType;
}

export function avatarObjectPath(publicUrl: string | null, userId: string): string | null {
  if (!publicUrl) return null;
  const marker = '/storage/v1/object/public/avatars/';
  const index = publicUrl.indexOf(marker);
  if (index < 0) return null;
  const path = decodeURIComponent(publicUrl.slice(index + marker.length).split('?')[0] ?? '');
  return path.startsWith(`${userId}/`) ? path : null;
}

export function newAvatarPath(userId: string, mimeType: AvatarMimeType): string {
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return `${userId}/avatar-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
}
