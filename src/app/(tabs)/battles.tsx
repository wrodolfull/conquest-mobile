import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlayerHeader } from '@/components/PlayerHeader';
import { BattleHistory } from '@/components/profile/BattleHistory';
import { BATTLE_COOLDOWN_HOURS, BATTLE_ENERGY_COST, BATTLE_INFLUENCE_REWARD, BATTLE_RECENT_ACTIVITY_DAYS, CAPTURE_PROTECTION_HOURS } from '@/features/battles/battleRules';
import { colors } from '@/theme';

export default function BattlesScreen() {
  return <View style={styles.screen}>
    <PlayerHeader />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.icon}><Ionicons name="flash" size={28} color={colors.gold}/></View>
        <View style={styles.heroCopy}><Text style={styles.eyebrow}>TERRITORY PRESSURE</Text><Text style={styles.title}>BATTLES</Text><Text style={styles.description}>Apply pressure to rival zones where your recent movement has established a strong presence.</Text></View>
      </View>
      <View style={styles.stats}><Stat value={`-${BATTLE_ENERGY_COST}`} label="ENERGY"/><Stat value={`+${BATTLE_INFLUENCE_REWARD}`} label="INFLUENCE"/><Stat value={`${BATTLE_COOLDOWN_HOURS}H`} label="COOLDOWN"/></View>
      <View style={styles.rules}>
        <Text style={styles.sectionTitle}>HOW TO BATTLE</Text>
        <Rule icon="footsteps-outline" text={`Earn activity influence in a rival zone within the last ${BATTLE_RECENT_ACTIVITY_DAYS} days.`}/>
        <Rule icon="analytics-outline" text="Build at least half as much influence as its sole leader."/>
        <Rule icon="shield-checkmark-outline" text={`Captures receive ${CAPTURE_PROTECTION_HOURS} hours of Battle Protection. Activities always remain active.`}/>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Find a rival territory on the map" onPress={()=>router.push('/map')} style={({pressed})=>[styles.mapButton,pressed&&styles.pressed]}><Ionicons name="map" size={18} color={colors.background}/><Text style={styles.mapButtonText}>FIND A RIVAL TERRITORY</Text></Pressable>
      <BattleHistory />
    </ScrollView>
  </View>;
}
function Stat({value,label}:{value:string;label:string}){return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>}
function Rule({icon,text}:{icon:React.ComponentProps<typeof Ionicons>['name'];text:string}){return <View style={styles.rule}><Ionicons name={icon} size={19} color={colors.lime}/><Text style={styles.ruleText}>{text}</Text></View>}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},content:{padding:14,paddingBottom:30,gap:12},hero:{flexDirection:'row',alignItems:'center',gap:14,padding:18,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:'#7B6738'},icon:{width:54,height:54,borderRadius:17,alignItems:'center',justifyContent:'center',backgroundColor:'#FFD16618'},heroCopy:{flex:1},eyebrow:{color:colors.gold,fontSize:8,fontWeight:'900',letterSpacing:1.5},title:{color:colors.text,fontSize:25,fontWeight:'900',marginTop:2},description:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:5},stats:{flexDirection:'row',gap:8},stat:{flex:1,alignItems:'center',padding:13,borderRadius:15,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},statValue:{color:colors.text,fontSize:18,fontWeight:'900'},statLabel:{color:colors.muted,fontSize:7,fontWeight:'900',letterSpacing:1,marginTop:3},rules:{padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:13},sectionTitle:{color:colors.lime,fontSize:10,fontWeight:'900',letterSpacing:1.4},rule:{flexDirection:'row',alignItems:'center',gap:11},ruleText:{flex:1,color:colors.muted,fontSize:11,lineHeight:16},mapButton:{height:48,borderRadius:14,backgroundColor:colors.lime,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},mapButtonText:{color:colors.background,fontWeight:'900',fontSize:11,letterSpacing:.8},pressed:{opacity:.78}});
