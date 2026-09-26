import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TerritoryTarget } from "./targetRules";
import { activeActivityRepository } from "@/services/storage/activeActivityRepository";
const prefix = "ruqest.target.v1.";
const listeners = new Set<() => void>();
const cache = new Map<string, TerritoryTarget | null>();
const notify = () => listeners.forEach((listener) => listener());
export const targetRepository = {
  key: (userId: string) => prefix + userId,
  peek: (userId: string) => cache.get(userId),
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  async load(userId: string) {
    const raw = await AsyncStorage.getItem(prefix + userId);
    const value = raw ? (JSON.parse(raw) as TerritoryTarget) : null;
    cache.set(userId, value);
    notify();
    return value;
  },
  async set(userId: string, target: TerritoryTarget) {
    await AsyncStorage.setItem(prefix + userId, JSON.stringify(target));
    cache.set(userId, target);
    const active = await activeActivityRepository.get(userId);
    if (active) await activeActivityRepository.updateTarget(active.id, target);
    notify();
  },
  async remove(userId: string) {
    await AsyncStorage.removeItem(prefix + userId);
    cache.set(userId, null);
    const active = await activeActivityRepository.get(userId);
    if (active) await activeActivityRepository.updateTarget(active.id);
    notify();
  },
  async clearDeletedUser(userId: string) {
    await this.remove(userId);
  },
};
