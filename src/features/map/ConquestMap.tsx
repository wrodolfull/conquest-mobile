import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { TerritoryOverlay } from '@/components/TerritoryOverlay';
import { territories } from '@/mocks/game';
import { colors } from '@/theme';
import type { IconName } from '@/types/game';

const pins: { icon: IconName; left: `${number}%`; top: `${number}%`; color: string }[] = [
  { icon: 'flash', left: '48%', top: '51%', color: colors.danger },
  { icon: 'gift', left: '67%', top: '37%', color: colors.gold },
  { icon: 'barbell', left: '39%', top: '31%', color: colors.violet },
  { icon: 'flag', left: '74%', top: '69%', color: colors.cyan },
];

const streets = [
  { top: '25%', left: '-12%', width: '130%', rotate: '-12deg' },
  { top: '44%', left: '-8%', width: '125%', rotate: '8deg' },
  { top: '70%', left: '-5%', width: '118%', rotate: '-9deg' },
  { top: '48%', left: '13%', width: '92%', rotate: '71deg' },
  { top: '43%', left: '45%', width: '82%', rotate: '88deg' },
] as const;

export function ConquestMap() {
  return (
    <View style={styles.map}>
      <LinearGradient colors={['#132722', '#071311', '#091713']} style={StyleSheet.absoluteFill} />
      <View style={styles.grid} />
      {streets.map((street, index) => <View key={index} style={[styles.road, street]}><View style={styles.roadCenter} /></View>)}
      <View style={[styles.water, styles.waterOne]} /><View style={[styles.water, styles.waterTwo]} />
      <View style={[styles.block, styles.blockOne]} /><View style={[styles.block, styles.blockTwo]} /><View style={[styles.block, styles.blockThree]} />
      <Text style={[styles.district, { top: '28%', left: '6%' }]}>NORTH RIDGE</Text>
      <Text style={[styles.district, { top: '57%', right: '4%' }]}>RIVER PARK</Text>
      <Text style={[styles.district, { top: '82%', left: '8%' }]}>OLD QUARTER</Text>

      {territories.map((territory) => <TerritoryOverlay key={territory.owner} territory={territory} />)}
      {pins.map((pin) => (
        <View key={pin.icon} style={[styles.pinGlow, { left: pin.left, top: pin.top, shadowColor: pin.color }]}>
          <View style={[styles.pin, { borderColor: pin.color }]}><Ionicons name={pin.icon} size={18} color={pin.color} /></View>
        </View>
      ))}

      <View style={styles.playerHalo}><View style={styles.playerRing}><View style={styles.player}><Ionicons name="navigate" size={14} color="#07100E" /></View></View></View>
      <View style={styles.locationBadge}><Ionicons name="location" size={11} color={colors.cyan} /><Text style={styles.locationText}>VALINHOS · LIVE</Text></View>
      <View style={styles.controls}>
        <View style={styles.control}><Ionicons name="navigate" size={19} color={colors.text} /></View>
        <View style={styles.controlDivider} />
        <View style={styles.control}><Ionicons name="layers" size={19} color={colors.text} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#0A1714' },
  grid: { position: 'absolute', top: '15%', left: '-10%', width: '125%', height: '82%', backgroundColor: '#13231F80', transform: [{ rotate: '-5deg' }], borderWidth: 1, borderColor: '#263B35' },
  road: { position: 'absolute', height: 7, backgroundColor: '#293B37', borderRadius: 6, overflow: 'hidden' },
  roadCenter: { position: 'absolute', top: 3, left: 0, right: 0, height: 1, backgroundColor: '#51635F55' },
  water: { position: 'absolute', backgroundColor: '#0B2C34', borderColor: '#175064', borderWidth: 1, opacity: 0.8 },
  waterOne: { width: 58, height: 260, left: '51%', top: '54%', borderRadius: 40, transform: [{ rotate: '18deg' }] },
  waterTwo: { width: 45, height: 180, left: '57%', top: '74%', borderRadius: 30, transform: [{ rotate: '-16deg' }] },
  block: { position: 'absolute', borderRadius: 8, backgroundColor: '#1A2C27', borderWidth: 1, borderColor: '#294039' },
  blockOne: { width: 105, height: 50, left: '5%', top: '38%', transform: [{ rotate: '-12deg' }] },
  blockTwo: { width: 110, height: 62, right: '4%', top: '20%', transform: [{ rotate: '8deg' }] },
  blockThree: { width: 80, height: 42, right: '10%', top: '77%', transform: [{ rotate: '-9deg' }] },
  district: { position: 'absolute', color: '#71827D88', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  pinGlow: { position: 'absolute', width: 40, height: 40, marginLeft: -20, marginTop: -20, shadowOpacity: 0.8, shadowRadius: 13, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  pin: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#081310EE', borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '45deg' }] },
  playerHalo: { position: 'absolute', left: '49%', top: '57%', width: 82, height: 82, marginLeft: -41, marginTop: -41, borderRadius: 41, backgroundColor: '#37D8D11A', borderWidth: 1, borderColor: '#37D8D140', justifyContent: 'center', alignItems: 'center' },
  playerRing: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#37D8D125', alignItems: 'center', justifyContent: 'center' },
  player: { width: 27, height: 27, borderRadius: 14, backgroundColor: colors.cyan, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#E7FFFF' },
  locationBadge: { position: 'absolute', left: 16, top: 112, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: '#07100ED9', borderWidth: 1, borderColor: '#29413A', flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  controls: { position: 'absolute', right: 14, top: 182, borderRadius: 16, overflow: 'hidden', backgroundColor: '#07100EE8', borderWidth: 1, borderColor: '#30463F' },
  control: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  controlDivider: { height: 1, backgroundColor: '#30463F', marginHorizontal: 8 },
});
