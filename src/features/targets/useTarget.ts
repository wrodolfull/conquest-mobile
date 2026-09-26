import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { targetRepository } from "./targetRepository";
import type { TerritoryTarget } from "./targetRules";
export function useTarget() {
  const { user } = useAuth();
  const [target, setTargetState] = useState<TerritoryTarget | null>(null);
  useEffect(() => {
    if (!user) {
      setTargetState(null);
      return;
    }
    let live = true;
    const refresh = () =>
      setTargetState(targetRepository.peek(user.id) ?? null);
    const unsubscribe = targetRepository.subscribe(refresh);
    void targetRepository.load(user.id).then((value) => {
      if (live) setTargetState(value);
    });
    return () => {
      live = false;
      unsubscribe();
    };
  }, [user]);
  const setTarget = useCallback(
    (value: TerritoryTarget) =>
      user ? targetRepository.set(user.id, value) : Promise.resolve(),
    [user],
  );
  const removeTarget = useCallback(
    () => (user ? targetRepository.remove(user.id) : Promise.resolve()),
    [user],
  );
  return { target, setTarget, removeTarget };
}
