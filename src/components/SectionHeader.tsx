import { Text, View, StyleSheet } from 'react-native';
import { colors } from '@/theme';

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return <View style={styles.row}><Text style={styles.title}>{title}</Text>{action ? <Text style={styles.action}>{action}</Text> : null}</View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 }, action: { color: colors.lime, fontSize: 12, fontWeight: '700' } });
