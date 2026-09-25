const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { parseCachedJson } = require('../.test-dist/services/storage/cacheJson.js');

const source = (path) => fs.readFileSync(path, 'utf8');

test('corrupt and incompatible cached JSON is ignored', () => {
  assert.equal(parseCachedJson('{broken', Array.isArray), undefined);
  assert.equal(parseCachedJson('{"old":true}', Array.isArray), undefined);
  assert.deepEqual(parseCachedJson('[1,2]', Array.isArray), [1, 2]);
});

test('boot distinguishes loading, ready, missing profile, and request error', () => {
  const auth = source('src/features/auth/AuthContext.tsx');
  assert.match(auth, /'loading' \| 'ready' \| 'missing-profile' \| 'error'/);
  assert.match(auth, /setPlayerState\(nextProfile \? 'ready' : 'missing-profile'\)/);
  assert.match(auth, /setPlayerState\('error'\)/);
  const layout = source('src/app/_layout.tsx');
  assert.match(layout, /playerState === 'error'/);
  assert.match(layout, /refreshPlayer/);
  assert.doesNotMatch(layout, /playerState === 'error'.*signOut/s);
});

test('activity discard is transactional and startup interruption is conservative', () => {
  assert.match(source('src/services/storage/activeActivityRepository.ts'), /withTransactionAsync/);
  const layout = source('src/app/_layout.tsx');
  assert.match(layout, /INTERruption_GRACE_MS/i);
  assert.match(layout, /if \(!registered\) await activeActivityRepository\.markInterrupted/);
});

test('territory double failure has an empty cache fallback', () => {
  const territory = source('src/services/backend/territoryRepository.ts');
  assert.match(territory, /return \{ regions: \[\], source: 'cache' \}/);
  assert.match(territory, /parseCachedJson/);
});

test('sync keeps idempotency identity and stops on global outage', () => {
  const sync = source('src/services/backend/activitySyncService.ts');
  assert.match(sync, /clientActivityId:activity\.clientActivityId/);
  assert.match(sync, /if\(running\|\|/);
  assert.match(sync, /if\(failure\.global\)break/);
  const contract = source('src/features/activity/syncContract.ts');
  assert.match(contract, /NETWORK_UNAVAILABLE'.*global: true/s);
});

test('new request flows protect against stale responses and subscriptions clean up', () => {
  assert.match(source('src/app/friends.tsx'), /generation===searchGeneration\.current/);
  assert.match(source('src/features/poi/PoiContext.tsx'), /generation === poiRequestGeneration\.current/);
  assert.match(source('src/app/_layout.tsx'), /subscription\.remove\(\)/);
});

test('production diagnostics are dev guarded and do not log route coordinates or tokens', () => {
  const files = ['src/app/_layout.tsx', 'src/components/AppErrorBoundary.tsx', 'src/services/backend/activitySyncService.ts'];
  for (const file of files) {
    const text = source(file);
    for (const match of text.matchAll(/console\.(?:log|info|warn|error)\([^\n]*/g)) {
      assert.match(text.slice(Math.max(0, match.index - 30), match.index), /__DEV__/);
      assert.doesNotMatch(match[0], /access_token|refresh_token|latitude|longitude/i);
    }
  }
});
