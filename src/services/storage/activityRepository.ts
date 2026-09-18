import type { CompletedOutdoorActivity } from '@/features/activity/outdoorRules';
import type { CompletedIndoorActivity } from '@/features/activity/indoorRules';

// Repository boundary intentionally hides storage details so AsyncStorage/Supabase can
// replace this store without touching screens. This store survives navigation for the
// lifetime of the app process.
const activities: CompletedOutdoorActivity[] = [];
const indoorActivities: CompletedIndoorActivity[] = [];
const influence = new Map<string, number>();
const listeners = new Set<() => void>();

export const activityRepository = {
  async save(activity: CompletedOutdoorActivity) {
    activities.unshift(activity);
    activity.traversals.forEach((item) => influence.set(item.territoryId, (influence.get(item.territoryId) ?? 0) + item.influenceEarned));
    listeners.forEach((listener) => listener());
  },
  async list() { return [...activities]; },
  async find(id: string) { return activities.find((item) => item.id === id); },
  async saveIndoor(activity: CompletedIndoorActivity) { indoorActivities.unshift(activity); listeners.forEach((listener) => listener()); },
  async findIndoor(id: string) { return indoorActivities.find((item) => item.id === id); },
  influenceFor(territoryId: string) { return influence.get(territoryId) ?? 0; },
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
};
