import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArenaCard } from '@/components/ArenaCard';
import { PlayerHeader } from '@/components/PlayerHeader';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { ConquestMap } from '@/features/map/ConquestMap';
import { MapErrorBoundary } from '@/features/map/MapErrorBoundary';
import type { MapTerritory } from '@/features/territories/types';
import { colors } from '@/theme';
import { usePois } from '@/features/poi/PoiContext';
import { activeActivityRepository, type ActiveActivitySession } from '@/services/storage/activeActivityRepository';

export function HomeScreen() {
  const [selectedTerritory, setSelectedTerritory] = useState<MapTerritory | null>(null);
  const controlsEntrance = useRef(new Animated.Value(1)).current;
  const { notice, dismissNotice, simulate } = usePois();
  const showPoiDebug = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_POI_DEBUG === 'true';
  const [interrupted, setInterrupted] = useState<ActiveActivitySession>();
  useEffect(() => { const timer = setTimeout(() => { void activeActivityRepository.get().then((value) => setInterrupted(value?.status === 'interrupted' ? value : undefined)); }, 400); return () => clearTimeout(timer); }, []);

  const handleTerritorySelectionChange = (territory: MapTerritory | null) => {
    setSelectedTerritory(territory);

    if (territory === null) {
      controlsEntrance.setValue(0);
      Animated.timing(controlsEntrance, { duration: 180, toValue: 1, useNativeDriver: true }).start();
    }
  };

  return (
    <View style={styles.screen}>
      <MapErrorBoundary>
        <ConquestMap
          onTerritorySelectionChange={handleTerritorySelectionChange}
          selectedTerritory={selectedTerritory}
        />
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
      {notice ? <Pressable onPress={dismissNotice} style={styles.poiNotice}><Ionicons name="location" size={18} color={colors.lime} /><Text style={styles.poiNoticeText}>{notice}</Text><Ionicons name="close" size={16} color={colors.muted} /></Pressable> : null}
      {showPoiDebug ? <View style={styles.dev}><Text style={styles.devTitle}>DEV POI</Text>{(['arena', 'training_ground'] as const).map((type) => <View key={type} style={styles.devRow}><Text style={styles.devLabel}>{type === 'arena' ? 'Arena' : 'Park'}</Text><Pressable onPress={() => simulate(type, 'inside')}><Text style={styles.devAction}>ENTER</Text></Pressable><Pressable onPress={() => simulate(type, 'outside')}><Text style={styles.devAction}>LEAVE</Text></Pressable></View>)}</View> : null}
      {interrupted ? <Pressable onPress={() => router.push({ pathname: '/activity/active', params: { type: interrupted.type } })} style={styles.recovery}><Ionicons name="warning" size={18} color={colors.gold} /><View style={styles.startCopy}><Text style={styles.recoveryTitle}>Previous activity was interrupted</Text><Text style={styles.recoveryCopy}>Recover, finish with recorded data, or discard.</Text></View><Ionicons name="chevron-forward" size={17} color={colors.gold} /></Pressable> : null}

      {selectedTerritory === null ? (
        <Animated.View
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
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden', backgroundColor: colors.background },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 190 },
  hudLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  arena: { marginTop: 8 },
  actionLayer: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 8 },
  poiNotice: { position: 'absolute', top: 154, left: 12, right: 68, minHeight: 48, padding: 10, borderRadius: 14, backgroundColor: '#10221FF5', borderWidth: 1, borderColor: '#73993D', flexDirection: 'row', alignItems: 'center', gap: 9 },
  poiNoticeText: { flex: 1, color: colors.text, fontSize: 10, fontWeight: '800', lineHeight: 14 },
  dev: { position: 'absolute', right: 12, top: 210, width: 126, padding: 8, borderRadius: 12, backgroundColor: '#07100EEB', borderWidth: 1, borderColor: '#385149' }, devTitle: { color: colors.gold, fontSize: 7, fontWeight: '900' }, devRow: { flexDirection: 'row', gap: 6, marginTop: 5, alignItems: 'center' }, devLabel: { color: colors.muted, fontSize: 7, width: 30 }, devAction: { color: colors.cyan, fontSize: 7, fontWeight: '900' },
  recovery: { position: 'absolute', top: 210, left: 12, right: 12, minHeight: 58, padding: 12, borderRadius: 16, backgroundColor: '#211E12F5', borderWidth: 1, borderColor: '#8A7635', flexDirection: 'row', alignItems: 'center', gap: 10 }, recoveryTitle: { color: colors.text, fontSize: 12, fontWeight: '900' }, recoveryCopy: { color: colors.muted, fontSize: 9, marginTop: 2 },
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
