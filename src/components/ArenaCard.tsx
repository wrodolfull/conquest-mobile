import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nearbyArena } from '@/mocks/game';
import { colors } from '@/theme';

export function ArenaCard() {
  return <LinearGradient colors={['#14231FEE', '#0A1513F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}><View style={styles.icon}><Ionicons name="barbell" size={21} color={colors.violet} /></View><View style={styles.content}><Text style={styles.eyebrow}>NEARBY ARENA · {nearbyArena.distance.toUpperCase()}</Text><Text style={styles.title}>{nearbyArena.name}</Text><Text style={styles.subtitle}>Level {nearbyArena.level} · {nearbyArena.competitors} competitors nearby</Text></View><Pressable accessibilityLabel="View nearby arena" style={({ pressed }) => [styles.go, pressed && styles.pressed]}><Ionicons name="chevron-forward" size={18} color={colors.text} /></Pressable></LinearGradient>;
}
const styles = StyleSheet.create({ card: { marginHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#3C514B', paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 9, shadowColor: '#000', shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7 }, icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#A977FF1B', borderWidth: 1, borderColor: '#A977FF4D', alignItems: 'center', justifyContent: 'center' }, content: { flex: 1, minWidth: 0 }, eyebrow: { color: colors.violet, fontSize: 7, fontWeight: '900', letterSpacing: 1 }, title: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 1 }, subtitle: { color: colors.muted, fontSize: 8, marginTop: 1 }, go: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFFFFF0D', borderWidth: 1, borderColor: '#FFFFFF14', alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.7 } });
