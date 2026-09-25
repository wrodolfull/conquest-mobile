const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('standalone preview keeps stable identifiers and explicit APK environment', () => {
  const app = JSON.parse(read('app.json')).expo;
  const eas = JSON.parse(read('eas.json'));
  assert.equal(app.name, 'RUQEST');
  assert.equal(app.slug, 'conquest');
  assert.equal(app.android.package, 'com.wrodolfull.conquest');
  assert.equal(app.android.versionCode, 1);
  assert.equal(app.extra.eas.projectId, 'cf044725-f8d6-4349-9ac0-e84fa882c8ec');
  assert.equal(eas.build.preview.distribution, 'internal');
  assert.equal(eas.build.preview.environment, 'development');
  assert.equal(eas.build.preview.android.buildType, 'apk');
  assert.notEqual(eas.build.preview.developmentClient, true);
});

test('native permission and foreground tracking copy use RUQEST', () => {
  const app = read('app.json');
  const tracking = read('src/services/location/locationTrackingOptions.ts');
  assert.doesNotMatch(app, /Allow CONQUEST/);
  assert.match(app, /Allow RUQEST to use precise location/);
  assert.match(app, /Allow RUQEST to record an active outdoor activity/);
  assert.match(tracking, /RUQEST activity in progress/);
});

test('beta UI has no visible legacy brand or infrastructure recovery copy', () => {
  const files = [
    'src/app/(auth)/sign-in.tsx',
    'src/app/onboarding/index.tsx',
    'src/components/UnavailableFeature.tsx',
    'src/features/map/mapbox/mapboxConfig.ts',
    'src/services/backend/authRepository.ts',
  ];
  const source = files.map(read).join('\n');
  assert.doesNotMatch(source, />[^<{]*CONQUEST[^<{]*</i);
  assert.doesNotMatch(source, /Expo Go|Metro|Supabase is not configured/i);
});

