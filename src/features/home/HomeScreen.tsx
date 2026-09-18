import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArenaCard } from '@/components/ArenaCard';
import { PlayerHeader } from '@/components/PlayerHeader';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { ConquestMap } from '@/features/map/ConquestMap';
import { MapErrorBoundary } from '@/features/map/MapErrorBoundary';
import { colors } from '@/theme';

export function HomeScreen() {
  const [hasSelectedTerritory, setHasSelectedTerritory] = useState(false);
  const controlsEntrance = useRef(new Animated.Value(1)).current;

  const handleTerritorySelectionChange = (isSelected: boolean) => {
    setHasSelectedTerritory(isSelected);

    if (!isSelected) {
      controlsEntrance.setValue(0);
      Animated.timing(controlsEntrance, { duration: 180, toValue: 1, useNativeDriver: true }).start();
    }
  };

  return (
    <View style={styles.screen}>
      <MapErrorBoundary>
        <ConquestMap onTerritorySelectionChange={handleTerritorySelectionChange} />
      </MapErrorBoundary>
      <LinearGradient
        colors={['#07100ECC', '#07100E40', 'transparent']}
        pointerEvents="none"
        style={styles.topShade}
      />

      <View pointerEvents="box-none" style={styles.hudLayer}>
        <PlayerHeader />
        <View style={styles.arena}><ArenaCard /></View>
      </View>

      {!hasSelectedTerritory && <Animated.View
        pointerEvents="box-none"
        style={[
          styles.actionLayer,
          {
            opacity: controlsEntrance,
            transform: [{ translateY: controlsEntrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Start activity"
          accessibilityRole="button"
          onPress={() => router.push('/activity/select')}
          style={({ pressed }) => [styles.start, pressed && styles.pressed]}
        >
          <LinearGradient colors={['#D8FF73', colors.lime]} style={styles.startIcon}>
            <Ionicons name="play" size={21} color={colors.background} style={styles.playIcon} />
          </LinearGradient>
          <View style={styles.startCopy}>
            <Text style={styles.startTitle}>Start activity</Text>
            <Text style={styles.startDetail}>Walk  •  Run  •  Cycle  •  Indoor</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.lime} />
        </Pressable>
        <WeeklyProgress />
      </Animated.View>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden', backgroundColor: colors.background },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 190 },
  hudLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  arena: { marginTop: 8 },
  actionLayer: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 8 },
  start: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 11,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#668737',
    backgroundColor: '#0C1714ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  startIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  playIcon: { marginLeft: 2 },
  startCopy: { flex: 1 },
  startTitle: { color: colors.text, fontSize: 17, lineHeight: 21, fontWeight: '900' },
  startDetail: { color: colors.muted, fontSize: 9, marginTop: 2 },
});
