import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, type LatLng } from 'react-native-maps';
import { renderableTerritories, territoryCandidatesForLocation } from '@/features/territories/territoryMapData';
import type { MapTerritory } from '@/features/territories/types';
import { FALLBACK_LOCATION } from '@/services/location/locationService';
import { usePois } from '@/features/poi/PoiContext';
import { colors } from '@/theme';
import { activityRepository } from '@/services/storage/activityRepository';
import { territoryRepository, type TerritorySnapshot } from '@/services/backend/territoryRepository';
import { useAuth } from '@/features/auth/AuthContext';
import { PoiIntelCard } from './PoiIntelCard';
import { conquestMapStyle } from './mapStyle';
import { PlayerLocationMarker } from './PlayerLocationMarker';
import { territoryVisual } from './mapVisuals';
import { TerritoryCard } from './TerritoryCard';

interface ConquestMapProps {
  selectedTerritory: MapTerritory | null;
  onTerritorySelectionChange: (territory: MapTerritory | null) => void;
}

export function ConquestMap({ selectedTerritory, onTerritorySelectionChange }: ConquestMapProps) {
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const { location, locationReady, locationDenied, presences } = usePois();
  const coordinate: LatLng = location ?? FALLBACK_LOCATION;
  const accuracy = location?.accuracy ?? null;
  const loading = !locationReady;
  const usingFallback = locationDenied;
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [influenceRevision, setInfluenceRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<Map<string, TerritorySnapshot>>(new Map());
  const initiallyCentered = useRef(false);

  useEffect(() => activityRepository.subscribe(() => setInfluenceRevision((revision) => revision + 1)), []);

  useEffect(() => { if (locationDenied) setMessage('Location is required to discover territories and Arenas.'); }, [locationDenied]);
  useEffect(() => {
    if (!locationReady || !location || initiallyCentered.current) return;
    initiallyCentered.current = true;
    mapRef.current?.animateToRegion({ ...location, latitudeDelta: 0.013, longitudeDelta: 0.013 }, 350);
  }, [location, locationReady]);

  const localTerritories = useMemo(
    () => territoryCandidatesForLocation(location, locationDenied),
    [location, locationDenied],
  );
  useEffect(() => {
    if (!user || !localTerritories.length) return;

    let active = true;
    void territoryRepository.getSnapshot(localTerritories.map(({ id }) => id)).then((rows) => {
      if (active) setSnapshot(new Map(rows.map((row) => [row.territory_id, row])));
    });
    return () => { active = false; };
  }, [localTerritories, user]);
  const territories = useMemo(() => {
    // The revision makes repository writes visible without coupling map generation
    // to a particular persistence implementation.
    void influenceRevision;
    return renderableTerritories(localTerritories, snapshot);
  }, [localTerritories, influenceRevision, snapshot]);
  const selectTerritory = (selected: MapTerritory) => {
    setSelectedPoiId(null);
    onTerritorySelectionChange(selected);
  };
  const clearTerritory = () => {
    onTerritorySelectionChange(null);
  };
  const selectPoi = (id: string) => {
    clearTerritory();
    setSelectedPoiId(id);
  };
  const centerOnPlayer = () => {
    mapRef.current?.animateToRegion({ ...coordinate, latitudeDelta: 0.013, longitudeDelta: 0.013 }, 450);
  };

  return <View style={styles.container}>
    <MapView
      customMapStyle={[...conquestMapStyle]}
      initialRegion={{ ...coordinate, latitudeDelta: 0.013, longitudeDelta: 0.013 }}
      mapType="standard"
      onPress={() => {
        if (selectedTerritory) clearTerritory();
        if (selectedPoiId) setSelectedPoiId(null);
      }}
      ref={mapRef}
      showsMyLocationButton={false}
      showsUserLocation={false}
      style={StyleSheet.absoluteFill}
      toolbarEnabled={false}
    >
      {!usingFallback && territories.map((cell) => <Polygon key={cell.id} coordinates={cell.boundary} onPress={() => selectTerritory(cell)} tappable {...territoryVisual(cell)} />)}
      {!usingFallback && presences.map(({ poi }) => <Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={poi} key={poi.id} onPress={() => selectPoi(poi.id)} tracksViewChanges={false}>
        <View style={[styles.poiMarker, poi.type === 'training_ground' && styles.groundMarker]}><Ionicons name={poi.type === 'arena' ? 'barbell' : 'flag'} color={poi.type === 'arena' ? '#F1E9FF' : '#07100E'} size={17} /></View>
      </Marker>)}
      {!usingFallback && <PlayerLocationMarker latitude={coordinate.latitude} longitude={coordinate.longitude} accuracy={accuracy} />}
    </MapView>
    {loading && <View style={styles.loading}><ActivityIndicator color={colors.lime} /><Text style={styles.loadingText}>LOCATING PLAYER…</Text></View>}
    {message && <Pressable accessibilityRole="button" onPress={() => setMessage(null)} style={styles.notice}><Ionicons name="location-outline" color={colors.gold} size={16} /><Text style={styles.noticeText}>{message}</Text><Ionicons name="close" color={colors.muted} size={15} /></Pressable>}
    {!message && <View pointerEvents="none" style={styles.live}><View style={[styles.liveDot, usingFallback && styles.fallbackDot]} /><Text style={styles.liveText}>{loading ? 'SEARCHING' : usingFallback ? 'LOCATION REQUIRED' : 'LOCAL WORLD · LIVE'}</Text></View>}
    <Pressable accessibilityLabel="Center map on player" accessibilityRole="button" onPress={centerOnPlayer} style={({ pressed }) => [styles.recenter, pressed && styles.controlPressed]}>
      <Ionicons name="locate" color={colors.cyan} size={21} />
    </Pressable>
    {selectedTerritory && <TerritoryCard territory={selectedTerritory} onClose={clearTerritory} />}
    {presences.find((item) => item.poi.id === selectedPoiId) ? <PoiIntelCard presence={presences.find((item) => item.poi.id === selectedPoiId)!} onClose={() => setSelectedPoiId(null)} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#0A1714' },
  poiMarker: { width: 37, height: 37, borderRadius: 13, backgroundColor: '#5E35A9E8', borderWidth: 2, borderColor: '#CDB4FF', justifyContent: 'center', alignItems: 'center', elevation: 7 },
  groundMarker: { backgroundColor: '#B7E85AE8', borderColor: '#E4FFAE' },
  loading: { position: 'absolute', top: '42%', alignSelf: 'center', borderRadius: 14, backgroundColor: '#07100EEB', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, loadingText: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  notice: { position: 'absolute', top: 106, left: 12, right: 12, minHeight: 42, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#181B14F2', borderWidth: 1, borderColor: '#6A6033', flexDirection: 'row', alignItems: 'center', gap: 8 }, noticeText: { color: '#E7E7DB', fontSize: 10, lineHeight: 14, flex: 1 },
  live: { position: 'absolute', top: 106, left: 12, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#07100ED9', borderWidth: 1, borderColor: '#29413A', flexDirection: 'row', alignItems: 'center', gap: 6 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cyan }, liveText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  fallbackDot: { backgroundColor: colors.gold },
  recenter: { position: 'absolute', right: 12, top: 158, width: 42, height: 42, borderRadius: 14, backgroundColor: '#07100EEB', borderWidth: 1, borderColor: '#315951', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 7 },
  controlPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
