import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { usePois } from '@/features/poi/PoiContext';
import { colors } from '@/theme';
export function ArenaCard(){const{presences,locationDenied}=usePois();const arena=presences.filter(p=>p.poi.type==='arena').sort((a,b)=>a.distanceMeters-b.distanceMeters)[0];if(locationDenied||!arena)return null;return <LinearGradient colors={['#14231FEE','#0A1513E8']} style={styles.card}><View style={styles.icon}><Ionicons name="barbell" size={15} color={colors.violet}/></View><View style={styles.copy}><Text numberOfLines={1} style={styles.title}>{arena.poi.name}</Text><Text style={styles.eyebrow}>{Math.round(arena.distanceMeters)} M · ARENA NEARBY</Text></View></LinearGradient>}
const styles=StyleSheet.create({card:{marginHorizontal:12,paddingHorizontal:9,paddingVertical:7,borderRadius:15,borderWidth:1,borderColor:colors.border,flexDirection:'row',gap:8,alignItems:'center',alignSelf:'flex-start',maxWidth:230},icon:{width:30,height:30,borderRadius:10,backgroundColor:'#A977FF18',alignItems:'center',justifyContent:'center'},copy:{flexShrink:1},eyebrow:{color:colors.violet,fontSize:7,fontWeight:'900',letterSpacing:.7,marginTop:1},title:{color:colors.text,fontSize:11,fontWeight:'900'}});
