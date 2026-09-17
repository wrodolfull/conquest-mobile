import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface Territory {
  owner: string;
  domination: number;
  color: string;
  position: { left: `${number}%`; top: `${number}%` };
  rotation: `${number}deg`;
}

export interface Activity {
  id: ActivityType;
  label: string;
  detail: string;
  icon: IconName;
  color: string;
}

export type ActivityType = 'walking' | 'running' | 'cycling' | 'indoor';
export type RewardRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface DistanceMilestone {
  distance: number;
  rarity: RewardRarity;
}

export interface ActivityResult {
  type: ActivityType;
  durationSeconds: number;
  xp: number;
  energy: number;
  distance?: number;
  territoriesCrossed?: number;
  influence?: number;
  trainingPower?: number;
  arenaPoints?: number;
}

export interface Resource { label: string; value: string; icon: IconName; color: string }
export interface Player { name: string; initial: string; level: number; xpLabel: string; xpPercent: number; resources: Resource[] }
export interface Arena { name: string; distance: string; level: number; competitors: number }
export interface WeeklyProgressData { current: string; goal: number; percent: number; remaining: string; reward: string; daysLeft: number }
export interface NavigationItem { label: string; href: '/map' | '/activities' | '/inventory' | '/battles' | '/ranking' | '/profile'; icon: IconName; activeIcon: IconName }
export interface TabScreenData { title: string; eyebrow: string; description: string; icon: IconName; accent: string; stats: { label: string; value: string }[]; items: { title: string; detail: string; icon: IconName }[] }
