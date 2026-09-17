import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityGrid } from '@/features/activities/ActivityGrid';
import { NearbyArena } from '@/features/arenas/NearbyArena';
import { ConquestMap } from '@/features/map/ConquestMap';
import { BottomNavigation } from '@/components/BottomNavigation';
import { IconButton } from '@/components/IconButton';
import { SectionHeader } from '@/components/SectionHeader';
import { StatPill } from '@/components/StatPill';
import { colors } from '@/theme';

export function HomeScreen() {
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}><View style={styles.header}><View style={styles.avatar}><Text style={styles.avatarText}>R</Text><View style={styles.level}><Text style={styles.levelText}>12</Text></View></View><View style={styles.player}><Text style={styles.welcome}>WELCOME BACK</Text><Text style={styles.name}>Rodolfo</Text><View style={styles.xpTrack}><LinearGradient colors={[colors.lime, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.xpFill} /></View><Text style={styles.xpText}>2,480 / 3,200 XP</Text></View><View style={styles.headerActions}><StatPill icon="flash" value="850" tint={colors.cyan} /><StatPill icon="logo-bitcoin" value="3,420" tint={colors.gold} /><IconButton icon="notifications-outline" label="Notifications" badge /></View></View><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View><ConquestMap /><NearbyArena /></View><View style={styles.section}><SectionHeader title="Choose your activity" action="VIEW HISTORY" /><ActivityGrid /></View><View style={styles.section}><SectionHeader title="Weekly conquest" action="4 DAYS LEFT" /><LinearGradient colors={['#151F1C', '#101916']} style={styles.progressCard}><View style={styles.progressTop}><View><Text style={styles.progressLabel}>DISTANCE THIS WEEK</Text><Text style={styles.progressValue}>12.4 <Text style={styles.progressTotal}>/ 25 km</Text></Text></View><View style={styles.rewardIcon}><Ionicons name="diamond" size={20} color={colors.violet} /></View></View><View style={styles.bar}><LinearGradient colors={[colors.lime, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.barFill} /></View><View style={styles.rewardRow}><Ionicons name="gift-outline" size={14} color={colors.violet} /><Text style={styles.rewardText}>Next reward: <Text style={styles.rewardStrong}>Epic Item</Text></Text><Text style={styles.remaining}>12.6 km remaining</Text></View></LinearGradient></View></ScrollView><BottomNavigation /></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 47, height: 47, borderRadius: 16, backgroundColor: '#263723', borderWidth: 1, borderColor: '#55703D', justifyContent: 'center', alignItems: 'center' }, avatarText: { color: colors.lime, fontSize: 20, fontWeight: '900' },
  level: { position: 'absolute', right: -5, bottom: -4, backgroundColor: colors.lime, borderRadius: 8, minWidth: 19, height: 17, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' }, levelText: { fontSize: 9, fontWeight: '900', color: colors.background },
  player: { flex: 1, minWidth: 90 }, welcome: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 }, name: { color: colors.text, fontSize: 18, fontWeight: '900', marginVertical: 1 }, xpTrack: { height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' }, xpFill: { height: '100%', width: '77%' }, xpText: { color: colors.muted, fontSize: 7, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 }, content: { paddingHorizontal: 16, paddingBottom: 24, gap: 26 }, section: { gap: 12 },
  progressCard: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border }, progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, progressLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, progressValue: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 3 }, progressTotal: { color: colors.muted, fontSize: 14 }, rewardIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#A977FF18', alignItems: 'center', justifyContent: 'center' },
  bar: { height: 8, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden', marginVertical: 12 }, barFill: { width: '49.6%', height: '100%', borderRadius: 5 }, rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, rewardText: { color: colors.muted, fontSize: 11 }, rewardStrong: { color: colors.violet, fontWeight: '800' }, remaining: { color: colors.muted, fontSize: 9, marginLeft: 'auto' },
});
