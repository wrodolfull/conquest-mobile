import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { activities } from '@/mocks/home';
import { colors } from '@/theme';

export function ActivityGrid() {
  return <View style={styles.grid}>{activities.map((activity) => <Pressable key={activity.label} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}><View style={[styles.icon, { backgroundColor: `${activity.color}18` }]}><Ionicons name={activity.icon} color={activity.color} size={21} /></View><Text numberOfLines={1} style={styles.label}>{activity.label}</Text><Text style={styles.detail}>{activity.detail}</Text></Pressable>)}</View>;
}
const styles = StyleSheet.create({ grid: { flexDirection: 'row', gap: 8 }, card: { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' }, icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 7 }, label: { color: colors.text, fontWeight: '800', fontSize: 10 }, detail: { color: colors.muted, fontSize: 8, marginTop: 2 } });
