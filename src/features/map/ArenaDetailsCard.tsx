import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MapArena } from '@/features/territories/types';
import { colors } from '@/theme';

export function ArenaDetailsCard({ arena, onClose }: { arena: MapArena; onClose: () => void }) {
  return <View style={styles.card}>
    <View style={styles.icon}><Ionicons name="barbell" color={colors.violet} size={22} /></View>
    <View style={styles.copy}><Text style={styles.eyebrow}>NEARBY ARENA · {arena.distance}</Text><Text style={styles.title}>{arena.name}</Text><Text style={styles.detail}>Level {arena.level}  ·  {arena.weeklyCompetitors} weekly competitors  ·  Your rank #{arena.playerRanking}</Text></View>
    <Pressable accessibilityLabel="Close arena details" onPress={onClose}><Ionicons name="close" color={colors.muted} size={20} /></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 12, right: 12, bottom: 106, minHeight: 92, padding: 14, borderRadius: 20, backgroundColor: '#0A1512F2', borderWidth: 1, borderColor: '#7557A8', flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 12 },
  icon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#A977FF20', borderWidth: 1, borderColor: '#A977FF70', alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, eyebrow: { color: colors.violet, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, title: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 3 }, detail: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 4 },
});
