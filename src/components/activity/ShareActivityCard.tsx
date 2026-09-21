import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { activities } from '@/config/game';
import { formatDuration } from '@/features/activity/activityRules';
import type { ActivityShareModel } from '@/features/activity/shareModel';
import { colors } from '@/theme';

export function ShareActivityCard({ model }: { model: ActivityShareModel }) {
  const activity = activities.find(({ id }) => id === model.activityType)!;
  return (
    <View collapsable={false} style={styles.card} testID="share-activity-card">
      <View style={styles.topLine} />
      <View style={styles.brandRow}>
        <Text style={styles.brand}>CONQUEST</Text>
        <View style={[styles.icon, { borderColor: activity.color }]}>
          <Ionicons name={activity.icon} size={21} color={activity.color} />
        </View>
      </View>
      <Text style={[styles.type, { color: activity.color }]}>{activity.label.toUpperCase()}</Text>
      <Text style={styles.distance}>{(model.distanceMeters / 1000).toFixed(2)}</Text>
      <Text style={styles.unit}>KILOMETRES</Text>
      <View style={styles.rule} />
      <Text style={styles.duration}>{formatDuration(model.durationSeconds)}</Text>
      <Text style={styles.durationLabel}>DURATION</Text>
      <View style={styles.stats}>
        <CardStat value={`+${model.xpEarned}`} label="XP" />
        <CardStat value={`+${model.influenceEarned}`} label="INFLUENCE" />
        <CardStat value={String(model.territoriesImpacted)} label="TERRITORIES" />
      </View>
      {model.lootSummary ? <View style={styles.loot}><Text style={styles.lootLabel}>LOOT SECURED</Text><Text numberOfLines={2} style={styles.lootValue}>{model.lootSummary}</Text></View> : null}
      <View style={styles.footer}>
        <Text style={styles.date}>{new Date(model.completedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</Text>
        <Text style={styles.tagline}>MOVE · EXPLORE · CONQUER</Text>
      </View>
    </View>
  );
}

function CardStat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { width: 340, minHeight: 500, padding: 26, overflow: 'hidden', borderRadius: 28, backgroundColor: '#091310', borderWidth: 1, borderColor: '#29413A' },
  topLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: colors.lime },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.text, fontSize: 17, fontWeight: '900', letterSpacing: 3 },
  icon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10201C' },
  type: { marginTop: 32, fontSize: 12, fontWeight: '900', letterSpacing: 2.5 },
  distance: { color: colors.text, marginTop: 3, fontSize: 66, lineHeight: 74, fontWeight: '900', letterSpacing: -3 },
  unit: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  rule: { width: 46, height: 3, marginVertical: 24, backgroundColor: colors.cyan, borderRadius: 2 },
  duration: { color: colors.text, fontSize: 30, fontWeight: '800' },
  durationLabel: { color: colors.muted, marginTop: 2, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  stats: { flexDirection: 'row', marginTop: 24, gap: 7 },
  stat: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 13, backgroundColor: '#12211D' },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '900' },
  statLabel: { color: colors.muted, marginTop: 4, fontSize: 7, fontWeight: '900' },
  loot: { marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#31463F' },
  lootLabel: { color: colors.lime, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  lootValue: { color: colors.text, marginTop: 4, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  footer: { marginTop: 'auto', paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  date: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  tagline: { color: colors.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
});
