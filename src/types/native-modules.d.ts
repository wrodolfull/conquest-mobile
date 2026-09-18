declare module 'expo-location' {
  export enum Accuracy { Balanced = 3 }
  export interface LocationObject { coords: { latitude: number; longitude: number } }
  export interface PermissionResponse { granted: boolean; canAskAgain: boolean }
  export function requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
  export function getCurrentPositionAsync(options?: { accuracy?: Accuracy }): Promise<LocationObject>;
  export function getLastKnownPositionAsync(): Promise<LocationObject | null>;
}

declare module 'react-native-maps' {
  import type { Component, ComponentType, ReactNode } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';
  export interface LatLng { latitude: number; longitude: number }
  export interface Region extends LatLng { latitudeDelta: number; longitudeDelta: number }
  interface MapProps { children?: ReactNode; initialRegion?: Region; mapType?: string; showsUserLocation?: boolean; showsMyLocationButton?: boolean; toolbarEnabled?: boolean; style?: StyleProp<ViewStyle>; customMapStyle?: object[] }
  interface MarkerProps { children?: ReactNode; coordinate: LatLng; anchor?: { x: number; y: number }; onPress?: () => void; tracksViewChanges?: boolean }
  interface PolygonProps { coordinates: LatLng[]; fillColor?: string; strokeColor?: string; strokeWidth?: number; tappable?: boolean; onPress?: () => void }
  export default class MapView extends Component<MapProps> {
    animateToRegion(region: Region, duration?: number): void;
  }
  export const Marker: ComponentType<MarkerProps>;
  export const Polygon: ComponentType<PolygonProps>;
}
