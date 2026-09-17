import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nearbyArena } from '@/mocks/game';
import { colors } from '@/theme';

export function ArenaCard() {
  return <LinearGradient colors={['#293821', '#17231F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}><View style={styles.icon}><Ionicons name="barbell" size={22} color={colors.lime} /></View><View style={styles.content}><Text style={styles.eyebrow}>NEARBY ARENA · {nearbyArena.distance.toUpperCase()}</Text><Text style={styles.title}>{nearbyArena.name}</Text><Text style={styles.subtitle}>Level {nearbyArena.level} arena · {nearbyArena.competitors} competitors</Text></View><Pressable accessibilityLabel="View nearby arena" style={({ pressed }) => [styles.go, pressed && styles.pressed]}><Ionicons name="arrow-forward" size={18} color={colors.background} /></Pressable></LinearGradient>;
}
const styles = StyleSheet.create({ card: { marginTop: -28, marginHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#53643A', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#C8FF4A18', alignItems: 'center', justifyContent: 'center' }, content: { flex: 1, minWidth: 0 }, eyebrow: { color: colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, title: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 2 }, subtitle: { color: colors.muted, fontSize: 10, marginTop: 2 }, go: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.7 } });
