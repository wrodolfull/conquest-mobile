import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArenaCard } from '@/components/ArenaCard';
import { PlayerHeader } from '@/components/PlayerHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { ConquestMap } from '@/features/map/ConquestMap';
import { weeklyProgress } from '@/mocks/game';
import { colors } from '@/theme';
import { router } from 'expo-router';

export function HomeScreen() {
  return <View style={styles.screen}><PlayerHeader /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View><ConquestMap /><ArenaCard /></View><View style={styles.section}><SectionHeader title="Ready to move?" action="VIEW HISTORY" /><Pressable accessibilityRole="button" onPress={() => router.push('/activity/select')} style={({ pressed }) => [styles.start, pressed && styles.pressed]}><View style={styles.startIcon}><Ionicons name="play" size={24} color={colors.background} /></View><View style={styles.startCopy}><Text style={styles.startTitle}>Start activity</Text><Text style={styles.startDetail}>Walk, run, cycle or train indoors</Text></View><Ionicons name="chevron-forward" size={22} color={colors.lime} /></Pressable></View><View style={styles.section}><SectionHeader title="Weekly conquest" action={`${weeklyProgress.daysLeft} DAYS LEFT`} /><WeeklyProgress /></View></ScrollView></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 16, paddingBottom: 24, gap: 26 }, section: { gap: 12 }, start: { minHeight: 82, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#54702D', backgroundColor: '#152219' }, pressed: { opacity: 0.75 }, startIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.lime }, startCopy: { flex: 1, marginLeft: 13 }, startTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, startDetail: { color: colors.muted, fontSize: 12, marginTop: 4 } });
