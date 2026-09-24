const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');

test('Home action preserves idle and active destinations', () => {
  const source = read('src/features/home/HomeScreen.tsx');
  assert.match(source, /active \? router\.push\(activeActivityDestination\(active\)\) : router\.push\('\/activity\/select'\)/);
  assert.match(source, /formatDuration/);
  assert.match(source, /potentialInfluenceForDistance/);
});

test('compact player HUD uses real unread state and notification inbox', () => {
  const source = read('src/components/PlayerHeader.tsx');
  assert.match(source, /unreadNotifications>0/);
  assert.match(source, /badge=\{hasUnread\}/);
  assert.match(source, /router\.push\('\/notifications'\)/);
});

test('Home contextual surfaces stay compact and retain authoritative battle state', () => {
  const weekly = read('src/components/WeeklyProgress.tsx');
  const territory = read('src/features/map/TerritoryCard.tsx');
  assert.match(weekly, /setExpanded/);
  assert.match(weekly, /accessibilityRole="button"/);
  assert.match(territory, /battleRepository\.getState/);
  assert.match(territory, /state\?\.eligible/);
  assert.match(territory, /battleUnavailableCopy/);
});

test('Home presentation uses Ruqest copy and never opaque black territory fills', () => {
  const files = [
    'src/features/home/HomeScreen.tsx',
    'src/components/PlayerHeader.tsx',
    'src/components/WeeklyProgress.tsx',
    'src/components/ArenaCard.tsx',
    'src/features/map/TerritoryCard.tsx',
    'src/features/map/MapErrorBoundary.tsx',
  ];
  for (const file of files) assert.doesNotMatch(read(file), />[^<{]*CONQUEST[^<{]*</i, file);
  const visuals = read('src/features/map/mapVisuals.ts');
  assert.doesNotMatch(visuals, /#000000/);
  assert.match(visuals, /fillOpacity: selected \? 0\.23/);
});

test('circular XP ring maps boundary percentages to stable segments', () => {
  const { xpRingSegmentCount, XP_RING_SEGMENTS } = require('../.test-dist/features/home/xpProgress.js');
  assert.equal(XP_RING_SEGMENTS, 40);
  assert.deepEqual([0, 25, 50, 75, 100].map((percent) => xpRingSegmentCount(percent)), [0, 10, 20, 30, 40]);
  assert.equal(xpRingSegmentCount(-10), 0);
  assert.equal(xpRingSegmentCount(110), 40);
  const header = read('src/components/PlayerHeader.tsx');
  assert.match(header, /progress\.xp % 1000 \/ 10/);
  assert.match(header, /XpProgressRing percent=\{xpPercent\}/);
  assert.doesNotMatch(header, /xpTrack|xpFill/);
});
