import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { Territory } from '@/types/game';
import { colors } from '@/theme';

export function TerritoryOverlay({ territory }: { territory: Territory }) {
  return (
    <View
      accessibilityLabel={`${territory.owner}, ${territory.domination}% influence`}
      style={[styles.zone, { backgroundColor: `${territory.color}25`, borderColor: `${territory.color}CC`, left: territory.position.left, top: territory.position.top, transform: [{ rotate: territory.rotation }], shadowColor: territory.color }]}
    >
      <View style={[styles.zoneLobe, { backgroundColor: `${territory.color}16`, borderColor: `${territory.color}70` }]} />
      <View style={styles.ownerPlate}>
        <Ionicons name="trophy" size={13} color={territory.color} />
        <Text style={styles.owner}>{territory.owner}</Text>
        <Text style={[styles.percent, { color: territory.color }]}>{territory.domination}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { position: 'absolute', width: '39%', height: '27%', borderWidth: 1.5, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  zoneLobe: { position: 'absolute', width: '58%', height: '70%', right: -18, bottom: -13, borderWidth: 1, borderRadius: 25 },
  ownerPlate: { minWidth: 72, paddingHorizontal: 9, paddingVertical: 7, alignItems: 'center', borderRadius: 15, backgroundColor: '#07100EB8', borderWidth: 1, borderColor: '#FFFFFF14' },
  owner: { color: colors.text, fontSize: 10, fontWeight: '800', marginTop: 2 },
  percent: { fontSize: 16, lineHeight: 18, fontWeight: '900' },
});
