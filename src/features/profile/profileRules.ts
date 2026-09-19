import type { ActivityPreference } from '@/features/auth/types';

export const activityPreferences: ActivityPreference[] = ['walking', 'running', 'cycling', 'indoor'];
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;
export const isValidUsername = (value: string) => USERNAME_PATTERN.test(value);
export const isValidBio = (value: string) => value.length <= 160;
export const areValidActivities = (values: string[]) => new Set(values).size === values.length && values.every((value) => activityPreferences.includes(value as ActivityPreference));
export const routeForPlayer = (authenticated: boolean, onboardingCompleted: boolean | null) => !authenticated ? 'auth' : onboardingCompleted ? 'app' : 'onboarding';
