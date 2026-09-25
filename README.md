# RUQEST Mobile

A mobile location-based fitness strategy game built with React Native, Expo, TypeScript, Expo Router, and a server-authoritative Supabase backend.

## Run with a development build

Map Engine V2 uses the native `@rnmapbox/maps` SDK, so **Expo Go is not supported and a new development build is required**. Configure `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` in the selected EAS environment, run `npm install`, build with `eas build --profile development --platform android` (or `ios`), install that build, and run `npm start`. See [Map Engine V2](docs/mapbox-v2.md) for environment and physical-device acceptance details.

The Home/Map screen asks for foreground location permission. If denied, the fallback coordinate is camera-only: territories, POIs, and the player marker remain hidden behind a truthful location-required message.

## Quality checks

```bash
npm run typecheck
npm run lint
```

## Scope

This version records durable outdoor GPS activities, synchronizes accepted results to
Supabase, derives territory state from authoritative influence, and discovers
RUQEST-managed POIs. Inventory, Battles, Rankings, and the production Indoor economy
remain intentionally unavailable rather than displaying fictional runtime data.
