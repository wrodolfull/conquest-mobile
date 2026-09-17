import type { Activity, Arena, NavigationItem, Player, TabScreenData, Territory, WeeklyProgressData } from '@/types/game';
import { colors } from '@/theme';

export const player: Player = { name: 'Rodolfo', initial: 'R', level: 12, xpLabel: '2,480 / 3,200 XP', xpPercent: 77, resources: [{ label: 'Battle energy', value: '850', icon: 'flash', color: colors.cyan }, { label: 'Coins', value: '3,420', icon: 'logo-bitcoin', color: colors.gold }] };
export const nearbyArena: Arena = { name: 'Mock Gym', distance: '320 m', level: 3, competitors: 14 };
export const weeklyProgress: WeeklyProgressData = { current: '12.4', goal: 25, percent: 49.6, remaining: '12.6', reward: 'Epic Item', daysLeft: 4 };

export const territories: Territory[] = [
  { owner: 'Rodolfo', domination: 62, color: '#76D83C', position: { left: '8%', top: '12%' }, rotation: '-11deg' },
  { owner: 'Lucas', domination: 78, color: '#4D8CFF', position: { left: '52%', top: '8%' }, rotation: '9deg' },
  { owner: 'Mariana', domination: 81, color: '#AF6BFF', position: { left: '55%', top: '54%' }, rotation: '-8deg' },
  { owner: 'Bruno', domination: 45, color: '#F39645', position: { left: '5%', top: '58%' }, rotation: '6deg' },
];
export const activities: Activity[] = [
  { label: 'Walking', detail: 'Explore', icon: 'walk-outline', color: colors.lime },
  { label: 'Running', detail: 'Conquer', icon: 'speedometer-outline', color: colors.danger },
  { label: 'Cycling', detail: 'Go farther', icon: 'bicycle-outline', color: colors.cyan },
  { label: 'Indoor', detail: 'Train power', icon: 'barbell-outline', color: colors.violet },
];
export const navigationItems: NavigationItem[] = [
  { label: 'Map', href: '/map', icon: 'map-outline', activeIcon: 'map' }, { label: 'Activities', href: '/activities', icon: 'pulse-outline', activeIcon: 'pulse' },
  { label: 'Inventory', href: '/inventory', icon: 'cube-outline', activeIcon: 'cube' }, { label: 'Battles', href: '/battles', icon: 'flash-outline', activeIcon: 'flash' },
  { label: 'Ranking', href: '/ranking', icon: 'trophy-outline', activeIcon: 'trophy' }, { label: 'Profile', href: '/profile', icon: 'person-outline', activeIcon: 'person' },
];

export const tabScreenData: Record<'activities' | 'inventory' | 'battles' | 'ranking' | 'profile', TabScreenData> = {
  activities: { title: 'Activities', eyebrow: 'TRAIN & EXPLORE', description: 'Your outdoor and indoor sessions will appear here.', icon: 'pulse', accent: colors.cyan, stats: [{ label: 'THIS WEEK', value: '4 sessions' }, { label: 'DISTANCE', value: '12.4 km' }], items: [{ title: 'Morning run', detail: '5.2 km · Outdoor', icon: 'walk' }, { title: 'Strength session', detail: '420 Training Power · Indoor', icon: 'barbell' }] },
  inventory: { title: 'Inventory', eyebrow: 'YOUR LOADOUT', description: 'Loot earned through movement and workouts is stored here.', icon: 'cube', accent: colors.gold, stats: [{ label: 'ITEMS', value: '18 / 40' }, { label: 'RARITY', value: '2 Epic' }], items: [{ title: 'Trail Compass', detail: 'Exploration item', icon: 'compass' }, { title: 'Power Core', detail: 'Battle resource', icon: 'battery-charging' }] },
  battles: { title: 'Battles', eyebrow: 'CHOOSE YOUR MOMENT', description: 'Prepare resources now and battle only when you are safely stopped.', icon: 'flash', accent: colors.danger, stats: [{ label: 'RECORD', value: '12 wins' }, { label: 'ENERGY', value: '850' }], items: [{ title: 'Border skirmish', detail: 'Mock encounter · Ready', icon: 'shield' }, { title: 'Arena challenge', detail: 'Mock Gym · Level 3', icon: 'barbell' }] },
  ranking: { title: 'Ranking', eyebrow: 'LOCAL LEAGUE', description: 'Compare your mocked weekly progress with nearby challengers.', icon: 'trophy', accent: colors.violet, stats: [{ label: 'POSITION', value: '#8' }, { label: 'LEAGUE', value: 'Explorer' }], items: [{ title: '#7 Mariana', detail: '2,910 points', icon: 'chevron-up' }, { title: '#8 Rodolfo', detail: '2,760 points', icon: 'remove' }] },
  profile: { title: 'Profile', eyebrow: 'PLAYER CARD', description: 'Your level, achievements, and game statistics live here.', icon: 'person', accent: colors.lime, stats: [{ label: 'LEVEL', value: '12' }, { label: 'TERRITORIES', value: '6' }], items: [{ title: 'Pathfinder', detail: 'Weekly achievement', icon: 'ribbon' }, { title: 'Active streak', detail: '4 days', icon: 'flame' }] },
};
