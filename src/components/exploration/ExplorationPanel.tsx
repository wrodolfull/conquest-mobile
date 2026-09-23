import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { explorationRepository } from '@/services/backend/explorationRepository';
import type { ExplorationSummary } from '@/features/exploration/explorationRules';
import { colors } from '@/theme';

export function ExplorationPanel() {
  const [summary, setSummary] = useState<ExplorationSummary | null | undefined>(() => explorationRepository.getLatest());
  useEffect(() => {
    const unsubscribe = explorationRepository.subscribe(setSummary);
    void explorationRepository.refresh();
    return unsubscribe;
  }, []);
  if (!summary) return null;
  return <View style={styles.panel}>
    <View style={styles.header}><Text style={styles.title}>EXPLORATION</Text>{summary.source==='cache'?<Text style={styles.cached}>LAST KNOWN</Text>:null}</View>
    <View style={styles.stats}><Metric value={summary.totalZonesDiscovered} label="ZONES DISCOVERED"/><Metric value={summary.zonesControlled} label="CONTROLLED"/><Metric value={summary.newZonesThisWeek} label="NEW THIS WEEK"/></View>
    <Text style={styles.subtitle}>WEEKLY OBJECTIVES</Text>
    {summary.objectives.map(item=><View style={styles.objective} key={item.key}><Text style={styles.objectiveName}>{item.title.toUpperCase()}</Text><Text style={styles.progress}>{Math.min(item.progress,item.target).toLocaleString()} / {item.target.toLocaleString()}</Text><Text style={item.rewardedAt?styles.done:styles.reward}>+{item.coins} COINS {item.rewardedAt?'✓':''}</Text></View>)}
    {summary.achievements.length?<Text style={styles.achievements}>{summary.achievements.length} ACHIEVEMENTS UNLOCKED</Text>:null}
  </View>;
}
function Metric({value,label}:{value:number;label:string}){return <View style={styles.metric}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>}
const styles=StyleSheet.create({panel:{marginHorizontal:14,marginBottom:14,padding:16,borderRadius:16,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},header:{flexDirection:'row',justifyContent:'space-between'},title:{color:colors.lime,fontWeight:'900',letterSpacing:1.5},cached:{color:colors.gold,fontSize:8,fontWeight:'900'},stats:{flexDirection:'row',marginTop:14,gap:7},metric:{flex:1},value:{color:colors.text,fontSize:22,fontWeight:'900'},label:{color:colors.muted,fontSize:7,fontWeight:'900',marginTop:3},subtitle:{color:colors.muted,fontSize:8,fontWeight:'900',letterSpacing:1.2,marginTop:17,marginBottom:5},objective:{flexDirection:'row',alignItems:'center',minHeight:31,borderTopWidth:1,borderTopColor:colors.border},objectiveName:{color:colors.text,fontSize:9,fontWeight:'900',flex:1},progress:{color:colors.muted,fontSize:9},reward:{color:colors.gold,fontSize:8,fontWeight:'900',width:76,textAlign:'right'},done:{color:colors.lime,fontSize:8,fontWeight:'900',width:76,textAlign:'right'},achievements:{color:colors.cyan,fontSize:9,fontWeight:'900',marginTop:12}});
