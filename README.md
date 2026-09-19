# CONQUEST Mobile

A mobile location-based fitness strategy game built with React Native, Expo, TypeScript, Expo Router, and a server-authoritative Supabase backend.

## Run with Expo Go

1. Install [Expo Go](https://expo.dev/go) on an Android or iOS device.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Scan the QR code shown in the terminal with Expo Go (Android) or the Camera app (iOS). Your computer and device should be on the same network.

If LAN discovery is unavailable, start with `npx expo start --tunnel`.

### Updating an existing checkout

`git pull` must finish successfully before `npm install` can install the dependencies
from the new version. If Git reports that local changes would be overwritten, preserve
them in a stash first:

```bash
git status
git stash push --include-untracked -m "local changes before map update"
git pull --ff-only origin main
npm install
npx expo start --clear
```

Keep the stash as a backup until the app is working. Use `git stash list` to see it.
Only run `git stash pop` later if those local edits are still needed; applying an old
`package.json`, `package-lock.json`, or `app.json` over the updated files can remove the
map dependencies or configuration again.

Confirm that the update was actually installed with:

```bash
git status
git log -1 --oneline
npm ls expo-location react-native-maps
```

The Home/Map screen asks for foreground location permission when it opens. When
permission is allowed it centers the game world on the device. If permission is denied,
the fallback coordinate is camera-only: playable territories, POIs, and player markers
remain hidden behind a location-required message. Android location services must also be enabled.

If Expo Go still shows an older bundle, close the project in Expo Go, stop the local
Expo process, run `npx expo start --clear`, and scan the newly displayed QR code. Ensure
the terminal is running in this repository rather than another copy of the project.

## Quality checks

```bash
npm run typecheck
npm run lint
```

## Scope

This version records durable outdoor GPS activities, synchronizes accepted results to
Supabase, derives territory state from authoritative influence, and discovers
CONQUEST-managed POIs. Inventory, Battles, Rankings, and the production Indoor economy
remain intentionally unavailable rather than displaying fictional runtime data.
