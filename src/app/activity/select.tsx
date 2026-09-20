import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityFlowShell } from '@/components/ActivityFlowShell';
import { ActivitySelector } from '@/components/ActivitySelector';
import { colors } from '@/theme';
import { useActiveActivity } from '@/features/activity/useActiveActivity';

export default function SelectActivityScreen() {
  const active=useActiveActivity();
  if(active)return <ActivityFlowShell eyebrow="SESSION ACTIVE" title="Activity in progress"><View style={styles.note}><Text style={styles.noteTitle}>{active.type.toUpperCase()}</Text><Text style={styles.noteCopy}>Only one activity can run at a time. Return to your existing session.</Text><Pressable style={styles.resume} onPress={()=>router.replace({pathname:'/activity/active',params:{type:active.type,sessionId:active.id}})}><Text style={styles.resumeText}>RESUME ACTIVITY</Text></Pressable></View></ActivityFlowShell>;
  return <ActivityFlowShell eyebrow="NEW SESSION" title="Choose activity"><View style={styles.hero}><Text style={styles.heroTitle}>How are you moving?</Text><Text style={styles.copy}>Outdoor sessions use real foreground GPS. Choose a mode, confirm GPS, then put your phone away.</Text></View><ActivitySelector onSelect={(type) => { if(type !== 'indoor' || (__DEV__ && process.env.EXPO_PUBLIC_ENABLE_INDOOR_DEBUG === 'true')) router.replace({ pathname: '/activity/active', params: { type } }); }} /><View style={styles.note}><Text style={styles.noteTitle}>SAFE TRACKING</Text><Text style={styles.noteCopy}>Walking, running and cycling are real GPS sessions. Indoor tracking is coming soon and is not part of the live economy.</Text></View></ActivityFlowShell>;
}
const styles = StyleSheet.create({ hero: { marginTop: 24, marginBottom: 28 }, heroTitle: { color: colors.text, fontSize: 32, lineHeight: 38, fontWeight: '900' }, copy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10 }, note: { marginTop: 24, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, backgroundColor: colors.surface }, noteTitle: { color: colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }, noteCopy: { color: colors.muted, marginTop: 6, lineHeight: 20 },resume:{marginTop:18,padding:16,borderRadius:14,backgroundColor:colors.lime,alignItems:'center'},resumeText:{color:colors.background,fontWeight:'900'} });
