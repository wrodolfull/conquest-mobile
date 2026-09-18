import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlayerHeader } from '@/components/PlayerHeader';
import type { CompletedOutdoorActivity } from '@/features/activity/outdoorRules';
import { formatDuration } from '@/features/activity/activityRules';
import { activityRepository } from '@/services/storage/activityRepository';
import { colors } from '@/theme';

export default function ActivitiesScreen() {
  const [items, setItems] = useState<CompletedOutdoorActivity[]>([]);
  useFocusEffect(useCallback(() => { void activityRepository.list().then(setItems); }, []));
  return <View style={styles.screen}><PlayerHeader /><ScrollView contentContainerStyle={styles.content}><Text style={styles.eyebrow}>ACTIVITY LOG</Text><Text style={styles.title}>Your conquests</Text>{items.length === 0 ? <View style={styles.card}><Text style={styles.cardTitle}>No outdoor activities yet</Text><Text style={styles.copy}>Finish a GPS-tracked walk, run or ride to see it here.</Text></View> : items.map((item) => <View key={item.id} style={styles.card}><Text style={styles.type}>{item.type.toUpperCase()}</Text><Text style={styles.distance}>{(item.distanceMeters / 1000).toFixed(2)} km</Text><Text style={styles.copy}>{formatDuration(item.durationSeconds)} · {item.traversals.length} territories · +{item.influenceEarned} influence</Text></View>)}</ScrollView></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 16, gap: 12 }, eyebrow: { color: colors.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginTop: 8 }, title: { color: colors.text, fontSize: 29, fontWeight: '900' }, card: { backgroundColor: colors.surface, padding: 18, borderRadius: 19, borderWidth: 1, borderColor: colors.border }, cardTitle: { color: colors.text, fontWeight: '900', fontSize: 17 }, copy: { color: colors.muted, marginTop: 5, fontSize: 11 }, type: { color: colors.cyan, fontWeight: '900', fontSize: 9, letterSpacing: 1 }, distance: { color: colors.text, fontWeight: '900', fontSize: 23, marginTop: 4 } });
