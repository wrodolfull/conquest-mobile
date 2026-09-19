import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, type LatLng, type Region } from 'react-native-maps';
import type { MapTerritory, WorldViewport } from '@/features/territories/types';
import { territoryCandidatesForLocation, territoryGridDebugEnabled } from '@/features/territories/territoryMapData';
import { FALLBACK_LOCATION } from '@/services/location/locationService';
import { usePois } from '@/features/poi/PoiContext';
import { colors } from '@/theme';
import { activityRepository } from '@/services/storage/activityRepository';
import { territoryRepository } from '@/services/backend/territoryRepository';
import { useAuth } from '@/features/auth/AuthContext';
import { PoiIntelCard } from './PoiIntelCard';
import { conquestMapStyle } from './mapStyle';
import { PlayerLocationMarker } from './PlayerLocationMarker';
import { territoryVisual } from './mapVisuals';
import { TerritoryCard } from './TerritoryCard';

interface Props { selectedTerritory: MapTerritory | null; onTerritorySelectionChange: (territory: MapTerritory | null) => void }
const boundsFor = ({ latitude, longitude, latitudeDelta, longitudeDelta }: Region): WorldViewport => ({
  west: longitude - longitudeDelta / 2, east: longitude + longitudeDelta / 2,
  south: latitude - latitudeDelta / 2, north: latitude + latitudeDelta / 2,
});

export function ConquestMap({ selectedTerritory, onTerritorySelectionChange }: Props) {
  const { user } = useAuth(); const mapRef = useRef<MapView>(null); const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { location, locationReady, locationDenied, presences } = usePois();
  const coordinate: LatLng = location ?? FALLBACK_LOCATION; const usingFallback = locationDenied;
  const [message, setMessage] = useState<string | null>(null); const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [regions, setRegions] = useState<MapTerritory[]>([]); const lastRequest = useRef(''); const initiallyCentered = useRef(false);
  const debugGrid = territoryGridDebugEnabled(__DEV__, process.env.EXPO_PUBLIC_ENABLE_TERRITORY_GRID_DEBUG);
  const atomicCells = useMemo(() => debugGrid ? territoryCandidatesForLocation(location, locationDenied) : [], [debugGrid, location, locationDenied]);

  const fetchViewport = useCallback((region: Region) => {
    if (!user || locationDenied) return;
    const bounds = boundsFor(region); const key = Object.values(bounds).map((n) => n.toFixed(4)).join(':');
    if (key === lastRequest.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { lastRequest.current = key; void territoryRepository.getWorldRegions(bounds).then(setRegions); }, 400);
  }, [locationDenied, user]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => activityRepository.subscribe(() => { lastRequest.current = ''; fetchViewport({ ...coordinate, latitudeDelta: .013, longitudeDelta: .013 }); }), [coordinate, fetchViewport]);
  useEffect(() => { if (locationDenied) setMessage('Location is required to discover territories and Arenas.'); }, [locationDenied]);
  useEffect(() => { if (!locationReady || !location || initiallyCentered.current) return; initiallyCentered.current = true; const region = { ...location, latitudeDelta: .013, longitudeDelta: .013 }; mapRef.current?.animateToRegion(region, 350); fetchViewport(region); }, [fetchViewport, location, locationReady]);

  const selectTerritory = (territory: MapTerritory) => { setSelectedPoiId(null); onTerritorySelectionChange(territory); };
  const clear = () => onTerritorySelectionChange(null);
  return <View style={styles.container}><MapView ref={mapRef} customMapStyle={[...conquestMapStyle]} initialRegion={{ ...coordinate, latitudeDelta:.013, longitudeDelta:.013 }} onRegionChangeComplete={fetchViewport} onPress={() => { clear(); setSelectedPoiId(null); }} showsMyLocationButton={false} showsUserLocation={false} style={StyleSheet.absoluteFill} toolbarEnabled={false}>
    {!usingFallback && regions.flatMap((region) => region.polygons.map((polygon, index) => <Polygon key={`${region.id}:${index}`} coordinates={polygon.outer} holes={polygon.holes} onPress={() => selectTerritory(region)} tappable zIndex={1} {...territoryVisual(region)} />))}
    {debugGrid && atomicCells.map((cell) => <Polygon key={`debug:${cell.id}`} coordinates={cell.boundary} fillColor="#00000000" strokeColor="#FF4FD8A0" strokeWidth={1} tappable={false} zIndex={2} />)}
    {!usingFallback && presences.map(({poi}) => <Marker key={poi.id} coordinate={poi} onPress={() => { clear(); setSelectedPoiId(poi.id); }} tracksViewChanges={false} zIndex={10}><View style={[styles.poiMarker,poi.type==='training_ground'&&styles.groundMarker]}><Ionicons name={poi.type==='arena'?'barbell':'flag'} color={poi.type==='arena'?'#F1E9FF':'#07100E'} size={17}/></View></Marker>)}
    {!usingFallback && <PlayerLocationMarker latitude={coordinate.latitude} longitude={coordinate.longitude} accuracy={location?.accuracy??null}/>}</MapView>
    {!locationReady&&<View style={styles.loading}><ActivityIndicator color={colors.lime}/><Text style={styles.loadingText}>LOCATING PLAYER…</Text></View>}
    {message&&<Pressable onPress={()=>setMessage(null)} style={styles.notice}><Ionicons name="location-outline" color={colors.gold} size={16}/><Text style={styles.noticeText}>{message}</Text><Ionicons name="close" color={colors.muted} size={15}/></Pressable>}
    {!message&&<View pointerEvents="none" style={styles.live}><View style={[styles.liveDot,usingFallback&&styles.fallbackDot]}/><Text style={styles.liveText}>{usingFallback?'LOCATION REQUIRED':regions.some(r=>r.source==='cache')?'LOCAL WORLD · CACHED':'LOCAL WORLD · LIVE'}</Text></View>}
    <Pressable accessibilityLabel="Center map on player" onPress={()=>mapRef.current?.animateToRegion({...coordinate,latitudeDelta:.013,longitudeDelta:.013},450)} style={styles.recenter}><Ionicons name="locate" color={colors.cyan} size={21}/></Pressable>
    {selectedTerritory&&<TerritoryCard territory={selectedTerritory} onClose={clear}/>} {presences.find(({poi})=>poi.id===selectedPoiId)?<PoiIntelCard presence={presences.find(({poi})=>poi.id===selectedPoiId)!} onClose={()=>setSelectedPoiId(null)}/>:null}
  </View>;
}
const styles=StyleSheet.create({container:{...StyleSheet.absoluteFillObject,overflow:'hidden',backgroundColor:'#0A1714'},poiMarker:{width:37,height:37,borderRadius:13,backgroundColor:'#5E35A9E8',borderWidth:2,borderColor:'#CDB4FF',justifyContent:'center',alignItems:'center',elevation:7},groundMarker:{backgroundColor:'#B7E85AE8',borderColor:'#E4FFAE'},loading:{position:'absolute',top:'42%',alignSelf:'center',borderRadius:14,backgroundColor:'#07100EEB',padding:12,flexDirection:'row',gap:8},loadingText:{color:colors.text,fontSize:9,fontWeight:'900'},notice:{position:'absolute',top:106,left:12,right:12,padding:10,backgroundColor:'#181B14F2',flexDirection:'row',gap:8},noticeText:{color:'#E7E7DB',fontSize:10,flex:1},live:{position:'absolute',top:106,left:12,borderRadius:10,padding:7,backgroundColor:'#07100ED9',flexDirection:'row',gap:6},liveDot:{width:6,height:6,borderRadius:3,backgroundColor:colors.cyan},fallbackDot:{backgroundColor:colors.gold},liveText:{color:colors.text,fontSize:8,fontWeight:'900'},recenter:{position:'absolute',right:12,top:158,width:42,height:42,borderRadius:14,backgroundColor:'#07100EEB',alignItems:'center',justifyContent:'center'}});
