import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MapTerritory } from '@/features/territories/types';
import { colors } from '@/theme';

interface Props { territory: MapTerritory; onClose: () => void }

export function TerritoryCard({ territory, onClose }: Props) {
  const canChallenge = territory.playerInfluence >= 20 && territory.owner !== 'Rodolfo' && territory.owner !== 'Neutral';
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View><Text style={styles.eyebrow}>TERRITORY INTEL</Text><Text style={styles.title}>{territory.name}</Text></View>
        <Pressable accessibilityLabel="Close territory details" onPress={onClose} style={styles.close}><Ionicons name="close" color={colors.muted} size={20} /></Pressable>
      </View>
      <View style={styles.stats}>
        <Stat label="OWNER" value={territory.owner} />
        <Stat label="CONTROL" value={`${territory.controlPercentage}%`} />
        <Stat label="YOUR INFLUENCE" value={`${territory.playerInfluence}%`} />
        <Stat label="STATUS" value={territory.status.toUpperCase()} accent />
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.secondary}><Text style={styles.secondaryText}>VIEW TERRITORY</Text></Pressable>
        {canChallenge && <Pressable onPress={() => router.push('/battles')} style={styles.challenge}><Ionicons name="flash" size={14} color={colors.background} /><Text style={styles.challengeText}>CHALLENGE OWNER</Text></Pressable>}
      </View>
    </View>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <View style={styles.stat}><Text style={styles.label}>{label}</Text><Text numberOfLines={1} style={[styles.value, accent && styles.accent]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 12, right: 12, bottom: 106, padding: 14, borderRadius: 20, backgroundColor: '#0A1512F2', borderWidth: 1, borderColor: '#52665F', shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
  close: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFFFFF0B', alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', marginTop: 12, gap: 5 }, stat: { flex: 1 }, label: { color: colors.muted, fontSize: 6.5, fontWeight: '900', letterSpacing: 0.5 }, value: { color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 3 }, accent: { color: colors.gold },
  actions: { flexDirection: 'row', gap: 8, marginTop: 13 }, secondary: { flex: 1, height: 36, borderRadius: 11, borderWidth: 1, borderColor: '#52665F', alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  challenge: { flex: 1.15, height: 36, borderRadius: 11, backgroundColor: colors.lime, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' }, challengeText: { color: colors.background, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.4 },
});
