import * as Location from 'expo-location';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LOCATION_OPTIONS, fromLocation, type ActivityPoint } from '@/features/activity/tracking';
import { FALLBACK_LOCATION } from '@/services/location/locationService';
import { POI_LOCATION_MAXIMUM_ACCURACY_METERS } from './config';
import { isGeofenceActive, updateGeofence } from './geofenceEngine';
import { mockPoiProvider } from './mockPoiProvider';
import { distanceMeters } from './poiRules';
import type { GamePoi, PoiPresence, PoiType } from './types';

type Simulation = Partial<Record<PoiType, 'inside' | 'outside'>>;
interface PoiContextValue {
  location?: ActivityPoint;
  pois: GamePoi[];
  presences: PoiPresence[];
  locationReady: boolean;
  locationDenied: boolean;
  notice?: string;
  dismissNotice(): void;
  activePoi(type: PoiType): GamePoi | undefined;
  simulate(type: PoiType, state: 'inside' | 'outside'): void;
}

const PoiContext = createContext<PoiContextValue | undefined>(undefined);

export function PoiProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<ActivityPoint>();
  const [pois, setPois] = useState<GamePoi[]>([]);
  const [presences, setPresences] = useState<PoiPresence[]>([]);
  const [locationReady, setLocationReady] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [simulation, setSimulation] = useState<Simulation>({});
  const previousStatuses = useRef(new Map<string, PoiPresence['status']>());

  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | undefined;
    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      if (!permission.granted) {
        setLocationDenied(true); setLocationReady(true);
        const now = Date.now(); setLocation({ ...FALLBACK_LOCATION, timestamp: now });
        return;
      }
      const initial = await Location.getLastKnownPositionAsync();
      if (mounted && initial) setLocation(fromLocation(initial));
      subscription = await Location.watchPositionAsync(LOCATION_OPTIONS, (value) => mounted && setLocation(fromLocation(value)));
      if (mounted) setLocationReady(true);
    })().catch(() => { if (mounted) setLocationReady(true); });
    return () => { mounted = false; subscription?.remove(); };
  }, []);

  useEffect(() => {
    if (!location || pois.length) return;
    void mockPoiProvider.getNearbyPois(location, 2_000).then(setPois);
  }, [location, pois.length]);

  useEffect(() => {
    if (!location || !pois.length) return;
    const update = () => setPresences((previous) => pois.map((poi) => {
      const existing = previous.find((item) => item.poi.id === poi.id) ?? { poi, status: 'outside' as const, distanceMeters: distanceMeters(location, poi) };
      const override = __DEV__ ? simulation[poi.type] : undefined;
      const distance = override === 'inside' ? 0 : override === 'outside' ? poi.exitRadiusMeters + 100 : distanceMeters(location, poi);
      const usable = location.accuracy === undefined || location.accuracy <= POI_LOCATION_MAXIMUM_ACCURACY_METERS;
      const next = usable ? updateGeofence(existing, distance, poi, Date.now()) : existing;
      return { poi, distanceMeters: distance, ...next };
    }));
    update();
    const timer = setInterval(update, 1_000);
    return () => clearInterval(timer);
  }, [location, pois, simulation]);

  useEffect(() => {
    presences.forEach((presence) => {
      const previous = previousStatuses.current.get(presence.poi.id) ?? 'outside';
      const wasActive = isGeofenceActive(previous); const active = isGeofenceActive(presence.status);
      if (!wasActive && active) setNotice(`${presence.poi.type === 'arena' ? 'ARENA' : 'TRAINING GROUND'} ENTERED\n${presence.poi.name}`);
      if (wasActive && !active) setNotice(`${presence.poi.type === 'arena' ? 'ARENA SCORING PAUSED' : 'TRAINING GROUND BOOST ENDED'}\nYou left ${presence.poi.name}.`);
      previousStatuses.current.set(presence.poi.id, presence.status);
    });
  }, [presences]);

  const value = useMemo<PoiContextValue>(() => ({
    location, pois, presences, locationReady, locationDenied, notice,
    dismissNotice: () => setNotice(undefined),
    activePoi: (type) => presences.find((item) => item.poi.type === type && isGeofenceActive(item.status))?.poi,
    simulate: (type, state) => { if (__DEV__) setSimulation((current) => ({ ...current, [type]: state })); },
  }), [location, pois, presences, locationReady, locationDenied, notice]);
  return <PoiContext.Provider value={value}>{children}</PoiContext.Provider>;
}

export function usePois() {
  const context = useContext(PoiContext);
  if (!context) throw new Error('usePois must be used within PoiProvider');
  return context;
}
