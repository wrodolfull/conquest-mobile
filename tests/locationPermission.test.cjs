const test=require('node:test');const assert=require('node:assert/strict');const{locationPermissionAction}=require('../.test-dist/features/poi/locationPermission.js');
test('granted permission has no blocker',()=>assert.equal(locationPermissionAction(true,true,true),'none'));
test('fresh or retryable denial requests foreground permission',()=>assert.equal(locationPermissionAction(true,false,true),'request'));
test('permanent denial opens settings',()=>assert.equal(locationPermissionAction(true,false,false),'settings'));
