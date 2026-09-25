const test=require('node:test');const assert=require('node:assert/strict');
const {PROFILE_TABS,resolveProfileTab}=require('../.test-dist/features/profile/profileTabs.js');
const {mapControlBottomInset,HOME_MAP_CONTROL_GAP,CONTEXT_CARD_CONTROL_INSET}=require('../.test-dist/features/home/homeOverlayLayout.js');
test('all profile tabs are selectable and invalid deep links fall back safely',()=>{assert.deepEqual(PROFILE_TABS,['overview','activities','territories','achievements']);for(const tab of PROFILE_TABS)assert.equal(resolveProfileTab(tab),tab);assert.equal(resolveProfileTab('unknown'),'overview');assert.equal(resolveProfileTab(undefined),'overview');});
test('Home map control follows measured compact or expanded overlays',()=>{assert.equal(mapControlBottomInset(148,false),148+HOME_MAP_CONTROL_GAP);assert.equal(mapControlBottomInset(224,false),224+HOME_MAP_CONTROL_GAP);});
test('territory and POI context reserve card-safe map control space',()=>{assert.equal(mapControlBottomInset(100,true),CONTEXT_CARD_CONTROL_INSET);assert.equal(mapControlBottomInset(300,true),300+HOME_MAP_CONTROL_GAP);});
