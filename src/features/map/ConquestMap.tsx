import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { territories } from '@/mocks/home';
import { colors } from '@/theme';
import type { IconName } from '@/types/game';

const pins: { icon: IconName; left: `${number}%`; top: `${number}%`; color: string }[] = [
  { icon: 'flash', left: '44%', top: '22%', color: colors.danger }, { icon: 'gift', left: '79%', top: '38%', color: colors.gold },
  { icon: 'barbell', left: '27%', top: '65%', color: colors.violet }, { icon: 'flag', left: '68%', top: '75%', color: colors.cyan },
];

export function ConquestMap() {
  return (
    <View style={styles.map}>
      <LinearGradient colors={['#17231F', '#0B1513']} style={StyleSheet.absoluteFill} />
      <View style={[styles.road, { width: '120%', top: '45%', left: '-10%', transform: [{ rotate: '-13deg' }] }]} />
      <View style={[styles.road, { width: '85%', top: '30%', left: '35%', transform: [{ rotate: '68deg' }] }]} />
      {territories.map((territory) => <View key={territory.owner} style={[styles.zone, { backgroundColor: `${territory.color}24`, borderColor: `${territory.color}AA`, left: territory.position.left, top: territory.position.top, transform: [{ rotate: territory.rotation }] }]}><Text style={[styles.owner, { color: territory.color }]}>{territory.owner}</Text><Text style={styles.percent}>{territory.domination}%</Text></View>)}
      {pins.map((pin) => <View key={pin.icon} style={[styles.pin, { left: pin.left, top: pin.top, borderColor: pin.color }]}><Ionicons name={pin.icon} size={16} color={pin.color} /></View>)}
      <View style={styles.playerHalo}><View style={styles.player}><Ionicons name="navigate" size={14} color="#07100E" /></View></View>
      <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE TERRITORIES</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 330, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, position: 'relative' },
  road: { position: 'absolute', height: 3, backgroundColor: '#30423D', borderRadius: 4 },
  zone: { position: 'absolute', width: '39%', height: '34%', borderWidth: 1.5, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  owner: { fontSize: 11, fontWeight: '900' }, percent: { color: colors.text, fontSize: 18, fontWeight: '900' },
  pin: { position: 'absolute', width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 12, backgroundColor: '#101B18', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  playerHalo: { position: 'absolute', left: '47%', top: '45%', width: 44, height: 44, borderRadius: 22, backgroundColor: '#C8FF4A33', justifyContent: 'center', alignItems: 'center' },
  player: { width: 27, height: 27, borderRadius: 14, backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F4FFD8' },
  live: { position: 'absolute', left: 12, top: 12, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: '#07100ECC', flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, backgroundColor: colors.lime, borderRadius: 3 }, liveText: { color: colors.text, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
});
