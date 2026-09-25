export const PROFILE_TABS = ['overview', 'activities', 'territories', 'achievements'] as const;
export type ProfileTab = typeof PROFILE_TABS[number];
export function resolveProfileTab(value: string | string[] | undefined): ProfileTab {
  const candidate = Array.isArray(value) ? value[0] : value;
  return PROFILE_TABS.includes(candidate as ProfileTab) ? candidate as ProfileTab : 'overview';
}
