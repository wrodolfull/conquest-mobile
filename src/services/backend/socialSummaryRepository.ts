import { supabase } from '@/lib/supabase';
import type { SocialSummary } from '@/features/social/types';

const STALE_MS=45_000;
let cached:{value:SocialSummary;at:number}|undefined;
let inFlight:Promise<SocialSummary>|undefined;
export const socialSummaryRepository={get():Promise<SocialSummary>{if(cached&&Date.now()-cached.at<STALE_MS)return Promise.resolve(cached.value);if(inFlight)return inFlight;const request=(async()=>{const{data,error}=await supabase.rpc('get_my_social_summary');if(error)throw error;const value=data as SocialSummary;cached={value,at:Date.now()};return value;})();inFlight=request;void request.finally(()=>{if(inFlight===request)inFlight=undefined;}).catch(()=>undefined);return request;}};
