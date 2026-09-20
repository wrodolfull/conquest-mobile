import Mapbox from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MapTerritory, WorldViewport } from '@/features/territories/types';
import { territoryCandidatesForLocation, territoryGridDebugEnabled, WORLD_VIEWPORT_MAX_DEGREES } from '@/features/territories/territoryMapData';
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

interface Props { selectedTerritory: MapTerritory | null; onTerritorySelectionChange: (territory: MapTerritory | null) => void }
type CameraEvent = { properties?: { bounds?: { ne?: [number,number]; sw?: [number,number] } } };
const viewportFromEvent=(event:CameraEvent):WorldViewport|null=>{const ne=event.properties?.bounds?.ne,sw=event.properties?.bounds?.sw;if(!ne||!sw)return null;const viewport={west:sw[0],south:sw[1],east:ne[0],north:ne[1]};return viewport.east-viewport.west<=WORLD_VIEWPORT_MAX_DEGREES&&viewport.north-viewport.south<=WORLD_VIEWPORT_MAX_DEGREES?viewport:null};
export function ConquestMap({ selectedTerritory, onTerritorySelectionChange }: Props) {
  const { user }=useAuth(); const camera=useRef<Mapbox.Camera>(null); const timer=useRef<ReturnType<typeof setTimeout>>(undefined); const latestViewport=useRef<WorldViewport|null>(null);
  const {location,locationReady,locationDenied,presences}=usePois(); const coordinate=location??FALLBACK_LOCATION; const usingFallback=locationDenied;
  const [message,setMessage]=useState<string|null>(null); const [selectedPoiId,setSelectedPoiId]=useState<string|null>(null); const [regions,setRegions]=useState<MapTerritory[]>([]); const lastRequest=useRef('');
  const debugGrid=territoryGridDebugEnabled(__DEV__,process.env.EXPO_PUBLIC_ENABLE_TERRITORY_GRID_DEBUG);
  const atomicCells=useMemo(()=>debugGrid?territoryCandidatesForLocation(location,locationDenied):[],[debugGrid,location,locationDenied]);
  const territories=useMemo(()=>territoryFeatureCollection(regions),[regions]);
  const grid=useMemo(()=>({type:'FeatureCollection',features:atomicCells.map(cell=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[...cell.boundary,cell.boundary[0]!].map(p=>[p.longitude,p.latitude])}}))}),[atomicCells]);
  const pois=useMemo<FeatureCollection<PointGeometry,{id:string;type:string}>>(()=>({type:'FeatureCollection',features:presences.map(({poi})=>({type:'Feature',geometry:{type:'Point',coordinates:[poi.longitude,poi.latitude]},properties:{id:poi.id,type:poi.type}}))}),[presences]);
  const requestViewport=useCallback((bounds:WorldViewport|null)=>{if(!bounds||!user||locationDenied)return;const key=Object.values(bounds).map(n=>n.toFixed(4)).join(':');if(key===lastRequest.current)return;if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{lastRequest.current=key;void territoryRepository.getWorldRegions(bounds).then(setRegions)},400)},[locationDenied,user]);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  useEffect(()=>territoryRepository.subscribe(()=>{lastRequest.current='';requestViewport(latestViewport.current)}),[requestViewport]);
  useEffect(()=>{if(locationDenied)setMessage('Location is required to discover territories and Arenas.')},[locationDenied]);
  useEffect(()=>{if(locationReady&&location)camera.current?.setCamera({centerCoordinate:[location.longitude,location.latitude],zoomLevel:15,animationDuration:350})},[location,locationReady]);
  const clear=()=>onTerritorySelectionChange(null);
  return <View style={styles.container}><ConquestBaseMap onCameraChanged={(event:CameraEvent)=>{latestViewport.current=viewportFromEvent(event)}} onMapIdle={()=>requestViewport(latestViewport.current)} onPress={()=>{clear();setSelectedPoiId(null)}}>
    <Mapbox.Camera ref={camera} defaultSettings={{centerCoordinate:[coordinate.longitude,coordinate.latitude],zoomLevel:15}}/>
    {!usingFallback?<Mapbox.ShapeSource id="conquest-world-regions" shape={territories} onPress={event=>{const territory=resolveTerritoryTap(regions,event.features[0]?.properties?.regionId);if(territory){setSelectedPoiId(null);onTerritorySelectionChange(territory)}}}><Mapbox.FillLayer id="conquest-territory-fills" style={{fillColor:['get','renderFillColor']}}/><Mapbox.LineLayer id="conquest-territory-edges" style={{lineColor:['get','renderStrokeColor'],lineWidth:['get','renderStrokeWidth']}}/></Mapbox.ShapeSource>:null}
    {debugGrid?<Mapbox.ShapeSource id="conquest-dev-atomic-grid" shape={grid}><Mapbox.LineLayer id="conquest-dev-atomic-grid-lines" style={{lineColor:'#FF4FD8A0',lineWidth:1}}/></Mapbox.ShapeSource>:null}
    {!usingFallback?<Mapbox.ShapeSource id="conquest-pois" shape={pois} onPress={event=>{clear();setSelectedPoiId(String(event.features[0]?.properties?.id??''))}}><Mapbox.CircleLayer id="conquest-poi-circles" style={{circleRadius:12,circleColor:['match',['get','type'],'arena','#5E35A9','#B7E85A'],circleStrokeColor:'#E4FFAE',circleStrokeWidth:2}}/></Mapbox.ShapeSource>:null}
    {!usingFallback&&location?<PlayerLocationMarker latitude={location.latitude} longitude={location.longitude} accuracy={location.accuracy??null}/>:null}
  </ConquestBaseMap>
  {!locationReady&&<View style={styles.loading}><ActivityIndicator color={colors.lime}/><Text style={styles.loadingText}>LOCATING PLAYER…</Text></View>}{message&&<Pressable onPress={()=>setMessage(null)} style={styles.notice}><Ionicons name="location-outline" color={colors.gold} size={16}/><Text style={styles.noticeText}>{message}</Text></Pressable>}
  <Pressable accessibilityLabel="Center map on player" disabled={!location} onPress={()=>location&&camera.current?.setCamera({centerCoordinate:[location.longitude,location.latitude],zoomLevel:15,animationDuration:450})} style={styles.recenter}><Ionicons name="locate" color={colors.cyan} size={21}/></Pressable>
  {selectedTerritory&&<TerritoryCard territory={selectedTerritory} onClose={clear}/>}
  {presences.find(({poi})=>poi.id===selectedPoiId)?<PoiIntelCard presence={presences.find(({poi})=>poi.id===selectedPoiId)!} onClose={()=>setSelectedPoiId(null)}/>:null}</View>;
}
const styles=StyleSheet.create({container:{...StyleSheet.absoluteFillObject,overflow:'hidden',backgroundColor:'#0A1714'},loading:{position:'absolute',top:'42%',alignSelf:'center',borderRadius:14,backgroundColor:'#07100EEB',padding:12,flexDirection:'row',gap:8},loadingText:{color:colors.text,fontSize:9,fontWeight:'900'},notice:{position:'absolute',top:106,left:12,right:12,padding:10,backgroundColor:'#181B14F2',flexDirection:'row',gap:8},noticeText:{color:'#E7E7DB',fontSize:10,flex:1},recenter:{position:'absolute',right:12,top:158,width:42,height:42,borderRadius:14,backgroundColor:'#07100EEB',alignItems:'center',justifyContent:'center'}});
