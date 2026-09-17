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
  label: string;
  detail: string;
  icon: IconName;
  color: string;
}
