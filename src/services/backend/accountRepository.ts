import { supabase } from '@/lib/supabase';
import { activityRepository } from '@/services/storage/activityRepository';
import { territoryRepository } from './territoryRepository';

export const accountRepository={
 async deleteCurrentAccount(userId:string):Promise<void>{
  const{error}=await supabase.functions.invoke('delete-account',{body:{}});if(error)throw new Error('Account deletion failed. Try again.');
  await activityRepository.removeForOwner(userId);territoryRepository.invalidate();
  await supabase.auth.signOut({scope:'local'});
 },
};
