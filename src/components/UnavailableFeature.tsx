import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlayerHeader } from './PlayerHeader';
import { colors } from '@/theme';
import type { IconName } from '@/types/game';

export function UnavailableFeature({ title, description, icon, accent }: { title: string; description: string; icon: IconName; accent: string }) {
  return <View style={styles.screen}><PlayerHeader /><ScrollView contentContainerStyle={styles.content}><LinearGradient colors={[`${accent}22`, colors.surface]} style={[styles.card, { borderColor: `${accent}55` }]}><View style={[styles.icon, { backgroundColor: `${accent}20` }]}><Ionicons name={icon} size={34} color={accent} /></View><Text style={[styles.eyebrow, { color: accent }]}>COMING SOON</Text><Text style={styles.title}>{title}</Text><Text style={styles.copy}>{description}</Text><View style={styles.rule} /><Text style={styles.note}>This system is not active yet. CONQUEST will never show simulated progress as real.</Text></LinearGradient></ScrollView></View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},content:{padding:16,paddingTop:34},card:{alignItems:'center',padding:30,borderRadius:26,borderWidth:1},icon:{width:66,height:66,borderRadius:21,alignItems:'center',justifyContent:'center',marginBottom:18},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.5},title:{color:colors.text,fontSize:30,fontWeight:'900',marginTop:4},copy:{color:colors.muted,fontSize:14,lineHeight:21,textAlign:'center',marginTop:10,maxWidth:310},rule:{height:1,backgroundColor:colors.border,alignSelf:'stretch',marginVertical:22},note:{color:colors.muted,fontSize:10,lineHeight:16,textAlign:'center'}});
