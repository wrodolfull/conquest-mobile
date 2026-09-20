import Mapbox from '@rnmapbox/maps';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

interface Props { latitude: number; longitude: number; accuracy: number | null }
export function PlayerLocationMarker({ latitude, longitude, accuracy }: Props) {
  const radius = accuracy && accuracy > 0 ? Math.max(18, Math.min(42, accuracy)) : 24;
  return <Mapbox.PointAnnotation id="conquest-player" coordinate={[longitude, latitude]}><View style={[styles.glow,{width:radius,height:radius,borderRadius:radius/2}]}><View style={styles.ring}><View style={styles.dot}/></View></View></Mapbox.PointAnnotation>;
}
const styles=StyleSheet.create({glow:{backgroundColor:'#37D8D13D',alignItems:'center',justifyContent:'center'},ring:{width:24,height:24,borderRadius:12,borderWidth:1,borderColor:'#B9FFFC99',backgroundColor:'#37D8D12B',alignItems:'center',justifyContent:'center'},dot:{width:16,height:16,borderRadius:8,backgroundColor:colors.cyan,borderWidth:3,borderColor:'#E9FFFF'}});
