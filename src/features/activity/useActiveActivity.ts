import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/features/auth/AuthContext';
import { activeActivityRepository, type ActiveActivitySession } from '@/services/storage/activeActivityRepository';

export function useActiveActivity() {
  const { user } = useAuth();
  const [session, setSession] = useState<ActiveActivitySession>();
  const refresh = useCallback(() => {
    if (!user) { setSession(undefined); return; }
    void activeActivityRepository.get(user.id).then(setSession);
  }, [user]);
  useFocusEffect(useCallback(() => { refresh(); return activeActivityRepository.subscribe(refresh); }, [refresh]));
  return session;
}
