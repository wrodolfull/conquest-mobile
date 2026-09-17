import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { weeklyProgress } from '@/mocks/game';
import { colors } from '@/theme';

export function WeeklyProgress() {
  return (
    <LinearGradient colors={['#13201D', '#0C1614']} style={styles.card}>
      <View style={styles.medal}><Ionicons name="ribbon" size={25} color={colors.gold} /></View>
      <View style={styles.progress}>
        <View style={styles.progressHeader}>
          <View><Text style={styles.label}>WEEKLY GOAL</Text><Text style={styles.value}>{weeklyProgress.current} <Text style={styles.total}>/ {weeklyProgress.goal} km</Text></Text></View>
          <Text style={styles.remaining}>{weeklyProgress.daysLeft} DAYS LEFT</Text>
        </View>
        <View style={styles.bar}><LinearGradient colors={[colors.lime, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${weeklyProgress.percent}%` }]} /></View>
        <Text style={styles.rewardText}>Next reward  <Text style={styles.rewardStrong}>{weeklyProgress.reward}</Text></Text>
      </View>
      <View style={styles.rewardIcon}><Ionicons name="gift" size={22} color={colors.violet} /></View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 94, paddingHorizontal: 13, paddingVertical: 12, borderRadius: 22, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 11 },
  medal: { width: 40, height: 48, borderRadius: 14, backgroundColor: '#F8C14C12', alignItems: 'center', justifyContent: 'center' },
  progress: { flex: 1 },
  progressHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  label: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  value: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 1 },
  total: { color: colors.muted, fontSize: 11 },
  remaining: { color: colors.muted, fontSize: 7, fontWeight: '800', marginBottom: 3 },
  bar: { height: 6, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginTop: 7 },
  fill: { height: '100%', borderRadius: 4 },
  rewardText: { color: colors.muted, fontSize: 9, marginTop: 6 },
  rewardStrong: { color: colors.violet, fontWeight: '900' },
  rewardIcon: { width: 36, height: 44, borderLeftWidth: 1, borderLeftColor: colors.border, alignItems: 'flex-end', justifyContent: 'center' },
});
