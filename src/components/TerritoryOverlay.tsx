import { StyleSheet, Text, View } from 'react-native';
import type { Territory } from '@/types/game';
import { colors } from '@/theme';

export function TerritoryOverlay({ territory }: { territory: Territory }) {
  return <View accessibilityLabel={`${territory.owner}, ${territory.domination}% influence`} style={[styles.zone, { backgroundColor: `${territory.color}24`, borderColor: `${territory.color}AA`, left: territory.position.left, top: territory.position.top, transform: [{ rotate: territory.rotation }] }]}><Text style={[styles.owner, { color: territory.color }]}>{territory.owner}</Text><Text style={styles.percent}>{territory.domination}%</Text></View>;
}
const styles = StyleSheet.create({ zone: { position: 'absolute', width: '39%', height: '34%', borderWidth: 1.5, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }, owner: { fontSize: 11, fontWeight: '900' }, percent: { color: colors.text, fontSize: 18, fontWeight: '900' } });
