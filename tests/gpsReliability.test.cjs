const test = require('node:test');
const assert = require('node:assert/strict');
const { createTrackingState, processPoint, routeDistanceMeters, splitRouteAtGaps } = require('../.test-dist/features/activity/tracking.js');
const { calculateTraversals, rewardsForDistance } = require('../.test-dist/features/activity/outdoorRules.js');

const origin = { latitude: -22.9698, longitude: -46.9974 };
const point = (northMeters, timestamp, accuracy = 8, extras = {}) => ({ ...origin, latitude: origin.latitude + northMeters / 110574, timestamp, accuracy, ...extras });
function stabilized(type = 'running') {
  let state = createTrackingState(type);
  for (const sample of [point(0, 1_000), point(1, 3_000), point(2, 5_000)]) state = processPoint(state, sample).state;
  assert.equal(state.phase, 'tracking');
  assert.equal(routeDistanceMeters(state.accepted), 0);
  return state;
}

test('stationary drift inside the accuracy radius adds approximately zero distance', () => {
  let state = stabilized('walking');
  for (const sample of [point(3, 7_000, 12), point(-2, 9_000, 12), point(4, 11_000, 12)]) state = processPoint(state, sample).state;
  assert.ok(routeDistanceMeters(state.accepted) < 1);
});

test('single out-and-back spike is rejected and cannot affect economy', () => {
  let state = stabilized();
  state = processPoint(state, point(102, 25_000)).state;
  assert.ok(state.candidate);
  state = processPoint(state, point(4, 27_000)).state;
  assert.equal(state.candidate, undefined);
  assert.ok(state.rejected.some((sample) => Math.abs(sample.latitude - point(102, 25_000).latitude) < 1e-9));
  const distance = routeDistanceMeters(state.accepted);
  assert.ok(distance < 5);
  assert.deepEqual(rewardsForDistance(distance), []);
  assert.equal(calculateTraversals(state.accepted).reduce((sum, traversal) => sum + traversal.influenceEarned, 0), 0);
});

test('real continued movement is accepted', () => {
  let state = stabilized();
  for (const sample of [point(12, 8_000), point(25, 11_000), point(39, 14_000)]) state = processPoint(state, sample).state;
  assert.ok(routeDistanceMeters(state.accepted) > 30);
});

test('poor accuracy is rejected', () => {
  const before = stabilized(); const after = processPoint(before, point(20, 8_000, 80)).state;
  assert.equal(after.accepted.length, before.accepted.length);
  assert.equal(after.rejected.at(-1).accuracy, 80);
});

test('impossible running speed is rejected', () => {
  const before = stabilized(); const after = processPoint(before, point(100, 8_000)).state;
  assert.equal(after.accepted.length, before.accepted.length);
  assert.equal(after.rejected.at(-1).timestamp, 8_000);
});

test('long GPS gap creates a route break without straight-line distance', () => {
  const before = stabilized(); const after = processPoint(before, point(500, 35_001)).state;
  assert.equal(after.accepted.at(-1).breakBefore, true);
  assert.equal(routeDistanceMeters(after.accepted), 0);
  assert.equal(splitRouteAtGaps(after.accepted).length, 2);
  assert.equal(calculateTraversals(after.accepted).reduce((sum, item) => sum + item.distanceMeters, 0), 0);
});

test('startup instability does not produce game distance', () => {
  let state = createTrackingState('running');
  state = processPoint(state, point(0, 1_000, 70)).state;
  state = processPoint(state, point(300, 3_000, 10)).state;
  state = processPoint(state, point(0, 5_000, 10)).state;
  assert.equal(state.phase, 'acquiring'); assert.equal(routeDistanceMeters(state.accepted), 0);
});

test('realistic 30-35m startup fixes become tracking', () => {
  let state = createTrackingState('walking');
  for (const sample of [point(0, 1_000, 35), point(2, 3_000, 33), point(4, 5_000, 30)]) state = processPoint(state, sample).state;
  assert.equal(state.phase, 'tracking');
  assert.equal(state.accepted.length, 1);
  assert.equal(routeDistanceMeters(state.accepted), 0);
});

test('60m startup fixes remain acquiring', () => {
  let state = createTrackingState('walking');
  for (const sample of [point(0, 1_000, 60), point(1, 3_000, 65), point(2, 5_000, 70)]) state = processPoint(state, sample).state;
  assert.equal(state.phase, 'acquiring');
  assert.equal(state.accepted.length, 0);
});

test('rolling startup window tolerates an intervening poor fix', () => {
  let state = createTrackingState('walking');
  for (const sample of [point(0, 1_000, 32), point(1, 2_000, 70), point(2, 3_000, 34), point(3, 4_000, 31), point(4, 5_000, 30)]) state = processPoint(state, sample).state;
  assert.equal(state.phase, 'tracking');
  assert.equal(state.accepted.length, 1);
});

test('stabilized anchor does not connect acquisition displacement', () => {
  let state = createTrackingState('running');
  for (const sample of [point(-100, 1_000, 80), point(0, 3_000, 30), point(10, 5_000, 30), point(20, 7_000, 30)]) state = processPoint(state, sample).state;
  assert.equal(state.phase, 'tracking');
  assert.equal(routeDistanceMeters(state.accepted), 0);
  state = processPoint(state, point(40, 10_000, 20)).state;
  assert.ok(routeDistanceMeters(state.accepted) > 18);
  assert.ok(routeDistanceMeters(state.accepted) < 22);
});

test('duplicate startup fix cannot add distance', () => {
  let state = createTrackingState('walking');
  for (const sample of [point(0, 1_000, 30), point(1, 3_000, 30), point(2, 5_000, 30)]) state = processPoint(state, sample).state;
  const before = routeDistanceMeters(state.accepted);
  state = processPoint(state, point(2, 5_000, 30)).state;
  assert.equal(routeDistanceMeters(state.accepted), before);
  assert.equal(state.rejected.at(-1).timestamp, 5_000);
});
