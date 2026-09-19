import type { Activity, NavigationItem } from '@/types/game';
import { colors } from '@/theme';

export const WEEKLY_DISTANCE_GOAL_KM = 25;

export const activities: Activity[] = [
  { id: 'walking', label: 'Walking', detail: 'Explore', icon: 'walk-outline', color: colors.lime },
  { id: 'running', label: 'Running', detail: 'Conquer', icon: 'speedometer-outline', color: colors.danger },
  { id: 'cycling', label: 'Cycling', detail: 'Go farther', icon: 'bicycle-outline', color: colors.cyan },
  { id: 'indoor', label: 'Indoor', detail: 'Coming soon', icon: 'barbell-outline', color: colors.violet },
];

export const navigationItems: NavigationItem[] = [
  { label: 'Map', href: '/map', icon: 'map-outline', activeIcon: 'map' },
  { label: 'Activities', href: '/activities', icon: 'pulse-outline', activeIcon: 'pulse' },
  { label: 'Inventory', href: '/inventory', icon: 'cube-outline', activeIcon: 'cube' },
  { label: 'Battles', href: '/battles', icon: 'flash-outline', activeIcon: 'flash' },
  { label: 'Ranking', href: '/ranking', icon: 'trophy-outline', activeIcon: 'trophy' },
  { label: 'Profile', href: '/profile', icon: 'person-outline', activeIcon: 'person' },
];
