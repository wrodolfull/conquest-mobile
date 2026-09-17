import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
// Installed by Expo in normal development; the execution sandbox may not cache native packages.
// eslint-disable-next-line import/no-unresolved
import MapView, { Marker, Polygon, type LatLng } from 'react-native-maps';
import { generateArenas, generateTerritories } from '@/features/territories/territoryGenerator';
import type { MapArena, MapTerritory } from '@/features/territories/types';
import { FALLBACK_LOCATION, getPlayerLocation } from '@/services/location/locationService';
import { colors } from '@/theme';
import { ArenaDetailsCard } from './ArenaDetailsCard';
import { conquestMapStyle } from './mapStyle';
import { territoryVisual } from './mapVisuals';
import { TerritoryCard } from './TerritoryCard';

export function ConquestMap() {
  const [coordinate, setCoordinate] = useState<LatLng>(FALLBACK_LOCATION);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [territory, setTerritory] = useState<MapTerritory | null>(null);
  const [arena, setArena] = useState<MapArena | null>(null);

  useEffect(() => { void getPlayerLocation().then((result) => {
    setCoordinate(result.coordinate);
    if (result.permissionDenied) setMessage('Enable location to play with real territories around you. Showing a mock area for now.');
    else if (result.isFallback) setMessage('Location is temporarily unavailable. Showing a mock area for now.');
    setLoading(false);
  }); }, []);

  const territories = useMemo(() => generateTerritories(coordinate), [coordinate]);
  const arenas = useMemo(() => generateArenas(coordinate), [coordinate]);
  const selectTerritory = (selected: MapTerritory) => { setArena(null); setTerritory(selected); };
  const selectArena = (selected: MapArena) => { setTerritory(null); setArena(selected); };

  return <View style={styles.container}>
    <MapView
      customMapStyle={[...conquestMapStyle]}
      initialRegion={{ ...coordinate, latitudeDelta: 0.013, longitudeDelta: 0.013 }}
      key={`${coordinate.latitude}:${coordinate.longitude}`}
      mapType="standard"
      showsMyLocationButton={false}
      showsUserLocation={false}
      style={StyleSheet.absoluteFill}
      toolbarEnabled={false}
    >
      {territories.map((cell) => <Polygon key={cell.id} coordinates={cell.boundary} onPress={() => selectTerritory(cell)} tappable {...territoryVisual(cell)} />)}
      {arenas.map((item) => <Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={item.coordinate} key={item.id} onPress={() => selectArena(item)} tracksViewChanges={false}>
        <View style={styles.arenaMarker}><Ionicons name="barbell" color="#F1E9FF" size={19} /></View>
      </Marker>)}
      <Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={coordinate} tracksViewChanges={false}>
        <View style={styles.playerHalo}><View style={styles.player}><Ionicons name="navigate" size={15} color={colors.background} /></View></View>
      </Marker>
    </MapView>
    {loading && <View style={styles.loading}><ActivityIndicator color={colors.lime} /><Text style={styles.loadingText}>LOCATING PLAYER…</Text></View>}
    {message && <Pressable accessibilityRole="button" onPress={() => setMessage(null)} style={styles.notice}><Ionicons name="location-outline" color={colors.gold} size={16} /><Text style={styles.noticeText}>{message}</Text><Ionicons name="close" color={colors.muted} size={15} /></Pressable>}
    <View pointerEvents="none" style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>{loading ? 'SEARCHING' : 'LOCAL WORLD · LIVE'}</Text></View>
    {territory && <TerritoryCard territory={territory} onClose={() => setTerritory(null)} />}
    {arena && <ArenaDetailsCard arena={arena} onClose={() => setArena(null)} />}
  </View>;
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#0A1714' },
  playerHalo: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#37D8D130', borderWidth: 2, borderColor: '#37D8D188', justifyContent: 'center', alignItems: 'center' }, player: { width: 31, height: 31, borderRadius: 16, backgroundColor: colors.cyan, borderWidth: 3, borderColor: '#E7FFFF', justifyContent: 'center', alignItems: 'center', shadowColor: colors.cyan, shadowOpacity: 0.9, shadowRadius: 10, elevation: 10 },
  arenaMarker: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#5E35A9E8', borderWidth: 2, borderColor: '#CDB4FF', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '45deg' }], elevation: 9 },
  loading: { position: 'absolute', top: '42%', alignSelf: 'center', borderRadius: 14, backgroundColor: '#07100EEB', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, loadingText: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  notice: { position: 'absolute', top: 106, left: 12, right: 12, minHeight: 42, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#181B14F2', borderWidth: 1, borderColor: '#6A6033', flexDirection: 'row', alignItems: 'center', gap: 8 }, noticeText: { color: '#E7E7DB', fontSize: 10, lineHeight: 14, flex: 1 },
  live: { position: 'absolute', top: 106, left: 12, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#07100ED9', borderWidth: 1, borderColor: '#29413A', flexDirection: 'row', alignItems: 'center', gap: 6 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cyan }, liveText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
});
