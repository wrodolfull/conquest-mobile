const test = require('node:test');
const assert = require('node:assert/strict');
const { updateGeofence } = require('../.test-dist/features/poi/geofenceEngine.js');
const { arenaPointsForTrainingPower, xpForSegment, xpForMixedRoute } = require('../.test-dist/features/poi/poiRules.js');
const { buildLeaderboard } = require('../.test-dist/features/poi/arenaRanking.js');
const poi = { enterRadiusMeters: 60, exitRadiusMeters: 90, gracePeriodSeconds: 20 };

test('geofence uses enter/exit hysteresis and grace', () => {
  let state = updateGeofence({ status: 'outside' }, 100, poi, 0); assert.equal(state.status, 'outside');
  state = updateGeofence(state, 50, poi, 1); assert.equal(state.status, 'inside');
  state = updateGeofence(state, 70, poi, 2); assert.equal(state.status, 'inside');
  state = updateGeofence(state, 95, poi, 3); assert.equal(state.status, 'exit_pending');
  state = updateGeofence(state, 70, poi, 10_000); assert.equal(state.status, 'inside');
  state = updateGeofence(state, 95, poi, 11_000); state = updateGeofence(state, 95, poi, 31_001); assert.equal(state.status, 'outside');
});

test('Arena Points only reflect TP earned while inside', () => {
  assert.equal(arenaPointsForTrainingPower(100, false), 0);
  assert.equal(arenaPointsForTrainingPower(100, true), 100);
  assert.equal(arenaPointsForTrainingPower(50, true) + arenaPointsForTrainingPower(50, false), 50);
});

test('Training Ground boosts only XP earned inside', () => {
  assert.equal(xpForSegment(100, false), 100); assert.equal(xpForSegment(100, true), 120);
  assert.equal(xpForMixedRoute([{ baseXp: 50, insideTrainingGround: true }, { baseXp: 50, insideTrainingGround: false }]), 110);
});

test('Arena leaderboard is empty until an authoritative scoring system exists', () => {
  assert.deepEqual(buildLeaderboard(), []);
});
