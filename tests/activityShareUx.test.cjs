const test = require('node:test');
const assert = require('node:assert/strict');
const { homeActivityCtaPresentation, activeActivityDestination, ACTIVE_ACTIVITY_ORANGE } = require('../.test-dist/features/activity/activityPresentation.js');
const { createActivityShareModel } = require('../.test-dist/features/activity/shareModel.js');

test('normal Home CTA retains the lime play visual', () => {
  const visual = homeActivityCtaPresentation();
  assert.equal(visual.title, 'Start activity'); assert.equal(visual.icon, 'play'); assert.equal(visual.iconColor, '#C8FF4A');
});
test('active Home CTA uses orange and each activity icon', () => {
  const icons = { walking: 'walk-outline', running: 'speedometer-outline', cycling: 'bicycle-outline' };
  for (const [type, icon] of Object.entries(icons)) { const visual = homeActivityCtaPresentation({ type, status: 'active' }); assert.equal(visual.icon, icon); assert.equal(visual.iconColor, ACTIVE_ACTIVITY_ORANGE); assert.equal(visual.title, 'Activity in progress'); }
});
test('interrupted activity uses a warning while retaining active treatment', () => {
  const visual = homeActivityCtaPresentation({ type: 'walking', status: 'interrupted' }); assert.equal(visual.icon, 'warning'); assert.equal(visual.iconColor, ACTIVE_ACTIVITY_ORANGE); assert.match(visual.accessibilityLabel, /Interrupted walking/);
});
test('active CTA resumes the same session', () => {
  assert.deepEqual(activeActivityDestination({ id: 'session-123', type: 'cycling' }), { pathname: '/activity/active', params: { type: 'cycling', sessionId: 'session-123' } });
});
const activity = { id: 'local-id', clientActivityId: 'local-id', ownerUserId: 'private-user', serverActivityId: 'private-server', type: 'running', startedAt: 1_000, endedAt: 61_000, durationSeconds: 60, distanceMeters: 1200, xpEarned: 12, influenceEarned: 11, energyEarned: 4, route: [{ latitude: 12.34, longitude: 56.78, timestamp: 1_000 }], traversals: [{ territoryId: 'private-territory', territoryName: 'Grid', distanceMeters: 1200, influenceEarned: 11 }], unlockedRewards: [], specialZones: [], syncStatus: 'pending' };
test('default share model is route-free and falls back to pending local values', () => {
  const model = createActivityShareModel(activity); assert.equal(model.includeRoute, false); assert.equal(model.distanceMeters, 1200); assert.equal(model.xpEarned, 12); assert.equal(model.influenceEarned, 11); assert.equal(model.territoriesImpacted, 1);
  const serialized = JSON.stringify(model); for (const value of ['latitude', 'longitude', '12.34', '56.78', 'private-user', 'private-server', 'private-territory']) assert.equal(serialized.includes(value), false);
});
test('share model uses server-confirmed authoritative values', () => {
  const model = createActivityShareModel({ ...activity, syncStatus: 'synced', authoritativeDistanceMeters: 1500, authoritativeXpEarned: 20, authoritativeInfluenceEarned: 15, authoritativeTerritoryImpacts: [{ territoryId: 'a', territoryName: 'A', distanceMeters: 900, influenceEarned: 9 }, { territoryId: 'b', territoryName: 'B', distanceMeters: 600, influenceEarned: 6 }], authoritativeLoot: [{ milestoneMeters: 1000, rarity: 'common', item: { id: 'loot-private-id', name: 'Trail Token', description: null, rarity: 'common', category: 'collectible', iconKey: null } }] });
  assert.equal(model.distanceMeters, 1500); assert.equal(model.xpEarned, 20); assert.equal(model.influenceEarned, 15); assert.equal(model.territoriesImpacted, 2); assert.equal(model.lootSummary, 'Trail Token'); assert.equal(JSON.stringify(model).includes('loot-private-id'), false);
});
test('Activity Results exposes the Share Activity entry point', () => {
  const source = require('node:fs').readFileSync('src/app/activity/results.tsx', 'utf8'); assert.match(source, /SHARE ACTIVITY/); assert.match(source, /ShareActivityPreview/);
});

test('Activity V2 keeps routing, sync distinctions, privacy, and Ruqest branding', () => {
  const fs = require('node:fs');
  const select = fs.readFileSync('src/app/activity/select.tsx', 'utf8');
  const active = fs.readFileSync('src/app/activity/active.tsx', 'utf8');
  const results = fs.readFileSync('src/app/activity/results.tsx', 'utf8');
  const share = fs.readFileSync('src/components/activity/ShareActivityCard.tsx', 'utf8');
  assert.match(select, /pathname: '\/activity\/active'/);
  assert.match(active, /router\.replace\('\/map'\)/);
  assert.match(results, /PENDING SYNC · ESTIMATED/);
  assert.match(results, /NOT ENOUGH GPS DATA/);
  assert.match(share, />RUQEST</);
  for (const source of [select, active, results, share]) assert.doesNotMatch(source, />[^<{]*CONQUEST[^<{]*</i);
});
