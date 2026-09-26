const test=require('node:test'),assert=require('node:assert/strict'),{coordinatesFromTerritoryId,formatTargetDistance}=require('../.test-dist/features/targets/targetRules.js');
test('territory ids preserve negative axial coordinates',()=>assert.deepEqual(coordinatesFromTerritoryId('local--2-3'),{q:-2,r:3}));
test('distance formats meters and kilometres',()=>{assert.equal(formatTargetDistance(421),'420 M AWAY');assert.equal(formatTargetDistance(1410),'1.4 KM AWAY')});
