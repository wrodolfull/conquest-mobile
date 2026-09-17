import type { Activity, Territory } from '@/types/game';

export const territories: Territory[] = [
  { owner: 'Rodolfo', domination: 62, color: '#76D83C', position: { left: '8%', top: '12%' }, rotation: '-11deg' },
  { owner: 'Lucas', domination: 78, color: '#4D8CFF', position: { left: '52%', top: '8%' }, rotation: '9deg' },
  { owner: 'Mariana', domination: 81, color: '#AF6BFF', position: { left: '55%', top: '54%' }, rotation: '-8deg' },
  { owner: 'Bruno', domination: 45, color: '#F39645', position: { left: '5%', top: '58%' }, rotation: '6deg' },
];

export const activities: Activity[] = [
  { label: 'Walking', detail: 'Explore', icon: 'walk-outline', color: '#C8FF4A' },
  { label: 'Running', detail: 'Conquer', icon: 'speedometer-outline', color: '#FF796E' },
  { label: 'Cycling', detail: 'Go farther', icon: 'bicycle-outline', color: '#37D8D1' },
  { label: 'Indoor', detail: 'Train power', icon: 'barbell-outline', color: '#A977FF' },
];
