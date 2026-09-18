import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityFlowShell } from '@/components/ActivityFlowShell';
import { DISTANCE_MILESTONES, calculateTraversals, rewardsForDistance, type CompletedOutdoorActivity } from '@/features/activity/outdoorRules';
import { formatDuration, getSimulatedDistance, isActivityType } from '@/features/activity/activityRules';
import { LOCATION_OPTIONS, assessPoint, fromLocation, gpsQuality, routeDistanceMeters, type ActivityPoint, type OutdoorActivityType } from '@/features/activity/tracking';
import { activities } from '@/mocks/game';
import { activityRepository } from '@/services/storage/activityRepository';
import { colors } from '@/theme';

export default function ActiveActivityScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type = isActivityType(params.type) ? params.type : 'walking';
  if (type === 'indoor') return <IndoorSession />;
  return <OutdoorSession type={type} />;
}

function OutdoorSession({ type }: { type: OutdoorActivityType }) {
  const activity = activities.find((item) => item.id === type) ?? activities[0]!;
  const [phase, setPhase] = useState<'ready' | 'denied' | 'tracking'>('ready');
  const [points, setPoints] = useState<ActivityPoint[]>([]);
  const rawPoints = useRef<ActivityPoint[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const subscription = useRef<Location.LocationSubscription | null>(null);
  useEffect(() => () => subscription.current?.remove(), []);
  useEffect(() => { if (phase !== 'tracking') return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [phase]);
  const distanceMeters = useMemo(() => routeDistanceMeters(points), [points]);
  const accuracy = points.at(-1)?.accuracy;
  const next = DISTANCE_MILESTONES.find((item) => distanceMeters < item.distanceKm * 1000);

  const start = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) { setPhase('denied'); return; }
    const startTime = Date.now(); setStartedAt(startTime); setNow(startTime); setPhase('tracking');
    subscription.current = await Location.watchPositionAsync(LOCATION_OPTIONS, (location) => {
      const point = fromLocation(location); rawPoints.current.push(point);
      setPoints((accepted) => assessPoint(point, accepted.at(-1), type).accepted ? [...accepted, point] : accepted);
    });
  };
  const finish = async () => {
    subscription.current?.remove();
    const endedAt = Date.now(); const traversals = calculateTraversals(points);
    const completed: CompletedOutdoorActivity = {
      id: `${startedAt}-${type}`, type, startedAt, endedAt, durationSeconds: Math.max(0, Math.floor((endedAt - startedAt) / 1000)),
      distanceMeters, route: points, traversals, influenceEarned: traversals.reduce((sum, item) => sum + item.influenceEarned, 0),
      unlockedRewards: rewardsForDistance(distanceMeters).map((item) => item.rarity), energyEarned: Math.floor(distanceMeters / 1000 * 24), xpEarned: Math.floor(distanceMeters / 1000 * 60),
    };
    await activityRepository.save(completed); activityRepository.applyInfluence(completed);
    router.replace({ pathname: '/activity/results', params: { type, activityId: completed.id } });
  };

  if (phase !== 'tracking') return <ActivityFlowShell eyebrow="OUTDOOR ACTIVITY" title={activity.label}><View style={styles.ready}><Ionicons name="navigate-circle" size={64} color={activity.color} /><Text style={styles.readyTitle}>{phase === 'denied' ? 'Location access required' : 'Ready to start?'}</Text><Text style={styles.readyCopy}>{phase === 'denied' ? 'Outdoor tracking requires foreground location access. Enable it in device settings, or go back.' : 'GPS will record your real route while this screen remains active.'}</Text>{phase === 'ready' && <><Text style={styles.gps}>GPS ready · High accuracy</Text><Pressable onPress={() => void start()} style={styles.start}><Text style={styles.startText}>START ACTIVITY</Text></Pressable></>}</View></ActivityFlowShell>;
  const elapsed = Math.floor((now - startedAt) / 1000);
  return <ActivityFlowShell eyebrow="GPS SESSION · LIVE" title={activity.label} canGoBack={false}><View style={styles.status}><View style={[styles.pulse, { backgroundColor: activity.color }]} /><Text style={styles.statusText}>FOREGROUND GPS · {gpsQuality(accuracy).toUpperCase()}</Text></View><View style={styles.metric}><Text style={styles.metricLabel}>DURATION</Text><Text style={styles.metricValue}>{formatDuration(elapsed)}</Text><Text style={styles.distance}>{(distanceMeters / 1000).toFixed(2)} km</Text></View><View style={styles.secondary}><Metric value={`${Math.floor(distanceMeters / 1000 * 24)}`} label="ENERGY EARNED" /><View style={styles.divider} /><Metric value={next ? `${next.distanceKm} km` : 'Complete'} label={next ? `${next.rarity.toUpperCase()} NEXT` : 'ALL REWARDS'} /></View><View style={styles.safety}><Ionicons name="phone-portrait-outline" size={22} color={colors.cyan} /><Text style={styles.safetyText}>Keep moving safely. No interaction is needed until you finish.</Text></View><View style={styles.spacer} /><Pressable onPress={() => void finish()} style={styles.finish}><Ionicons name="stop" size={18} color={colors.text} /><Text style={styles.finishText}>Finish activity</Text></Pressable></ActivityFlowShell>;
}

function Metric({ value, label }: { value: string; label: string }) { return <View style={styles.secondaryItem}><Text style={styles.secondaryValue}>{value}</Text><Text style={styles.secondaryLabel}>{label}</Text></View>; }
function IndoorSession() { const [ticks, setTicks] = useState(0); useEffect(() => { const timer = setInterval(() => setTicks((v) => v + 1), 1000); return () => clearInterval(timer); }, []); return <ActivityFlowShell eyebrow="MOCK INDOOR SESSION · LIVE" title="Indoor"><View style={styles.metric}><Text style={styles.metricLabel}>DURATION</Text><Text style={styles.metricValue}>{formatDuration(ticks * 60)}</Text><Text style={styles.distance}>{Math.round(getSimulatedDistance('indoor', ticks))} TP</Text></View><View style={styles.spacer} /><Pressable onPress={() => router.replace({ pathname: '/activity/results', params: { type: 'indoor', ticks: Math.max(ticks, 1).toString() } })} style={styles.finish}><Text style={styles.finishText}>Finish activity</Text></Pressable></ActivityFlowShell>; }

const styles = StyleSheet.create({ ready: { alignItems: 'center', marginTop: 45, padding: 22, borderRadius: 22, backgroundColor: colors.surface }, readyTitle: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 12 }, readyCopy: { color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8 }, gps: { color: colors.cyan, fontWeight: '800', marginTop: 22 }, start: { alignSelf: 'stretch', alignItems: 'center', marginTop: 18, padding: 18, borderRadius: 17, backgroundColor: colors.lime }, startText: { color: colors.background, fontWeight: '900' }, status: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: colors.surface, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 8 }, pulse: { width: 8, height: 8, borderRadius: 4, marginRight: 8 }, statusText: { color: colors.muted, fontSize: 10, fontWeight: '800' }, metric: { alignItems: 'center', paddingVertical: 38 }, metricLabel: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 2 }, metricValue: { color: colors.text, fontSize: 60, fontWeight: '300', fontVariant: ['tabular-nums'] }, distance: { color: colors.cyan, fontSize: 28, fontWeight: '900', marginTop: 5 }, secondary: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 22, backgroundColor: colors.surface, paddingVertical: 20 }, secondaryItem: { flex: 1, alignItems: 'center', gap: 5 }, secondaryValue: { color: colors.text, fontWeight: '900', fontSize: 22 }, secondaryLabel: { color: colors.muted, fontWeight: '800', fontSize: 9 }, divider: { width: 1, backgroundColor: colors.border }, safety: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#0B2422' }, safetyText: { color: colors.muted, flex: 1, fontSize: 11, lineHeight: 17 }, spacer: { flex: 1, minHeight: 28 }, finish: { height: 58, borderRadius: 18, backgroundColor: colors.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, finishText: { color: colors.text, fontSize: 16, fontWeight: '900' } });
