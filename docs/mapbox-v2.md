# Map Engine V2 — Mapbox

CONQUEST uses `@rnmapbox/maps` as its sole native game-world renderer. Mapbox needs two different tokens with deliberately separate lifecycles:

- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` is the public runtime token (the `pk…` kind). It is bundled into the client and authorizes map/style requests. `EXPO_PUBLIC_MAPBOX_STYLE_URL` remains optional; the built-in Mapbox dark style is the default.
- `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` is a secret build-only token (the `sk…` kind) with **DOWNLOADS:READ** scope. The Expo plugin reads it from the build process environment so native Mapbox artifacts can be downloaded. It must never use an `EXPO_PUBLIC_` prefix, enter runtime JavaScript, or be committed.

`app.config.js` explicitly selects the Mapbox implementation and passes the build secret only through `process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN`. No token value is stored in the repository.

## Physical-device authentication diagnosis

The black base map observed during Map Engine V2 physical testing was caused by an invalid public runtime value in `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`; the Mapbox Styles API returned HTTP 401. Correcting that public `pk` token restored runtime authentication. The v10 map loading lifecycle handlers and unavailable-state fallback remain diagnostic and resilience measures, not the root-cause fix. Local Metro bundles read `.env`/`.env.local`, so an EAS server variable alone does not configure a locally served JavaScript bundle.

## EAS configuration and builds

Set both tokens separately in the EAS **development**, **preview**, and **production** environments (and the optional style URL where desired). Mark the download token as secret. For development, for example:

```bash
eas env:create --environment development --name EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN --value '<public pk token>'
eas env:create --environment development --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN --value '<secret download token>' --visibility secret
eas build --profile development --platform android
eas build --profile development --platform ios
```

Repeat both environment commands with `--environment preview` and `--environment production`, then build those profiles as needed. Do not put the build token in `.env.example`, an `EXPO_PUBLIC_*` variable, source code, or EAS configuration committed to Git. **A NEW DEVELOPMENT BUILD IS REQUIRED. Mapbox is a native dependency and this project does not support Expo Go.** After a Mapbox development build is physically verified, the retired `GOOGLE_MAPS_API_KEY` may be removed from EAS/project build configuration; do not print, revoke, or alter that key from source control.

## Architecture and privacy

`ConquestBaseMap` owns the base style, attribution/logo, token failure state, and tile-failure-safe surface. Home feeds all authoritative PostGIS Polygon/MultiPolygon regions (including holes) into `conquest-world-regions`, with data-driven fill and edge layers. POIs use a separate point source. The optional atomic grid is a separate line source and exists only when both `__DEV__` and `EXPO_PUBLIC_ENABLE_TERRITORY_GRID_DEBUG=true` hold.

The public territory source contains only aggregated server world-region geometry and safe display properties. Active and result routes use separate `private-active-route` and `private-result-route` sources made solely from the authenticated player's accepted local GPS points. Routes are split at GPS gaps. Mapbox never provides location authority: `expo-location`, GPS V2 filtering, background tasks, and SQLite remain unchanged.

Camera-idle events drive the existing debounced viewport RPC. Oversized viewports are ignored without clearing valid regions. Active tracking follows accepted position until the player touches the map; the follow button restores it. Results fit the private route bounds.

## Physical-device acceptance

1. **Home:** open Home; verify the dark Mapbox world, real player, organic regions, no hex board, and tappable Territory Intel.
2. **Pan / zoom:** pan locally; verify refresh only after settling and no RPC flood. Zoom far out; verify no invalid viewport spam and the last regions remain.
3. **POI:** verify an Arena and Training Ground at their expected coordinates.
4. **Active walk:** start Walking; verify the live map, current position, progressively drawn accepted route, distance, duration, GPS quality, next milestone, and Finish.
5. **Screen lock:** lock, walk, and unlock; verify GPS V2 continued recording and the map redraws accepted points.
6. **Activity result:** finish; verify the complete private route fits, start/finish show, and gaps are not connected.
7. **Territory:** after authoritative sync, return Home and verify the influenced organic region.

## JavaScript bundling dependency

`@rnmapbox/maps` imports `debounce` from its JavaScript `MapView` implementation and imports `@turf/helpers`, `@turf/distance`, `@turf/along`, `@turf/length`, and `@turf/nearest-point-on-line` from its geometry utilities. CONQUEST declares these runtime modules directly rather than depending on them being hoisted transitively. After pulling this change, run `npm install` and restart Metro with a cleared cache before bundling or rebuilding the development client.
