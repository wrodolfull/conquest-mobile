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

## Quality checks

```bash
npm run typecheck
npm run lint
```

## Scope

This version contains a responsive, navigable mocked prototype with Map, Activities, Inventory, Battles, Ranking, and Profile tabs. It does not include authentication, real GPS tracking, map services, backend services, or multiplayer.
