import { supabase } from '@/lib/supabase';
import type { SocialSummary } from '@/features/social/types';

export const socialSummaryRepository={async get():Promise<SocialSummary>{const{data,error}=await supabase.rpc('get_my_social_summary');if(error)throw error;return data as SocialSummary}};
