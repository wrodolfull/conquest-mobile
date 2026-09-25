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
import type { ActiveActivitySession } from '@/services/storage/activeActivityRepository';
import { activeActivityRepository, loadTrackingState } from '@/services/storage/activeActivityRepository';
import type { ActivityPoint } from '@/features/activity/tracking';
import { routeFeatureCollection } from './mapbox/routeGeoJson';
import { provisionalTerritoryFeatureCollection } from '@/features/home/activeActivityMapFeedback';
import { mapControlBottomInset } from '@/features/home/homeOverlayLayout';

interface Props { activeActivity?: ActiveActivitySession; selectedTerritory: MapTerritory | null; onTerritorySelectionChange: (territory: MapTerritory | null) => void; bottomOverlayHeight?: number }
type CameraEvent = { properties?: { bounds?: { ne?: [number,number]; sw?: [number,number] } } };
const viewportFromEvent=(event:CameraEvent):WorldViewport|null=>{const ne=event.properties?.bounds?.ne,sw=event.properties?.bounds?.sw;if(!ne||!sw)return null;const viewport={west:sw[0],south:sw[1],east:ne[0],north:ne[1]};return viewport.east-viewport.west<=WORLD_VIEWPORT_MAX_DEGREES&&viewport.north-viewport.south<=WORLD_VIEWPORT_MAX_DEGREES?viewport:null};
export function ConquestMap({ activeActivity, selectedTerritory, onTerritorySelectionChange, bottomOverlayHeight = 0 }: Props) {
  const { user }=useAuth(); const camera=useRef<Mapbox.Camera>(null); const timer=useRef<ReturnType<typeof setTimeout>>(undefined); const latestViewport=useRef<WorldViewport|null>(null);
  const {location,locationReady,locationDenied,presences}=usePois(); const coordinate=location??FALLBACK_LOCATION; const usingFallback=locationDenied;
  const [message,setMessage]=useState<string|null>(null); const [selectedPoiId,setSelectedPoiId]=useState<string|null>(null); const [regions,setRegions]=useState<MapTerritory[]>([]); const lastRequest=useRef('');
  const [activeRoute,setActiveRoute]=useState<ActivityPoint[]>([]);
  const debugGrid=territoryGridDebugEnabled(__DEV__,process.env.EXPO_PUBLIC_ENABLE_TERRITORY_GRID_DEBUG);
  const atomicCells=useMemo(()=>debugGrid?territoryCandidatesForLocation(location,locationDenied):[],[debugGrid,location,locationDenied]);
  const territories=useMemo(()=>territoryFeatureCollection(regions,selectedTerritory?.id),[regions,selectedTerritory?.id]);
  const privateRoute=useMemo(()=>routeFeatureCollection(activeRoute),[activeRoute]);
  const provisionalTerritories=useMemo(()=>provisionalTerritoryFeatureCollection(activeRoute),[activeRoute]);
  const grid=useMemo(()=>({type:'FeatureCollection',features:atomicCells.map(cell=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[...cell.boundary,cell.boundary[0]!].map(p=>[p.longitude,p.latitude])}}))}),[atomicCells]);
  const pois=useMemo<FeatureCollection<PointGeometry,{id:string;type:string}>>(()=>({type:'FeatureCollection',features:presences.map(({poi})=>({type:'Feature',geometry:{type:'Point',coordinates:[poi.longitude,poi.latitude]},properties:{id:poi.id,type:poi.type}}))}),[presences]);
  const requestViewport=useCallback((bounds:WorldViewport|null)=>{if(!bounds||!user||locationDenied)return;const key=Object.values(bounds).map(n=>n.toFixed(4)).join(':');if(key===lastRequest.current)return;if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{lastRequest.current=key;void territoryRepository.getWorldRegionsWithMetadata(bounds).then(({regions:next,source})=>{setRegions(next);if(__DEV__){const counts={owned:0,contested:0,rival:0};let myInfluence=0;next.forEach(region=>{if(region.status!=='neutral')counts[region.status]+=1;myInfluence+=region.myInfluencePoints;});console.info('[Territory world regions]',{regionCount:next.length,statusCounts:counts,myInfluenceTotal:myInfluence,source});}})},400)},[locationDenied,user]);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  useEffect(()=>territoryRepository.subscribe(()=>{lastRequest.current='';requestViewport(latestViewport.current)}),[requestViewport]);
  useEffect(()=>{let mounted=true;const refresh=()=>{if(!activeActivity){setActiveRoute([]);return;}void loadTrackingState(activeActivity).then(state=>{if(mounted)setActiveRoute(state.accepted);});};refresh();const unsubscribe=activeActivityRepository.subscribe(refresh);return()=>{mounted=false;unsubscribe();};},[activeActivity]);
  useEffect(()=>{if(locationDenied)setMessage('Location is required to discover territories and Arenas.')},[locationDenied]);
  useEffect(()=>{if(locationReady&&location)camera.current?.setCamera({centerCoordinate:[location.longitude,location.latitude],zoomLevel:15,animationDuration:350})},[location,locationReady]);
  const clear=()=>onTerritorySelectionChange(null);
  return <View style={styles.container}><ConquestBaseMap onCameraChanged={(event:CameraEvent)=>{latestViewport.current=viewportFromEvent(event)}} onMapIdle={()=>requestViewport(latestViewport.current)} onPress={()=>{clear();setSelectedPoiId(null)}}>
    <Mapbox.Camera ref={camera} defaultSettings={{centerCoordinate:[coordinate.longitude,coordinate.latitude],zoomLevel:15}}/>
    {!usingFallback?<Mapbox.ShapeSource id="conquest-world-regions" shape={territories} onPress={event=>{const territory=resolveTerritoryTap(regions,event.features[0]?.properties?.regionId);if(territory){setSelectedPoiId(null);onTerritorySelectionChange(territory)}}}><Mapbox.FillLayer id="conquest-territory-fills" style={{fillColor:['get','renderFillColor'],fillOpacity:['get','renderFillOpacity']}}/><Mapbox.LineLayer id="conquest-territory-edges" style={{lineColor:['get','renderStrokeColor'],lineOpacity:['get','renderStrokeOpacity'],lineWidth:['get','renderStrokeWidth']}}/></Mapbox.ShapeSource>:null}
    {activeActivity&&activeRoute.length?<Mapbox.ShapeSource id="private-home-provisional-territory" shape={provisionalTerritories}><Mapbox.FillLayer id="private-home-provisional-territory-fill" style={{fillColor:'#B7FF5A',fillOpacity:0.22,fillOutlineColor:'#B7FF5A55'}}/><Mapbox.LineLayer id="private-home-provisional-territory-glow" style={{lineColor:'#B7FF5A',lineOpacity:0.25,lineBlur:5,lineWidth:8}}/></Mapbox.ShapeSource>:null}
    {activeActivity&&activeRoute.length?<Mapbox.ShapeSource id="private-home-active-route" shape={privateRoute}><Mapbox.LineLayer id="private-home-active-route-line" style={{lineColor:colors.cyan,lineWidth:3.5,lineCap:'round',lineJoin:'round',lineOpacity:0.92}}/></Mapbox.ShapeSource>:null}
    {debugGrid?<Mapbox.ShapeSource id="conquest-dev-atomic-grid" shape={grid}><Mapbox.LineLayer id="conquest-dev-atomic-grid-lines" style={{lineColor:'#FF4FD8A0',lineWidth:1}}/></Mapbox.ShapeSource>:null}
    {!usingFallback?<Mapbox.ShapeSource id="conquest-pois" shape={pois} onPress={event=>{clear();setSelectedPoiId(String(event.features[0]?.properties?.id??''))}}><Mapbox.CircleLayer id="conquest-poi-circles" style={{circleRadius:12,circleColor:['match',['get','type'],'arena','#5E35A9','#B7E85A'],circleStrokeColor:'#E4FFAE',circleStrokeWidth:2}}/></Mapbox.ShapeSource>:null}
    {!usingFallback&&location?<PlayerLocationMarker latitude={location.latitude} longitude={location.longitude} accuracy={location.accuracy??null}/>:null}
  </ConquestBaseMap>
  {!locationReady&&<View style={styles.loading}><ActivityIndicator color={colors.lime}/><Text style={styles.loadingText}>LOCATING PLAYER…</Text></View>}{message&&<Pressable onPress={()=>setMessage(null)} style={styles.notice}><Ionicons name="location-outline" color={colors.gold} size={16}/><Text style={styles.noticeText}>{message}</Text></Pressable>}
  <Pressable accessibilityLabel="Center map on player" accessibilityRole="button" disabled={!location} onPress={()=>location&&camera.current?.setCamera({centerCoordinate:[location.longitude,location.latitude],zoomLevel:15,animationDuration:450})} style={[styles.recenter,{bottom:mapControlBottomInset(bottomOverlayHeight,Boolean(selectedTerritory||selectedPoiId))}]}><Ionicons name="locate" color={colors.cyan} size={21}/></Pressable>
  {selectedTerritory&&<TerritoryCard territory={selectedTerritory} onClose={clear}/>}
  {presences.find(({poi})=>poi.id===selectedPoiId)?<PoiIntelCard presence={presences.find(({poi})=>poi.id===selectedPoiId)!} onClose={()=>setSelectedPoiId(null)}/>:null}</View>;
}
const styles=StyleSheet.create({container:{...StyleSheet.absoluteFillObject,overflow:'hidden',backgroundColor:'#0A1714'},loading:{position:'absolute',top:'42%',alignSelf:'center',borderRadius:14,backgroundColor:colors.mapOverlay,padding:12,flexDirection:'row',gap:8},loadingText:{color:colors.text,fontSize:9,fontWeight:'900'},notice:{position:'absolute',top:106,left:12,right:12,padding:10,backgroundColor:'#181B14F2',flexDirection:'row',gap:8},noticeText:{color:'#E7E7DB',fontSize:10,flex:1},recenter:{position:'absolute',right:12,width:46,height:46,borderRadius:15,backgroundColor:colors.mapOverlay,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'}});
