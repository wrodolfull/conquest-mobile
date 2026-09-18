# CONQUEST Mobile

A visual prototype for a location-based fitness strategy game, built with React Native, Expo, TypeScript, and Expo Router. All gameplay data is mocked in this phase.

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
npm ci
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
permission is allowed it centers the game world on the device; when it is denied or a
position cannot be obtained, it deliberately displays the local mock world and a
non-blocking explanation. Android location services must also be enabled.

If Expo Go still shows an older bundle, close the project in Expo Go, stop the local
Expo process, run `npx expo start --clear`, and scan the newly displayed QR code. Ensure
the terminal is running in this repository rather than another copy of the project.

### Repairing an inconsistent Expo installation on Windows

An error such as `Cannot find module 'expo-router/internal/routing'` means packages
from incompatible Expo/Router versions are mixed in `node_modules`. Stop Metro, update
the repository, and perform a clean install from the committed lockfile in PowerShell:

```powershell
git pull --ff-only origin main
Remove-Item -Recurse -Force node_modules
npm cache verify
npm ci
npx expo install --check
npx expo start --clear
```

Do not fix this error by installing `@expo/router-server` directly: it is internal Expo
tooling and must be selected by the compatible Expo SDK. This project targets Expo SDK
54, React Native 0.81, and Expo Router 6 as one compatible dependency set.

## Quality checks

```bash
npm run typecheck
npm run lint
```

## Scope

This version contains a responsive prototype with a real foreground-location map,
locally generated mock territories and Arenas, and Activities, Inventory, Battles,
Ranking, and Profile tabs. It does not include authentication, continuous/background
GPS tracking, backend services, persistent territory ownership, or multiplayer.
