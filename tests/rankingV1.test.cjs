const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const migration = fs.readFileSync('supabase/migrations/202609250001_rankings_v1.sql', 'utf8');
const screen = fs.readFileSync('src/features/ranking/RankingScreen.tsx', 'utf8');
const repository = fs.readFileSync('src/services/backend/leaderboardRepository.ts', 'utf8');
const state = fs.readFileSync('src/features/ranking/rankingState.ts', 'utf8');

test('weekly projection uses event weeks and only outdoor distance', () => {
  assert.match(migration, /activity_type in\('walking','running','cycling'\)/);
  assert.match(migration, /date_trunc\('week',new\.started_at\)/);
  assert.match(migration, /date_trunc\('week',new\.created_at\)/);
  assert.match(migration, /date_trunc\('week',new\.discovered_at\)/);
  assert.doesNotMatch(migration, /activity_type in\([^)]*indoor/);
});

test('projection is backfilled, trigger-maintained, indexed, and client-inaccessible', () => {
  assert.match(migration, /insert into public\.weekly_ranking_stats[\s\S]*from public\.activities/);
  assert.match(migration, /union all[\s\S]*from public\.influence_ledger[\s\S]*union all[\s\S]*from public\.zone_discoveries/);
  assert.match(migration, /after insert on public\.activities/);
  assert.match(migration, /after insert on public\.influence_ledger/);
  assert.match(migration, /after insert on public\.zone_discoveries/);
  assert.match(migration, /weekly_ranking_stats_order_idx[\s\S]*outdoor_distance_meters desc,weekly_influence desc,new_zones desc,user_id/);
  assert.match(migration, /revoke all on public\.weekly_ranking_stats from public,anon,authenticated/);
});

test('RPC enforces exact deterministic ranking and bounded server pagination', () => {
  assert.match(migration, /row_number\(\) over\(order by outdoor_distance_meters desc,weekly_influence desc,new_zones desc,user_id asc\)/);
  assert.match(migration, /least\(greatest\(coalesce\(p_limit,20\),1\),50\)/);
  assert.match(migration, /rank>coalesce\(p_after_rank,0\)/);
  assert.match(migration, /limit page_size\+1/);
  assert.match(migration, /'nextCursor'/);
  assert.match(migration, /'myEntry'/);
  assert.match(migration, /'weekStart'.*'weekEnd'/s);
});

test('global, city, friends, block, and self privacy semantics are explicit', () => {
  assert.match(migration, /v\.profile_visibility='public' and v\.activity_visibility='public' and v\.show_stats/);
  assert.match(migration, /lower\(btrim\(p\.city\)\)=my_city and lower\(btrim\(p\.region\)\)=my_region/);
  assert.match(migration, /f\.status='accepted'/);
  assert.match(migration, /not public\.social_pair_blocked\(me,s\.user_id\)/);
  assert.match(migration, /coalesce\(s\.outdoor_distance_meters,0\)/);
  assert.match(migration, /\(r\.user_id is not null\) listed/);
});

test('ranking response and client never request or expose sensitive route data', () => {
  const rpc = migration.slice(migration.indexOf('create function public.get_weekly_leaderboard'));
  for (const field of ['route', 'latitude', 'longitude', 'startedAt', 'activityId']) assert.doesNotMatch(rpc, new RegExp(`['"]${field}['"]`, 'i'));
  assert.doesNotMatch(repository, /\.from\(['"]activities/);
});

test('client uses explicit load more with stale-request and duplicate protection', () => {
  assert.match(repository, /RANKING_PAGE_SIZE = 20/);
  assert.match(screen, /SHOW \$\{RANKING_PAGE_SIZE\} MORE/);
  assert.doesNotMatch(screen, /onEndReached/);
  assert.match(screen, /loadMoreLock\.current/);
  assert.match(screen, /isCurrentRankingRequest/);
  assert.match(state, /new Set\(current\.map\(\(entry\) => entry\.userId\)\)/);
  assert.match(state, /requestGeneration === currentGeneration/);
});

test('ranking UI includes privacy, city, empty, refresh, and profile navigation states', () => {
  assert.match(screen, /YOU ARE NOT LISTED PUBLICLY/);
  assert.match(screen, /PRIVACY SETTINGS/);
  assert.match(screen, /CITY NOT SET/);
  assert.match(screen, /NO FRIENDS RANKED THIS WEEK/);
  assert.match(screen, /RefreshControl/);
  assert.match(screen, /`\/player\/\$\{entry\.userId\}`/);
  assert.match(screen, /entry\.userId === user\?\.id \? '\/profile'/);
});
