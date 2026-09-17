import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivitySelector } from '@/components/ActivitySelector';
import { ArenaCard } from '@/components/ArenaCard';
import { PlayerHeader } from '@/components/PlayerHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { ConquestMap } from '@/features/map/ConquestMap';
import { weeklyProgress } from '@/mocks/game';
import { colors } from '@/theme';

export function HomeScreen() {
  return <View style={styles.screen}><PlayerHeader /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View><ConquestMap /><ArenaCard /></View><View style={styles.section}><SectionHeader title="Choose your activity" action="VIEW HISTORY" /><ActivitySelector /></View><View style={styles.section}><SectionHeader title="Weekly conquest" action={`${weeklyProgress.daysLeft} DAYS LEFT`} /><WeeklyProgress /></View></ScrollView></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 16, paddingBottom: 24, gap: 26 }, section: { gap: 12 } });
