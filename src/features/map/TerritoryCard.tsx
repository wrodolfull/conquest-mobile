import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MapTerritory } from '@/features/territories/types';
import { colors } from '@/theme';
import { territoryStatusLabel } from './mapVisuals';

export function TerritoryCard({ territory, onClose }: { territory: MapTerritory; onClose: () => void }) {
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(entrance, { duration: 180, toValue: 1, useNativeDriver: true }).start(); }, [entrance]);
  const own = territory.status === 'owned';
  const delta = Math.max(0, territory.ownerInfluencePoints - territory.myInfluencePoints + 1);
  return <Animated.View style={[styles.card, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
    <View style={styles.heading}><View><Text style={styles.eyebrow}>{own ? 'YOUR TERRITORY' : 'TERRITORY INTEL'}</Text><Text style={styles.title}>{territory.name}</Text><Text style={styles.subtitle}>{territory.ownerDisplayName ? `Led by ${territory.ownerDisplayName}` : 'No current leader'}</Text></View><Pressable accessibilityLabel="Close territory details" onPress={onClose} style={styles.close}><Ionicons name="close" color={colors.muted} size={20} /></Pressable></View>
    <View style={styles.stats}><Stat label="LEADER" value={territory.ownerDisplayName ?? 'No sole leader'} /><Stat label="CONTROL" value={`${Math.round(territory.controlPercentage)}%`} /><Stat label="YOUR INFLUENCE" value={`${territory.myInfluencePoints} pts`} /><Stat label="LEADER INFLUENCE" value={`${territory.ownerInfluencePoints} pts`} /><Stat label="TOTAL INFLUENCE" value={`${territory.totalInfluencePoints} pts`} /><Stat label="STATUS" value={territoryStatusLabel(territory.status)} accent /></View>
    {!own && territory.ownerUserId ? <Text style={styles.delta}>{delta} more influence {delta === 1 ? 'point' : 'points'} needed to take the lead</Text> : null}
    {__DEV__ && <Text style={styles.debug}>{territory.source.toUpperCase()} · {territory.geometryType} · ATOMIC ZONE</Text>}
  </Animated.View>;
}
function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <View style={styles.stat}><Text style={styles.label}>{label}</Text><Text numberOfLines={1} style={[styles.value, accent && styles.accent]}>{value}</Text></View>; }
const styles = StyleSheet.create({ card: { position: 'absolute', left: 12, right: 12, bottom: 12, padding: 18, borderRadius: 20, backgroundColor: '#0A1512F2', borderWidth: 1, borderColor: '#52665F' }, heading: { flexDirection: 'row', justifyContent: 'space-between' }, eyebrow: { color: colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 }, title: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }, subtitle: { color: colors.muted, fontSize: 10, marginTop: 3 }, close: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFFFFF0B', alignItems: 'center', justifyContent: 'center' }, stats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 12 }, stat: { width: '33%' }, label: { color: colors.muted, fontSize: 6.5, fontWeight: '900' }, value: { color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 4 }, accent: { color: colors.gold }, delta: { color: colors.lime, fontSize: 10, fontWeight: '800', marginTop: 14 }, debug: { color: colors.muted, fontSize: 7, marginTop: 10 } });
