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

declare module 'react-native-maps' {
  import type { Component, ComponentType, ReactNode } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';
  export interface LatLng { latitude: number; longitude: number }
  export interface Region extends LatLng { latitudeDelta: number; longitudeDelta: number }
  interface Camera { center?: LatLng; zoom?: number; pitch?: number; heading?: number; altitude?: number }
  interface MapProps { children?: ReactNode; initialRegion?: Region; mapType?: string; onMapReady?: () => void; onPress?: () => void; onRegionChangeComplete?: (region: Region) => void; showsUserLocation?: boolean; showsMyLocationButton?: boolean; toolbarEnabled?: boolean; style?: StyleProp<ViewStyle>; customMapStyle?: object[] }
  interface MarkerProps { children?: ReactNode; coordinate: LatLng; anchor?: { x: number; y: number }; onPress?: () => void; tracksViewChanges?: boolean; zIndex?: number; pinColor?: string; title?: string }
  interface PolylineProps { coordinates: LatLng[]; strokeColor?: string; strokeWidth?: number }
  interface PolygonProps { coordinates: LatLng[]; holes?: LatLng[][]; fillColor?: string; strokeColor?: string; strokeWidth?: number; tappable?: boolean; onPress?: () => void; zIndex?: number }
  interface CircleProps { center: LatLng; radius: number; fillColor?: string; strokeColor?: string; strokeWidth?: number; zIndex?: number }
  export default class MapView extends Component<MapProps> {
    animateToRegion(region: Region, duration?: number): void;
    animateCamera(camera: Camera, options?: { duration?: number }): void;
    fitToCoordinates(coordinates: LatLng[], options?: { animated?: boolean; edgePadding?: { top: number; right: number; bottom: number; left: number } }): void;
  }
  export const Marker: ComponentType<MarkerProps>;
  export const Polygon: ComponentType<PolygonProps>;
  export const Circle: ComponentType<CircleProps>;
  export const Polyline: ComponentType<PolylineProps>;
}
declare module '@react-native-async-storage/async-storage' { const storage: { getItem(key:string):Promise<string|null>; setItem(key:string,value:string):Promise<void>; removeItem(key:string):Promise<void> }; export default storage; }
declare module '@supabase/supabase-js' { export function createClient(url:string,key:string,options?:unknown): any; }
declare module 'expo-web-browser' { export function maybeCompleteAuthSession():void; export function openAuthSessionAsync(url:string,redirectUrl:string):Promise<{type:string;url:string}>; }
declare module 'react-native-url-polyfill/auto';
