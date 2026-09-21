declare module 'expo-location' {
  export enum Accuracy { Balanced = 3, High = 4, BestForNavigation = 6 }
  export enum ActivityType { Fitness = 3 }
  export interface LocationObject { timestamp: number; coords: { latitude: number; longitude: number; accuracy: number | null; altitude: number | null; speed: number | null; heading: number | null } }
  export interface LocationOptions { accuracy?: Accuracy; distanceInterval?: number; timeInterval?: number }
  export interface LocationTaskOptions extends LocationOptions { deferredUpdatesDistance?: number; deferredUpdatesInterval?: number; pausesUpdatesAutomatically?: boolean; activityType?: ActivityType; showsBackgroundLocationIndicator?: boolean; foregroundService?: { notificationTitle: string; notificationBody: string; killServiceOnDestroy?: boolean } }
  export interface LocationSubscription { remove(): void }
  export interface PermissionResponse { granted: boolean; canAskAgain: boolean }
  export function requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
  export function getForegroundPermissionsAsync(): Promise<PermissionResponse>;
  export function requestBackgroundPermissionsAsync(): Promise<PermissionResponse>;
  export function hasServicesEnabledAsync(): Promise<boolean>;
  export function getCurrentPositionAsync(options?: { accuracy?: Accuracy }): Promise<LocationObject>;
  export function getLastKnownPositionAsync(): Promise<LocationObject | null>;
  export function watchPositionAsync(options: LocationOptions, callback: (location: LocationObject) => void): Promise<LocationSubscription>;
  export function startLocationUpdatesAsync(taskName: string, options: LocationTaskOptions): Promise<void>;
  export function stopLocationUpdatesAsync(taskName: string): Promise<void>;
  export function hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean>;
}

declare module 'expo-task-manager' {
  export interface TaskManagerTaskBody<T> { data: T; error: Error | null }
  export function defineTask<T>(taskName: string, task: (body: TaskManagerTaskBody<T>) => void | Promise<void>): void;
}

declare module 'expo-sqlite' {
  export interface SQLiteDatabase {
    execAsync(source: string): Promise<void>;
    runAsync(source: string, ...params: (string | number | null)[]): Promise<{ changes: number; lastInsertRowId: number }>;
    getFirstAsync<T>(source: string, ...params: (string | number | null)[]): Promise<T | null>;
    getAllAsync<T>(source: string, ...params: (string | number | null)[]): Promise<T[]>;
    withTransactionAsync(task: () => Promise<void>): Promise<void>;
  }
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
}

declare module '@react-native-async-storage/async-storage' { const storage: { getItem(key:string):Promise<string|null>; setItem(key:string,value:string):Promise<void>; removeItem(key:string):Promise<void> }; export default storage; }
declare module '@supabase/supabase-js' { export function createClient(url:string,key:string,options?:unknown): any; }
declare module 'expo-web-browser' { export function maybeCompleteAuthSession():void; export function openAuthSessionAsync(url:string,redirectUrl:string):Promise<{type:string;url:string}>; }
declare module 'react-native-url-polyfill/auto';

declare module 'react-native-view-shot' {
  import type { RefObject } from 'react';
  import type { View } from 'react-native';
  export function captureRef(ref: RefObject<View | null>, options?: { format?: 'png' | 'jpg'; quality?: number; result?: 'tmpfile' | 'base64' | 'data-uri' }): Promise<string>;
}
