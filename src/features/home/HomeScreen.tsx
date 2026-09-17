import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArenaCard } from '@/components/ArenaCard';
import { PlayerHeader } from '@/components/PlayerHeader';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { ConquestMap } from '@/features/map/ConquestMap';
import { MapErrorBoundary } from '@/features/map/MapErrorBoundary';
import { colors } from '@/theme';

export function HomeScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mapStage}>
          <MapErrorBoundary><ConquestMap /></MapErrorBoundary>
          <LinearGradient
            colors={['#07100EF2', '#07100E99', 'transparent']}
            pointerEvents="none"
            style={styles.mapShade}
          />
          <View style={styles.header}><PlayerHeader /></View>
          <View style={styles.arena}><ArenaCard /></View>
        </View>

        <View style={styles.dashboard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/activity/select')}
            style={({ pressed }) => [styles.start, pressed && styles.pressed]}
          >
            <LinearGradient colors={['#D8FF73', colors.lime]} style={styles.startIcon}>
              <Ionicons name="play" size={26} color={colors.background} style={styles.playIcon} />
            </LinearGradient>
            <View style={styles.startCopy}>
              <Text style={styles.startEyebrow}>READY TO CONQUER?</Text>
              <Text style={styles.startTitle}>Start activity</Text>
              <Text style={styles.startDetail}>Walk, run, cycle or train indoors</Text>
            </View>
            <View style={styles.startArrow}><Ionicons name="chevron-forward" size={20} color={colors.lime} /></View>
          </Pressable>

          <WeeklyProgress />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 16 },
  mapStage: { height: 570, position: 'relative' },
  mapShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 138 },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  arena: { position: 'absolute', left: 0, right: 0, bottom: 14 },
  dashboard: { marginTop: -1, paddingHorizontal: 16, gap: 12 },
  start: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#668737',
    backgroundColor: '#142219',
    shadowColor: colors.lime,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 5,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  startIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  playIcon: { marginLeft: 3 },
  startCopy: { flex: 1, marginLeft: 14 },
  startEyebrow: { color: colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  startTitle: { color: colors.text, fontSize: 21, lineHeight: 25, fontWeight: '900', marginTop: 2 },
  startDetail: { color: colors.muted, fontSize: 11, marginTop: 2 },
  startArrow: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C8FF4A12' },
});
