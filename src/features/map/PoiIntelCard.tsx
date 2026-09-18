import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TRAINING_GROUND_XP_MULTIPLIER } from '@/features/poi/config';
import type { PoiPresence } from '@/features/poi/types';
import { arenaRepository } from '@/services/storage/arenaRepository';
import { colors } from '@/theme';

export function PoiIntelCard({ presence, onClose }: { presence: PoiPresence; onClose: () => void }) {
  const [score, setScore] = useState(0); const [rank, setRank] = useState(7);
  useEffect(() => {
    if (presence.poi.type !== 'arena') return;
    const refresh = () => void arenaRepository.getLeaderboard(presence.poi.id).then((entries) => {
      const player = entries.find((item) => item.isPlayer); setScore(player?.points ?? 0); setRank(player?.rank ?? entries.length);
    });
    refresh(); return arenaRepository.subscribe(refresh);
  }, [presence.poi.id, presence.poi.type]);
  const active = presence.status !== 'outside';
  return <View style={[styles.card, presence.poi.type === 'training_ground' && styles.groundCard]}>
    <View style={styles.header}><View style={[styles.icon, presence.poi.type === 'training_ground' && styles.groundIcon]}><Ionicons name={presence.poi.type === 'arena' ? 'barbell' : 'flag'} color={presence.poi.type === 'arena' ? colors.violet : colors.lime} size={22} /></View><View style={styles.copy}><Text style={styles.eyebrow}>{presence.poi.type === 'arena' ? 'ARENA INTEL' : 'TRAINING GROUND'}</Text><Text style={styles.title}>{presence.poi.name}</Text><Text style={active ? styles.active : styles.detail}>{active ? 'ACTIVE' : `${Math.round(presence.distanceMeters)} m away`}</Text></View><Pressable accessibilityLabel="Close POI details" onPress={onClose}><Ionicons name="close" color={colors.muted} size={20} /></Pressable></View>
    {presence.poi.type === 'arena' ? <><Text style={styles.detail}>Weekly rank #{rank}  ·  {score.toLocaleString()} points  ·  7 competitors</Text><Pressable onPress={() => router.push({ pathname: '/poi/[id]', params: { id: presence.poi.id } })} style={styles.button}><Text style={styles.buttonText}>VIEW ARENA</Text></Pressable></> : <><Text style={styles.detail}>Outdoor bonus: +{Math.round((TRAINING_GROUND_XP_MULTIPLIER - 1) * 100)}% XP</Text><Pressable onPress={() => router.push({ pathname: '/poi/[id]', params: { id: presence.poi.id } })} style={styles.button}><Text style={styles.buttonText}>VIEW TRAINING GROUND</Text></Pressable></>}
  </View>;
}
const styles = StyleSheet.create({ card: { position: 'absolute', left: 12, right: 12, bottom: 106, padding: 14, borderRadius: 20, backgroundColor: '#0A1512F5', borderWidth: 1, borderColor: '#7557A8', elevation: 12 }, groundCard: { borderColor: '#80A93F' }, header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, icon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#A977FF20', borderWidth: 1, borderColor: '#A977FF70', alignItems: 'center', justifyContent: 'center' }, groundIcon: { backgroundColor: '#B7E85A18', borderColor: '#B7E85A70' }, copy: { flex: 1 }, eyebrow: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, title: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }, detail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 7 }, active: { color: colors.lime, fontSize: 9, fontWeight: '900', marginTop: 3 }, button: { marginTop: 10, height: 35, borderRadius: 11, backgroundColor: '#203229', alignItems: 'center', justifyContent: 'center' }, buttonText: { color: colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1 } });
