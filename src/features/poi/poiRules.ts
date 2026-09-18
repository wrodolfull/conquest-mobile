import { ARENA_POINTS_PER_TRAINING_POWER, TRAINING_GROUND_XP_MULTIPLIER } from './config';
import type { Coordinate } from './types';

export function distanceMeters(a: Coordinate, b: Coordinate): number {
  const radius = 6_371_000;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export const arenaPointsForTrainingPower = (trainingPower: number, arenaActive: boolean) =>
  arenaActive ? Math.max(0, trainingPower) * ARENA_POINTS_PER_TRAINING_POWER : 0;

export const xpForSegment = (baseXp: number, trainingGroundActive: boolean) =>
  Math.round(Math.max(0, baseXp) * (trainingGroundActive ? TRAINING_GROUND_XP_MULTIPLIER : 1));

export function xpForMixedRoute(segments: readonly { baseXp: number; insideTrainingGround: boolean }[]) {
  return segments.reduce((total, segment) => total + xpForSegment(segment.baseXp, segment.insideTrainingGround), 0);
}
