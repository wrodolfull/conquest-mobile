import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { usePois } from '@/features/poi/PoiContext';
import { colors } from '@/theme';
export function ArenaCard(){const{presences,locationDenied}=usePois();const arena=presences.filter(p=>p.poi.type==='arena').sort((a,b)=>a.distanceMeters-b.distanceMeters)[0];if(locationDenied||!arena)return null;return <LinearGradient colors={['#14231FEE','#0A1513F5']} style={styles.card}><View style={styles.icon}><Ionicons name="barbell" size={21} color={colors.violet}/></View><View><Text style={styles.eyebrow}>NEARBY ARENA · {Math.round(arena.distanceMeters)} M</Text><Text style={styles.title}>{arena.poi.name}</Text><Text style={styles.detail}>Enter the Arena zone to train</Text></View></LinearGradient>}
const styles=StyleSheet.create({card:{marginHorizontal:12,padding:12,borderRadius:17,borderWidth:1,borderColor:colors.border,flexDirection:'row',gap:11,alignItems:'center'},icon:{width:42,height:42,borderRadius:13,backgroundColor:'#A977FF18',alignItems:'center',justifyContent:'center'},eyebrow:{color:colors.violet,fontSize:8,fontWeight:'900',letterSpacing:1},title:{color:colors.text,fontSize:15,fontWeight:'900',marginTop:2},detail:{color:colors.muted,fontSize:9,marginTop:2}});
