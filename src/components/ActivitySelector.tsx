import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { activities } from '@/config/game';
import { colors } from '@/theme';
import type { ActivityType } from '@/types/game';

interface ActivitySelectorProps { onSelect?: (type: ActivityType) => void }

export function ActivitySelector({ onSelect }: ActivitySelectorProps) {
  const indoorEnabled = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_INDOOR_DEBUG === 'true';
  return <View style={styles.grid}>{activities.map((activity) => { const disabled = activity.id === 'indoor' && !indoorEnabled; return <Pressable accessibilityRole="button" accessibilityLabel={`${activity.label}. ${disabled ? 'Coming soon' : activity.detail}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => onSelect?.(activity.id)} key={activity.label} style={({ pressed }) => [styles.card, disabled && styles.disabled, pressed && styles.pressed]}><View style={[styles.icon, { backgroundColor: `${activity.color}18` }]}><Ionicons name={activity.icon} color={activity.color} size={25} /></View><View style={styles.copy}><Text style={styles.label}>{activity.label}</Text><Text style={styles.detail}>{activity.detail}</Text></View>{disabled ? <Text style={styles.soon}>SOON</Text> : <Ionicons name="chevron-forward" color={colors.muted} size={17} />}</Pressable>;})}</View>;
}
const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, card: { width: '48%', minWidth: 136, minHeight: 92, flexGrow: 1, flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 13, alignItems: 'center', gap: 10 }, disabled: { opacity: 0.58 }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] }, icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0 }, label: { color: colors.text, fontWeight: '900', fontSize: 15 }, detail: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }, soon: { color: colors.violet, fontSize: 8, fontWeight: '900' } });
