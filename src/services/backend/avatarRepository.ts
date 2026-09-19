import { supabase } from '@/lib/supabase';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export const avatarRepository = {
  async upload(userId: string, bytes: ArrayBuffer, mimeType: string): Promise<string> {
    const extension = extensions[mimeType];
    if (!extension) throw new Error('Choose a JPEG, PNG, or WebP image.');
    if (bytes.byteLength > MAX_AVATAR_BYTES) throw new Error('Avatar images must be 5 MB or smaller.');
    const authenticatedId = (await supabase.auth.getUser()).data.user?.id;
    if (!authenticatedId || authenticatedId !== userId) throw new Error('Sign in again before changing your avatar.');
    const path = `${userId}/avatar.${extension}`;
    const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: mimeType, upsert: true });
    if (error) throw new Error('Avatar upload failed.');
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  },
};
