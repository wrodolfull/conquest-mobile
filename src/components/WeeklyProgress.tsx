import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { weeklyProgress } from '@/mocks/game';
import { colors } from '@/theme';

export function WeeklyProgress() {
  return (
    <LinearGradient colors={['#13201D', '#0C1614']} style={styles.card}>
      <View style={styles.medal}><Ionicons name="ribbon" size={18} color={colors.gold} /></View>
      <View style={styles.progress}>
        <View style={styles.progressHeader}>
          <View><Text style={styles.label}>WEEKLY GOAL</Text><Text style={styles.value}>{weeklyProgress.current} <Text style={styles.total}>/ {weeklyProgress.goal} km</Text></Text></View>
          <Text style={styles.remaining}>NEXT · {weeklyProgress.reward}</Text>
        </View>
        <View style={styles.bar}><LinearGradient colors={[colors.lime, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${weeklyProgress.percent}%` }]} /></View>
      </View>
      <View style={styles.rewardIcon}><Ionicons name="gift" size={18} color={colors.violet} /></View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 58, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 17, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  medal: { width: 30, height: 38, borderRadius: 10, backgroundColor: '#F8C14C12', alignItems: 'center', justifyContent: 'center' },
  progress: { flex: 1 },
  progressHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  label: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  value: { color: colors.text, fontSize: 15, fontWeight: '900' },
  total: { color: colors.muted, fontSize: 10 },
  remaining: { color: colors.violet, fontSize: 7, fontWeight: '800', marginBottom: 2 },
  bar: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 4 },
  rewardIcon: { width: 28, height: 34, borderLeftWidth: 1, borderLeftColor: colors.border, alignItems: 'flex-end', justifyContent: 'center' },
});
