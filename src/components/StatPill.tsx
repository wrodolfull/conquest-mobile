import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { IconName } from '@/types/game';
import { colors } from '@/theme';

export function StatPill({ icon, value, tint }: { icon: IconName; value: string; tint: string }) {
  return <View style={styles.pill}><Ionicons name={icon} size={15} color={tint} /><Text style={styles.value}>{value}</Text></View>;
}
const styles = StyleSheet.create({ pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 10 }, value: { color: colors.text, fontWeight: '800', fontSize: 12 } });
