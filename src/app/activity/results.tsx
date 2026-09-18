import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ActivityFlowShell } from '@/components/ActivityFlowShell';
import { DISTANCE_MILESTONES, type CompletedOutdoorActivity } from '@/features/activity/outdoorRules';
import { createMockResult, formatDuration, isActivityType } from '@/features/activity/activityRules';
import { activityRepository } from '@/services/storage/activityRepository';
import { colors } from '@/theme';

export default function ActivityResultsScreen() {
  const params = useLocalSearchParams<{ type?: string; ticks?: string; activityId?: string }>();
  const type = isActivityType(params.type) ? params.type : 'walking';
  const [result, setResult] = useState<CompletedOutdoorActivity>();
  useEffect(() => { if (params.activityId) void activityRepository.find(params.activityId).then(setResult); }, [params.activityId]);
  if (type === 'indoor') return <IndoorResult ticks={Number.parseInt(params.ticks ?? '1', 10)} />;
  if (!result) return <ActivityFlowShell eyebrow="ACTIVITY COMPLETE" title="Loading result"><Text style={styles.empty}>Securing route…</Text></ActivityFlowShell>;
  const start = result.route[0];
  return <ActivityFlowShell eyebrow="ACTIVITY COMPLETE" title={type[0]!.toUpperCase() + type.slice(1)} canGoBack={false}>
    <View style={styles.primary}><Text style={styles.label}>DISTANCE</Text><Text style={styles.value}>{(result.distanceMeters / 1000).toFixed(2)}<Text style={styles.unit}> km</Text></Text><Text style={styles.muted}>{formatDuration(result.durationSeconds)} duration</Text></View>
    <View style={styles.stats}><Stat label="XP" value={`+${result.xpEarned}`} /><Stat label="ENERGY" value={`+${result.energyEarned}`} /><Stat label="TERRITORIES" value={`${result.traversals.length}`} /><Stat label="INFLUENCE" value={`+${result.influenceEarned}`} /></View>
    <Text style={styles.heading}>ROUTE</Text><View style={styles.map}>{start ? <RouteMap route={result.route} /> : <Text style={styles.empty}>No accepted GPS points were recorded.</Text>}</View>
    <Text style={styles.heading}>TERRITORY IMPACT</Text><View style={styles.panel}>{result.traversals.length ? result.traversals.map((item) => <View key={item.territoryId} style={styles.row}><View style={styles.grow}><Text style={styles.rowTitle}>{item.territoryName}</Text><Text style={styles.muted}>{(item.distanceMeters / 1000).toFixed(2)} km</Text></View><Text style={styles.influence}>+{item.influenceEarned} influence</Text></View>) : <Text style={styles.empty}>Move between two accepted points to generate impact.</Text>}</View>
    <Text style={styles.heading}>DISTANCE REWARDS</Text><View style={styles.panel}>{DISTANCE_MILESTONES.map((item) => { const earned = result.distanceMeters >= item.distanceKm * 1000; return <View key={item.distanceKm} style={[styles.row, !earned && styles.locked]}><Text style={styles.growText}>{item.distanceKm} km — {item.rarity}</Text><Text style={earned ? styles.earned : styles.muted}>{earned ? 'EARNED' : 'LOCKED'}</Text></View>; })}</View>
    <Pressable onPress={() => router.replace('/map')} style={styles.done}><Text style={styles.doneText}>Back to home</Text></Pressable>
  </ActivityFlowShell>;
}
function RouteMap({ route }: { route: CompletedOutdoorActivity['route'] }) {
  const mapRef = useRef<MapView>(null);
  const start = route[0]!;
  const finish = route.at(-1)!;
  const fitRoute = useCallback(() => {
    if (route.length > 1) {
      mapRef.current?.fitToCoordinates(route, {
        animated: false,
        edgePadding: { top: 42, right: 42, bottom: 42, left: 42 },
      });
    }
  }, [route]);

  return <MapView
    initialRegion={{ latitude: start.latitude, longitude: start.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
    onMapReady={fitRoute}
    ref={mapRef}
    style={StyleSheet.absoluteFill}
    toolbarEnabled={false}
  >
    <Polyline coordinates={route} strokeColor={colors.cyan} strokeWidth={5} />
    <Marker coordinate={start} pinColor={colors.lime} title="Start" />
    <Marker coordinate={finish} pinColor={colors.cyan} title="Finish" />
  </MapView>;
}
function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function IndoorResult({ ticks }: { ticks: number }) { const result = createMockResult('indoor', Number.isFinite(ticks) ? ticks : 1); return <ActivityFlowShell eyebrow="ACTIVITY COMPLETE" title="Indoor" canGoBack={false}><View style={styles.primary}><Text style={styles.label}>TRAINING POWER</Text><Text style={styles.value}>{result.trainingPower} TP</Text><Text style={styles.muted}>{formatDuration(result.durationSeconds)}</Text></View><View style={styles.stats}><Stat label="XP" value={`+${result.xp}`} /><Stat label="ENERGY" value={`+${result.energy}`} /><Stat label="ARENA" value={`+${result.arenaPoints}`} /></View><Pressable onPress={() => router.replace('/map')} style={styles.done}><Text style={styles.doneText}>Back to home</Text></Pressable></ActivityFlowShell>; }
const styles = StyleSheet.create({ primary: { alignItems: 'center', marginVertical: 22 }, label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, value: { color: colors.text, fontSize: 44, fontWeight: '900' }, unit: { color: colors.muted, fontSize: 18 }, muted: { color: colors.muted, fontSize: 10 }, stats: { flexDirection: 'row', gap: 6 }, stat: { flex: 1, alignItems: 'center', paddingVertical: 13, backgroundColor: colors.surface, borderRadius: 14 }, statValue: { color: colors.text, fontWeight: '900', fontSize: 16 }, statLabel: { color: colors.muted, fontSize: 7, fontWeight: '800', marginTop: 4 }, heading: { color: colors.muted, fontWeight: '900', letterSpacing: 1.2, fontSize: 10, marginTop: 20, marginBottom: 8 }, map: { height: 230, overflow: 'hidden', borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center' }, panel: { paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface }, row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }, grow: { flex: 1 }, growText: { flex: 1, color: colors.text, fontWeight: '800' }, rowTitle: { color: colors.text, fontWeight: '800' }, influence: { color: colors.cyan, fontWeight: '900', fontSize: 12 }, locked: { opacity: 0.45 }, earned: { color: colors.lime, fontSize: 9, fontWeight: '900' }, empty: { color: colors.muted, textAlign: 'center', padding: 20 }, done: { height: 58, marginTop: 22, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lime }, doneText: { color: colors.background, fontWeight: '900', fontSize: 16 } });
