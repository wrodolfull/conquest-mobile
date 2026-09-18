declare module 'expo-location' {
  export enum Accuracy { Balanced = 3, High = 4 }
  export interface LocationObject { timestamp: number; coords: { latitude: number; longitude: number; accuracy: number | null; altitude: number | null; speed: number | null; heading: number | null } }
  export interface LocationOptions { accuracy?: Accuracy; distanceInterval?: number; timeInterval?: number }
  export interface LocationSubscription { remove(): void }
  export interface PermissionResponse { granted: boolean; canAskAgain: boolean }
  export function requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
  export function getCurrentPositionAsync(options?: { accuracy?: Accuracy }): Promise<LocationObject>;
  export function getLastKnownPositionAsync(): Promise<LocationObject | null>;
  export function watchPositionAsync(options: LocationOptions, callback: (location: LocationObject) => void): Promise<LocationSubscription>;
}

declare module 'react-native-maps' {
  import type { Component, ComponentType, ReactNode } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';
  export interface LatLng { latitude: number; longitude: number }
  export interface Region extends LatLng { latitudeDelta: number; longitudeDelta: number }
  interface Camera { center?: LatLng; zoom?: number; pitch?: number; heading?: number; altitude?: number }
  interface MapProps { children?: ReactNode; initialRegion?: Region; mapType?: string; onMapReady?: () => void; onPress?: () => void; showsUserLocation?: boolean; showsMyLocationButton?: boolean; toolbarEnabled?: boolean; style?: StyleProp<ViewStyle>; customMapStyle?: object[] }
  interface MarkerProps { children?: ReactNode; coordinate: LatLng; anchor?: { x: number; y: number }; onPress?: () => void; tracksViewChanges?: boolean; zIndex?: number; pinColor?: string; title?: string }
  interface PolylineProps { coordinates: LatLng[]; strokeColor?: string; strokeWidth?: number }
  interface PolygonProps { coordinates: LatLng[]; fillColor?: string; strokeColor?: string; strokeWidth?: number; tappable?: boolean; onPress?: () => void }
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
