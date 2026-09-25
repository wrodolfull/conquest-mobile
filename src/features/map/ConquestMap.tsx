import Mapbox, { type MapState } from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MapTerritory, WorldViewport } from '@/features/territories/types';
import { territoryCandidatesForLocation, territoryGridDebugEnabled } from '@/features/territories/territoryMapData';
import { FALLBACK_LOCATION } from '@/services/location/locationService';
import { usePois } from '@/features/poi/PoiContext';
import { colors } from '@/theme';
import { territoryRepository } from '@/services/backend/territoryRepository';
import { useAuth } from '@/features/auth/AuthContext';
import { PoiIntelCard } from './PoiIntelCard';
import { PlayerLocationMarker } from './PlayerLocationMarker';
import { TerritoryCard } from './TerritoryCard';
import { ConquestBaseMap } from './mapbox/ConquestBaseMap';
import { resolveTerritoryTap, territoryFeatureCollection } from './mapbox/territoryGeoJson';
import type { FeatureCollection, PointGeometry } from './mapbox/geoJsonTypes';
import type { ActiveActivitySession } from '@/services/storage/activeActivityRepository';
import { activeActivityRepository, loadTrackingState } from '@/services/storage/activeActivityRepository';
import type { ActivityPoint } from '@/features/activity/tracking';
import { routeFeatureCollection } from './mapbox/routeGeoJson';
import { provisionalTerritoryFeatureCollection } from '@/features/home/activeActivityMapFeedback';
import { mapControlBottomInset } from '@/features/home/homeOverlayLayout';
import {
  isLatestTerritoryRequest,
  paddedTerritoryViewport,
  selectedTerritoryFilter,
  TERRITORY_DETAIL_MIN_ZOOM,
  territoryDetailEnabled,
  viewportContains,
  viewportFromMapState,
} from './mapPerformance';
import { viewportKey } from '../territories/worldRegions';

interface Props { activeActivity?: ActiveActivitySession; selectedTerritory: MapTerritory | null; onTerritorySelectionChange: (territory: MapTerritory | null) => void; bottomOverlayHeight?: number }

export function ConquestMap({ activeActivity, selectedTerritory, onTerritorySelectionChange, bottomOverlayHeight = 0 }: Props) {
  const { user } = useAuth();
  const camera = useRef<Mapbox.Camera>(null);
  const latestViewport = useRef<WorldViewport | null>(null);
  const latestZoom = useRef(15);
  const loadedViewport = useRef<WorldViewport | null>(null);
  const inFlightKey = useRef<string | null>(null);
  const requestGeneration = useRef(0);
  const detailWasEnabled = useRef(true);
  const { location, locationReady, locationDenied, presences } = usePois();
  const coordinate = location ?? FALLBACK_LOCATION;
  const usingFallback = locationDenied;
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [regions, setRegions] = useState<MapTerritory[]>([]);
  const [territoryDetail, setTerritoryDetail] = useState(true);
  const [activeRoute, setActiveRoute] = useState<ActivityPoint[]>([]);
  const debugGrid = territoryGridDebugEnabled(__DEV__, process.env.EXPO_PUBLIC_ENABLE_TERRITORY_GRID_DEBUG);
  const atomicCells = useMemo(() => debugGrid ? territoryCandidatesForLocation(location, locationDenied) : [], [debugGrid, location, locationDenied]);
  const territories = useMemo(() => territoryFeatureCollection(regions), [regions]);
  const selectedFilter = useMemo(() => selectedTerritoryFilter(selectedTerritory?.id ?? ''), [selectedTerritory]);
  const privateRoute = useMemo(() => routeFeatureCollection(activeRoute), [activeRoute]);
  const provisionalTerritories = useMemo(() => provisionalTerritoryFeatureCollection(activeRoute), [activeRoute]);
  const grid = useMemo(() => ({ type: 'FeatureCollection' as const, features: atomicCells.map(cell => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: [...cell.boundary, cell.boundary[0]!].map(p => [p.longitude, p.latitude]) } })) }), [atomicCells]);
  const pois = useMemo<FeatureCollection<PointGeometry, { id: string; type: string }>>(() => ({ type: 'FeatureCollection', features: presences.map(({ poi }) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [poi.longitude, poi.latitude] }, properties: { id: poi.id, type: poi.type } })) }), [presences]);

  const disableTerritoryDetail = useCallback(() => {
    requestGeneration.current += 1;
    inFlightKey.current = null;
    loadedViewport.current = null;
    setRegions([]);
    onTerritorySelectionChange(null);
  }, [onTerritorySelectionChange]);

  const requestViewport = useCallback(async (visible: WorldViewport | null, currentZoom: number, force = false) => {
    if (!territoryDetailEnabled(currentZoom)) {
      if (__DEV__) console.info('[Territory performance]', { zoom: currentZoom, skipped: 'zoom-too-low' });
      return;
    }
    if (!visible || !user || locationDenied) return;
    if (!force && viewportContains(loadedViewport.current, visible)) {
      if (inFlightKey.current) {
        requestGeneration.current += 1;
        inFlightKey.current = null;
      }
      if (__DEV__) console.info('[Territory performance]', { zoom: currentZoom, skipped: 'covered' });
      return;
    }
    const queryViewport = paddedTerritoryViewport(visible);
    if (!queryViewport) return;
    const key = viewportKey(queryViewport);
    if (key === inFlightKey.current) return;
    const generation = ++requestGeneration.current;
    inFlightKey.current = key;
    const startedAt = Date.now();
    const result = await territoryRepository.getWorldRegionsWithMetadata(queryViewport);
    if (!isLatestTerritoryRequest(generation, requestGeneration.current) || !territoryDetailEnabled(latestZoom.current)) return;
    inFlightKey.current = null;
    loadedViewport.current = queryViewport;
    setRegions(result.regions);
    if (__DEV__) console.info('[Territory performance]', { zoom: currentZoom, viewportWidth: queryViewport.east - queryViewport.west, viewportHeight: queryViewport.north - queryViewport.south, regionCount: result.regions.length, source: result.source, durationMs: Date.now() - startedAt });
  }, [locationDenied, user]);

  useEffect(() => territoryRepository.subscribe(() => {
    loadedViewport.current = null;
    void requestViewport(latestViewport.current, latestZoom.current, true);
  }), [requestViewport]);
  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      if (!activeActivity) { setActiveRoute([]); return; }
      void loadTrackingState(activeActivity).then(state => { if (mounted) setActiveRoute(state.accepted); });
    };
    refresh();
    const unsubscribe = activeActivityRepository.subscribe(refresh);
    return () => { mounted = false; unsubscribe(); };
  }, [activeActivity]);
  useEffect(() => { if (locationDenied) setMessage('Location is required to discover territories and Arenas.'); }, [locationDenied]);
  useEffect(() => { if (locationReady && location) camera.current?.setCamera({ centerCoordinate: [location.longitude, location.latitude], zoomLevel: 15, animationDuration: 350 }); }, [location, locationReady]);
  useEffect(() => {
    if (!territoryDetail && detailWasEnabled.current) disableTerritoryDetail();
    detailWasEnabled.current = territoryDetail;
  }, [disableTerritoryDetail, territoryDetail]);

  const clear = () => onTerritorySelectionChange(null);
  const updateCameraState = (state: MapState) => {
    latestZoom.current = state.properties.zoom;
    latestViewport.current = viewportFromMapState(state);
    setTerritoryDetail(territoryDetailEnabled(state.properties.zoom));
  };
  const showZoomHint = locationReady && !usingFallback && !message && !territoryDetail;

  return <View style={styles.container}><ConquestBaseMap onCameraChanged={updateCameraState} onMapIdle={state => { updateCameraState(state); void requestViewport(latestViewport.current, state.properties.zoom); }} onPress={() => { clear(); setSelectedPoiId(null); }}>
    <Mapbox.Camera ref={camera} defaultSettings={{ centerCoordinate: [coordinate.longitude, coordinate.latitude], zoomLevel: 15 }}/>
    {!usingFallback && regions.length ? <Mapbox.ShapeSource id="conquest-world-regions" shape={territories} onPress={event => { const territory = resolveTerritoryTap(regions, event.features[0]?.properties?.regionId); if (territory) { setSelectedPoiId(null); onTerritorySelectionChange(territory); } }}><Mapbox.FillLayer id="conquest-territory-fills" minZoomLevel={TERRITORY_DETAIL_MIN_ZOOM} style={{ fillColor: ['get', 'renderFillColor'], fillOpacity: ['get', 'renderFillOpacity'] }}/><Mapbox.LineLayer id="conquest-territory-edges" minZoomLevel={TERRITORY_DETAIL_MIN_ZOOM} style={{ lineColor: ['get', 'renderStrokeColor'], lineOpacity: ['get', 'renderStrokeOpacity'], lineWidth: ['get', 'renderStrokeWidth'] }}/><Mapbox.FillLayer id="conquest-selected-territory-fill" filter={selectedFilter} minZoomLevel={TERRITORY_DETAIL_MIN_ZOOM} style={{ fillColor: ['get', 'renderFillColor'], fillOpacity: 0.23 }}/><Mapbox.LineLayer id="conquest-selected-territory-edge" filter={selectedFilter} minZoomLevel={TERRITORY_DETAIL_MIN_ZOOM} style={{ lineColor: ['get', 'renderStrokeColor'], lineOpacity: 0.9, lineWidth: 2.4 }}/></Mapbox.ShapeSource> : null}
    {activeActivity && activeRoute.length ? <Mapbox.ShapeSource id="private-home-provisional-territory" shape={provisionalTerritories}><Mapbox.FillLayer id="private-home-provisional-territory-fill" style={{ fillColor: '#B7FF5A', fillOpacity: 0.22, fillOutlineColor: '#B7FF5A55' }}/><Mapbox.LineLayer id="private-home-provisional-territory-glow" style={{ lineColor: '#B7FF5A', lineOpacity: 0.25, lineBlur: 5, lineWidth: 8 }}/></Mapbox.ShapeSource> : null}
    {activeActivity && activeRoute.length ? <Mapbox.ShapeSource id="private-home-active-route" shape={privateRoute}><Mapbox.LineLayer id="private-home-active-route-line" style={{ lineColor: colors.cyan, lineWidth: 3.5, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.92 }}/></Mapbox.ShapeSource> : null}
    {debugGrid ? <Mapbox.ShapeSource id="conquest-dev-atomic-grid" shape={grid}><Mapbox.LineLayer id="conquest-dev-atomic-grid-lines" style={{ lineColor: '#FF4FD8A0', lineWidth: 1 }}/></Mapbox.ShapeSource> : null}
    {!usingFallback ? <Mapbox.ShapeSource id="conquest-pois" shape={pois} onPress={event => { clear(); setSelectedPoiId(String(event.features[0]?.properties?.id ?? '')); }}><Mapbox.CircleLayer id="conquest-poi-circles" minZoomLevel={TERRITORY_DETAIL_MIN_ZOOM} style={{ circleRadius: 12, circleColor: ['match', ['get', 'type'], 'arena', '#5E35A9', '#B7E85A'], circleStrokeColor: '#E4FFAE', circleStrokeWidth: 2 }}/></Mapbox.ShapeSource> : null}
    {!usingFallback && location ? <PlayerLocationMarker latitude={location.latitude} longitude={location.longitude} accuracy={location.accuracy ?? null}/> : null}
  </ConquestBaseMap>
  {!locationReady && <View style={styles.loading}><ActivityIndicator color={colors.lime}/><Text style={styles.loadingText}>LOCATING PLAYER…</Text></View>}{message && <Pressable onPress={() => setMessage(null)} style={styles.notice}><Ionicons name="location-outline" color={colors.gold} size={16}/><Text style={styles.noticeText}>{message}</Text></Pressable>}{showZoomHint ? <View pointerEvents="none" style={styles.zoomHint}><Text style={styles.zoomHintText}>ZOOM IN TO VIEW TERRITORIES</Text></View> : null}
  <Pressable accessibilityLabel="Center map on player" accessibilityRole="button" disabled={!location} onPress={() => location && camera.current?.setCamera({ centerCoordinate: [location.longitude, location.latitude], zoomLevel: 15, animationDuration: 450 })} style={[styles.recenter, { bottom: mapControlBottomInset(bottomOverlayHeight, Boolean(selectedTerritory || selectedPoiId)) }]}><Ionicons name="locate" color={colors.cyan} size={21}/></Pressable>
  {selectedTerritory && <TerritoryCard territory={selectedTerritory} onClose={clear}/>}{presences.find(({ poi }) => poi.id === selectedPoiId) ? <PoiIntelCard presence={presences.find(({ poi }) => poi.id === selectedPoiId)!} onClose={() => setSelectedPoiId(null)}/> : null}</View>;
}
const styles = StyleSheet.create({ container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#0A1714' }, loading: { position: 'absolute', top: '42%', alignSelf: 'center', borderRadius: 14, backgroundColor: colors.mapOverlay, padding: 12, flexDirection: 'row', gap: 8 }, loadingText: { color: colors.text, fontSize: 9, fontWeight: '900' }, notice: { position: 'absolute', top: 106, left: 12, right: 12, padding: 10, backgroundColor: '#181B14F2', flexDirection: 'row', gap: 8 }, noticeText: { color: '#E7E7DB', fontSize: 10, flex: 1 }, zoomHint: { position: 'absolute', top: 106, alignSelf: 'center', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#181B14E6', borderWidth: 1, borderColor: colors.border }, zoomHintText: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, recenter: { position: 'absolute', right: 12, width: 46, height: 46, borderRadius: 15, backgroundColor: colors.mapOverlay, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' } });
