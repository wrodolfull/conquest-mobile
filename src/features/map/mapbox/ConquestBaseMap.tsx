import Mapbox from '@rnmapbox/maps';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mapboxConfigurationError, mapboxStyleURL } from './mapboxConfig';

interface Props extends Omit<ComponentProps<typeof Mapbox.MapView>, 'styleURL' | 'style'> { children?: ReactNode; fallbackLabel?: string }
export function ConquestBaseMap({ children, fallbackLabel = 'MAP UNAVAILABLE', ...props }: Props) {
  const [loadFailed, setLoadFailed] = useState(false);
  if (mapboxConfigurationError) return <View style={styles.fallback}><Text style={styles.title}>{fallbackLabel}</Text><Text style={styles.message}>{mapboxConfigurationError}</Text></View>;
  return <View style={StyleSheet.absoluteFill}><Mapbox.MapView {...props} onDidFailLoadingMap={()=>setLoadFailed(true)} onDidFinishLoadingMap={event=>{setLoadFailed(false);props.onDidFinishLoadingMap?.(event)}} attributionEnabled logoEnabled style={StyleSheet.absoluteFill} styleURL={mapboxStyleURL}>{children}</Mapbox.MapView>{loadFailed?<View pointerEvents="none" style={styles.network}><Text style={styles.title}>MAP TILES UNAVAILABLE</Text><Text style={styles.message}>Your activity data remains safely stored on this device.</Text></View>:null}</View>;
}
const styles = StyleSheet.create({ fallback:{...StyleSheet.absoluteFillObject,backgroundColor:'#07100E',alignItems:'center',justifyContent:'center',padding:24},network:{position:'absolute',top:12,left:12,right:12,backgroundColor:'#181B14F2',padding:10,borderRadius:10},title:{color:'#FFCA5C',fontWeight:'900',fontSize:12},message:{color:'#A2ADA9',fontSize:11,textAlign:'center',marginTop:8} });
