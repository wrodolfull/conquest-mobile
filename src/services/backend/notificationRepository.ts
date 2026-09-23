import { supabase } from '@/lib/supabase';
import type { SocialNotification } from '@/features/social/types';

export const notificationRepository={
 async getNotifications(limit=30,before?:string):Promise<SocialNotification[]>{const{data,error}=await supabase.rpc('get_my_notifications',{p_limit:limit,p_before:before??null});if(error)throw new Error('Notifications are unavailable.');return data as SocialNotification[]},
 async markRead(id:string){const{error}=await supabase.rpc('mark_notification_read',{p_notification_id:id});if(error)throw new Error('Could not mark notification as read.')},
 async markAllRead(){const{error}=await supabase.rpc('mark_all_notifications_read');if(error)throw new Error('Could not mark notifications as read.')},
};
