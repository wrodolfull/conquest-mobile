# RUQEST internal Android beta smoke test

Run this checklist on the standalone APK built with the EAS `preview` profile. Do not attach Metro or use Expo Go. Record the device model, Android version, APK build identifier, network state, and outcome for each section.

## App and account

- [ ] Fresh install launches with RUQEST branding and no development menus.
- [ ] Email sign-in succeeds; invalid credentials show product-level recovery copy.
- [ ] Account creation succeeds and confirmation guidance is clear.
- [ ] After force-closing and reopening, the authenticated session persists.
- [ ] Onboarding completes, every button works, and location/privacy explanations match actual behavior.

## Profile

- [ ] Profile renders avatar, XP, and resources without placeholder or internal errors.
- [ ] Profile tabs open and return correctly.

## Map

- [ ] Mapbox base map loads and the player position appears after permission is granted.
- [ ] Territory level-of-detail changes appropriately while zooming in and out.
- [ ] Recenter returns the camera to the player.
- [ ] A visible territory can be selected and dismissed.
- [ ] Missing connectivity or map configuration shows a safe product-level state without losing activity data.

## Outdoor activity

- [ ] Start a walk and verify GPS acquisition.
- [ ] Put the app in the background, then lock the screen where device policy permits.
- [ ] Move outdoors, unlock, and return to RUQEST; the route continues without requiring interaction while moving.
- [ ] Stop the activity and verify the results screen.
- [ ] Restore connectivity if needed and verify authoritative synchronization completes.
- [ ] With the server unavailable, an activity remains locally safe and can recover later.

## Beta surface

- [ ] Social and Ranking open without a crash.
- [ ] Inventory, Battles, and Notifications open without a crash.
- [ ] Indoor is marked unavailable/coming soon; no simulated indoor rewards can be earned.
- [ ] POI, territory-grid, GPS, and Indoor debug tools are absent.

## Release configuration gate

- [ ] EAS `development` environment has `EXPO_PUBLIC_SUPABASE_URL`.
- [ ] EAS `development` environment has `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] EAS `development` environment has `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- [ ] EAS `development` environment has secret `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` with Mapbox `DOWNLOADS:READ` scope.
- [ ] `npx expo config --type public` resolves RUQEST, package `com.wrodolfull.conquest`, and the unchanged EAS project ID.
