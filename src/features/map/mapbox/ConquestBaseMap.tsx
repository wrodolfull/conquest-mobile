import Mapbox from '@rnmapbox/maps';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mapboxConfigurationError, mapboxStyleURL, usesBuiltInMapboxStyle } from './mapboxConfig';
import { nextMapLoadingState, safeMapboxDiagnostic, type MapLoadingState } from './mapLoadingState';

interface Props extends Omit<ComponentProps<typeof Mapbox.MapView>, 'styleURL' | 'style'> { children?: ReactNode; fallbackLabel?: string }
export function ConquestBaseMap({ children, fallbackLabel = 'MAP UNAVAILABLE', ...props }: Props) {
  const [loadingState, setLoadingState] = useState<MapLoadingState>('loading');
  const watchdog=useRef<ReturnType<typeof setTimeout>>(undefined);
  const clearWatchdog=()=>{if(watchdog.current){clearTimeout(watchdog.current);watchdog.current=undefined;}};
  const startWatchdog=()=>{clearWatchdog();watchdog.current=setTimeout(()=>{watchdog.current=undefined;if(__DEV__)console.error('[Mapbox] Base map loading timed out.',{style:usesBuiltInMapboxStyle?'built-in-dark':'custom'});setLoadingState(state=>nextMapLoadingState(state,'timeout'))},20_000);};
  useEffect(()=>()=>{if(watchdog.current)clearTimeout(watchdog.current)},[]);
  if (mapboxConfigurationError) return <View style={styles.fallback}><Text style={styles.title}>{fallbackLabel}</Text><Text style={styles.message}>{mapboxConfigurationError}</Text></View>;
  const { onWillStartLoadingMap, onDidFinishLoadingStyle, onDidFinishLoadingMap, onMapLoadingError, ...mapProps } = props;
  return <View style={StyleSheet.absoluteFill}><Mapbox.MapView {...mapProps} onWillStartLoadingMap={()=>{setLoadingState(state=>nextMapLoadingState(state,'start'));startWatchdog();onWillStartLoadingMap?.()}} onDidFinishLoadingStyle={()=>{setLoadingState(state=>nextMapLoadingState(state,'style'));onDidFinishLoadingStyle?.()}} onDidFinishLoadingMap={()=>{clearWatchdog();setLoadingState(state=>nextMapLoadingState(state,'finish'));onDidFinishLoadingMap?.()}} onMapLoadingError={()=>{clearWatchdog();setLoadingState(state=>nextMapLoadingState(state,'error'));if(__DEV__)console.error('[Mapbox] Base style/resource loading failed.',{style:usesBuiltInMapboxStyle?'built-in-dark':'custom',error:safeMapboxDiagnostic(undefined)});onMapLoadingError?.()}} attributionEnabled logoEnabled style={StyleSheet.absoluteFill} styleURL={mapboxStyleURL}>{children}</Mapbox.MapView>{loadingState==='error'?<View pointerEvents="none" style={styles.network}><Text style={styles.title}>MAP UNAVAILABLE</Text><Text style={styles.message}>The base map could not load. Your activity data remains safely stored on this device.</Text></View>:null}</View>;
}
const styles = StyleSheet.create({ fallback:{...StyleSheet.absoluteFillObject,backgroundColor:'#07100E',alignItems:'center',justifyContent:'center',padding:24},network:{position:'absolute',top:12,left:12,right:12,backgroundColor:'#181B14F2',padding:10,borderRadius:10},title:{color:'#FFCA5C',fontWeight:'900',fontSize:12},message:{color:'#A2ADA9',fontSize:11,textAlign:'center',marginTop:8} });
