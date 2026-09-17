import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import type { IconName } from '@/types/game';

const items: { label: string; icon: IconName }[] = [{ label: 'Map', icon: 'map' }, { label: 'Activities', icon: 'pulse-outline' }, { label: 'Inventory', icon: 'cube-outline' }, { label: 'Battles', icon: 'flash-outline' }, { label: 'Ranking', icon: 'trophy-outline' }, { label: 'Profile', icon: 'person-outline' }];

export function BottomNavigation() {
  return <View style={styles.nav}>{items.map((item, index) => <Pressable key={item.label} style={styles.item}><Ionicons name={item.icon} size={21} color={index === 0 ? colors.lime : colors.muted} /><Text style={[styles.label, index === 0 && styles.active]}>{item.label}</Text>{index === 0 ? <View style={styles.indicator} /> : null}</Pressable>)}</View>;
}
const styles = StyleSheet.create({ nav: { flexDirection: 'row', backgroundColor: '#0B1513F7', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, paddingBottom: 4, paddingHorizontal: 4 }, item: { flex: 1, alignItems: 'center', gap: 3 }, label: { color: colors.muted, fontSize: 8, fontWeight: '700' }, active: { color: colors.lime }, indicator: { position: 'absolute', top: -10, width: 26, height: 2, borderRadius: 2, backgroundColor: colors.lime } });
