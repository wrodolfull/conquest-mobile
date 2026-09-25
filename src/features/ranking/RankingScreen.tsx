import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PlayerHeader } from '@/components/PlayerHeader';
import { useAuth } from '@/features/auth/AuthContext';
import { isCurrentRankingRequest, mergeRankingEntries } from './rankingState';
import type { MyWeeklyRankingEntry, RankingScope, WeeklyRankingCursor, WeeklyRankingEntry } from './types';
import { leaderboardRepository, RANKING_PAGE_SIZE } from '@/services/backend/leaderboardRepository';
import { colors, radius, spacing, typography } from '@/theme';

const scopes: RankingScope[] = ['friends', 'city', 'global'];
const emptyCopy: Record<RankingScope, string> = { friends: 'NO FRIENDS RANKED THIS WEEK', city: 'NO CITY ACTIVITY YET', global: 'NO RANKED ACTIVITY YET' };
const distance = (meters: number) => `${(meters / 1000).toFixed(2)} KM`;

export function RankingScreen() {
  const { user } = useAuth();
  const [scope, setScope] = useState<RankingScope>('friends');
  const [entries, setEntries] = useState<WeeklyRankingEntry[]>([]);
  const [mine, setMine] = useState<MyWeeklyRankingEntry | null>(null);
  const [cursor, setCursor] = useState<WeeklyRankingCursor | null>(null);
  const [cityAvailable, setCityAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const generation = useRef(0);
  const loadMoreLock = useRef(false);

  const loadFirstPage = useCallback(async (nextScope: RankingScope, refresh = false) => {
    const request = ++generation.current;
    setError(null); setPageError(null);
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const page = await leaderboardRepository.getWeekly(nextScope);
      if (!isCurrentRankingRequest(request, generation.current)) return;
      setEntries(page.entries); setMine(page.myEntry); setCursor(page.nextCursor); setCityAvailable(page.cityAvailable);
    } catch {
      if (isCurrentRankingRequest(request, generation.current)) setError('Could not load this leaderboard. Pull down to retry.');
    } finally {
      if (isCurrentRankingRequest(request, generation.current)) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => { setEntries([]); setMine(null); setCursor(null); void loadFirstPage(scope); }, [scope, loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (cursor === null || loadMoreLock.current) return;
    loadMoreLock.current = true; setLoadingMore(true); setPageError(null);
    const request = generation.current; const requestedScope = scope;
    try {
      const page = await leaderboardRepository.getWeekly(requestedScope, cursor);
      if (!isCurrentRankingRequest(request, generation.current) || requestedScope !== scope) return;
      setEntries((current) => mergeRankingEntries(current, page.entries)); setCursor(page.nextCursor); setMine(page.myEntry);
    } catch {
      if (isCurrentRankingRequest(request, generation.current)) setPageError('Could not load more players. Try again.');
    } finally {
      loadMoreLock.current = false;
      if (isCurrentRankingRequest(request, generation.current)) setLoadingMore(false);
    }
  }, [cursor, scope]);

  const openPlayer = (entry: WeeklyRankingEntry) => router.push(entry.userId === user?.id ? '/profile' : `/player/${entry.userId}`);
  const missingCity = scope === 'city' && !cityAvailable;
  return <View style={styles.screen}>
    <PlayerHeader />
    <FlatList
      data={entries}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={7}
      keyExtractor={(entry) => entry.userId}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadFirstPage(scope, true)} tintColor={colors.lime} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<View>
        <Text style={styles.eyebrow}>THIS WEEK</Text><Text style={styles.title}>RANKING</Text>
        <View accessibilityRole="tablist" style={styles.tabs}>{scopes.map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: scope === item }} onPress={() => setScope(item)} style={[styles.tab, scope === item && styles.activeTab]}><Text style={[styles.tabText, scope === item && styles.activeTabText]}>{item.toUpperCase()}</Text></Pressable>)}</View>
        <Text style={styles.info}>Ranked by outdoor distance this week. Influence and discoveries break ties.</Text>
        {mine ? <MyPosition entry={mine} publicScope={scope !== 'friends'} /> : null}
        {missingCity ? <EmptyState title="CITY NOT SET" copy="Add your city and region to compare with nearby Ruqest players." action="EDIT PROFILE" onPress={() => router.push('/profile/edit')} /> : null}
        {error ? <EmptyState title="RANKING UNAVAILABLE" copy={error} action="TRY AGAIN" onPress={() => void loadFirstPage(scope)} /> : null}
        {loading ? <ActivityIndicator color={colors.lime} style={styles.loader} /> : null}
        {!loading && !error && !missingCity && entries.length === 0 ? <EmptyState title={emptyCopy[scope]} copy={scope === 'friends' ? 'Connect with players in Social, then get moving.' : 'Outdoor movement will appear here when eligible players record it.'} action={scope === 'friends' ? 'FIND PLAYERS' : undefined} onPress={scope === 'friends' ? () => router.push('/friends') : undefined} /> : null}
        {!loading && entries.length > 0 ? <Text style={styles.section}>LEADERBOARD</Text> : null}
      </View>}
      renderItem={({ item }) => <RankingRow entry={item} onPress={() => openPlayer(item)} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListFooterComponent={cursor !== null ? <View style={styles.moreWrap}>{pageError ? <Text style={styles.pageError}>{pageError}</Text> : null}<Pressable accessibilityRole="button" disabled={loadingMore} onPress={() => void loadMore()} style={[styles.more, loadingMore && styles.disabled]}><Text style={styles.moreText}>{loadingMore ? 'LOADING…' : `SHOW ${RANKING_PAGE_SIZE} MORE`}</Text></Pressable></View> : null}
    />
  </View>;
}

function MyPosition({ entry, publicScope }: { entry: MyWeeklyRankingEntry; publicScope: boolean }) {
  const unlisted = publicScope && !entry.listed;
  return <View style={styles.mine}><View style={styles.mineHeading}><Text style={styles.cardLabel}>{unlisted ? 'YOUR WEEK' : 'YOUR POSITION'}</Text>{entry.rank !== null ? <Text style={styles.mineRank}>#{entry.rank}</Text> : null}</View><Text style={styles.mineDistance}>{distance(entry.distanceMeters)}</Text><View style={styles.metrics}><Text style={styles.metric}>{entry.weeklyInfluence} INFLUENCE</Text><Text style={styles.metric}>{entry.newZones} NEW ZONES</Text></View>{unlisted ? <><Text style={styles.unlisted}>YOU ARE NOT LISTED PUBLICLY</Text><Text style={styles.privacyCopy}>Public profile, public activity and visible stats are required.</Text><Pressable onPress={() => router.push('/profile/privacy')}><Text style={styles.link}>PRIVACY SETTINGS</Text></Pressable></> : null}</View>;
}

function RankingRow({ entry, onPress }: { entry: WeeklyRankingEntry; onPress: () => void }) {
  const initial = (entry.displayName || entry.username).slice(0, 1).toUpperCase();
  const rankColor = entry.rank === 1 ? colors.gold : entry.rank === 2 ? colors.text : entry.rank === 3 ? '#C98B67' : colors.muted;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Rank ${entry.rank}, ${entry.displayName}, ${distance(entry.distanceMeters)}`} onPress={onPress} style={[styles.row, entry.isMe && styles.myRow]}><Text style={[styles.rank, { color: rankColor }]}>#{entry.rank}</Text><View style={styles.avatar}>{entry.avatarUrl ? <Image source={{ uri: entry.avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initial}</Text>}</View><View style={styles.identity}><Text numberOfLines={1} style={styles.name}>{entry.displayName}</Text><Text numberOfLines={1} style={styles.username}>@{entry.username}</Text><Text style={styles.secondary}>{entry.weeklyInfluence} INFLUENCE · {entry.newZones} NEW ZONES</Text></View><Text style={styles.rowDistance}>{distance(entry.distanceMeters)}</Text></Pressable>;
}

function EmptyState({ title, copy, action, onPress }: { title: string; copy: string; action?: string; onPress?: () => void }) {
  return <View style={styles.empty}><Ionicons name="trophy-outline" color={colors.cyan} size={24} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyCopy}>{copy}</Text>{action && onPress ? <Pressable onPress={onPress} style={styles.emptyButton}><Text style={styles.emptyButtonText}>{action}</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: 110 }, eyebrow: { ...typography.label, color: colors.cyan, marginTop: spacing.md }, title: { ...typography.display, color: colors.text, marginTop: 2 },
  tabs: { flexDirection: 'row', padding: 3, backgroundColor: colors.surface, borderRadius: radius.medium, marginTop: spacing.md, borderWidth: 1, borderColor: colors.border }, tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.small }, activeTab: { backgroundColor: colors.lime }, tabText: { ...typography.label, color: colors.muted }, activeTabText: { color: colors.background },
  info: { ...typography.caption, color: colors.muted, marginVertical: spacing.md }, mine: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.primaryMuted, borderRadius: radius.medium, padding: spacing.md, marginBottom: spacing.lg }, mineHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardLabel: { ...typography.label, color: colors.lime }, mineRank: { ...typography.stat, color: colors.lime }, mineDistance: { fontSize: 26, fontWeight: '900', color: colors.text }, metrics: { flexDirection: 'row', gap: spacing.md }, metric: { ...typography.label, color: colors.cyan }, unlisted: { ...typography.label, color: colors.gold, marginTop: spacing.md }, privacyCopy: { ...typography.caption, color: colors.muted, marginTop: spacing.xs }, link: { ...typography.label, color: colors.lime, marginTop: spacing.sm },
  section: { ...typography.label, color: colors.muted, marginBottom: spacing.sm }, row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.medium }, myRow: { borderWidth: 1, borderColor: colors.lime, backgroundColor: colors.surfaceRaised }, rank: { width: 40, fontSize: 16, fontWeight: '900' }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, avatarImage: { width: '100%', height: '100%' }, avatarText: { color: colors.lime, fontWeight: '900' }, identity: { flex: 1, marginLeft: spacing.sm, minWidth: 0 }, name: { ...typography.body, color: colors.text, fontWeight: '800' }, username: { ...typography.caption, color: colors.muted }, secondary: { fontSize: 9, fontWeight: '800', color: colors.cyan, marginTop: 3 }, rowDistance: { ...typography.label, color: colors.text, marginLeft: spacing.xs }, separator: { height: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.xl, borderRadius: radius.medium, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg }, emptyTitle: { ...typography.heading, color: colors.text, marginTop: spacing.sm, textAlign: 'center' }, emptyCopy: { ...typography.body, color: colors.muted, textAlign: 'center', marginTop: spacing.xs }, emptyButton: { backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: 10, marginTop: spacing.md }, emptyButtonText: { ...typography.label, color: colors.background }, loader: { marginVertical: spacing.xl }, moreWrap: { marginTop: spacing.lg }, pageError: { ...typography.caption, color: colors.danger, textAlign: 'center', marginBottom: spacing.sm }, more: { borderWidth: 1, borderColor: colors.lime, borderRadius: radius.pill, alignItems: 'center', padding: spacing.md }, moreText: { ...typography.label, color: colors.lime }, disabled: { opacity: 0.55 },
});
