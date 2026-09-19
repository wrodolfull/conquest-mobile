const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { generateTerritories } = require('../.test-dist/features/territories/territoryGenerator.js');
const { renderableTerritories, territoryCandidatesForLocation } = require('../.test-dist/features/territories/territoryMapData.js');
const { territoryStatusLabel, territoryVisual } = require('../.test-dist/features/map/mapVisuals.js');

const origin = { latitude: -22.9698, longitude: -46.9974 };

test('territory candidates are callable, deterministic, and cover the radius-two grid', () => {
  assert.equal(typeof generateTerritories, 'function');
  const first = generateTerritories(origin);
  const second = generateTerritories(origin);
  assert.equal(first.length, 19);
  assert.deepEqual(first.map(({ id }) => id), second.map(({ id }) => id));
  assert.equal(new Set(first.map(({ id }) => id)).size, 19);
});

test('territory candidates contain neutral non-authoritative defaults', () => {
  for (const candidate of generateTerritories(origin)) {
    assert.equal(candidate.ownerUserId, null);
    assert.equal(candidate.ownerDisplayName, null);
    assert.equal(candidate.ownerInfluencePoints, 0);
    assert.equal(candidate.totalInfluencePoints, 0);
    assert.equal(candidate.myInfluencePoints, 0);
    assert.equal(candidate.controlPercentage, 0);
    assert.equal(candidate.status, 'neutral');
  }
});

function snapshot(candidate) {
  return {
    territory_id: candidate.id,
    name: 'Server territory',
    geometry: { type: 'Polygon', coordinates: [[[-47, -23], [-46.9, -23], [-47, -22.9]]] },
    owner_user_id: 'real-user',
    owner_display_name: 'Real Player',
    owner_influence_points: 80,
    total_influence_points: 100,
    my_influence_points: 20,
    control_percentage: 80,
    status: 'enemy',
  };
}

test('only server or cached snapshots become renderable territories', () => {
  const candidates = generateTerritories(origin);
  const cachedOrServer = snapshot(candidates[0]);
  const rendered = renderableTerritories(candidates, new Map([[cachedOrServer.territory_id, cachedOrServer]]));
  assert.equal(rendered.length, 1);
  assert.equal(rendered[0].id, candidates[0].id);
  assert.equal(rendered[0].ownerUserId, 'real-user');
  assert.equal(rendered[0].ownerInfluencePoints, 80);
  assert.deepEqual(renderableTerritories(candidates, new Map()), []);
});

test('ownerless stale snapshots are normalized and cannot crash map styling', () => {
  const candidate = generateTerritories(origin)[0];
  const inconsistentSnapshot = { ...snapshot(candidate), owner_user_id: null, status: 'enemy' };
  const [rendered] = renderableTerritories(
    [candidate],
    new Map([[inconsistentSnapshot.territory_id, inconsistentSnapshot]]),
  );

  assert.equal(rendered.ownerUserId, null);
  assert.equal(rendered.status, 'neutral');
  assert.doesNotThrow(() => territoryVisual(rendered));
  assert.deepEqual(territoryVisual(rendered), {
    fillColor: '#A2ADA91F',
    strokeColor: '#A2ADA9D9',
    strokeWidth: 1.4,
  });
});

test('incomplete snapshots cannot render or crash the territory status label', () => {
  const candidate = generateTerritories(origin)[0];
  const incompleteSnapshot = { ...snapshot(candidate), status: undefined };

  assert.deepEqual(
    renderableTerritories([candidate], new Map([[candidate.id, incompleteSnapshot]])),
    [],
  );
  assert.equal(territoryStatusLabel(undefined), 'UNKNOWN');
  assert.equal(territoryStatusLabel(null), 'UNKNOWN');
  assert.equal(territoryStatusLabel('contested'), 'CONTESTED');
});

test('location denial cannot generate a fallback territory world', () => {
  assert.deepEqual(territoryCandidatesForLocation(null, true), []);
  assert.deepEqual(territoryCandidatesForLocation(origin, true), []);
  assert.equal(territoryCandidatesForLocation(origin, false).length, 19);
});

test('generator does not restore retired mocks or seeded ownership', () => {
  const source = fs.readFileSync('src/features/territories/territoryGenerator.ts', 'utf8');
  assert.doesNotMatch(source, /src\/mocks|dev\/fixtures|getTerritoryGameSeed|generateArenas/);
});
