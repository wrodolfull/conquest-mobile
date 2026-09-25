# Ruqest Beta Hardening V1 report

## Findings and changes

1. **Boot state:** `null` previously meant both a missing profile and a failed request, so an authenticated player could remain on a spinner forever. Player loading now has explicit idle, loading, ready, missing-profile, and error states. Only a successful missing-profile response enters onboarding; auth/profile transport errors retain the session and offer a guarded retry.
2. **Infinite loading:** auth bootstrap errors and player fetch errors now terminate loading in a recoverable screen. Closely spaced player retries share one in-flight request.
3. **Render recovery:** an application boundary wraps auth and routing, displays safe copy, and remounts its subtree on retry. The map boundary no longer references Expo Go and can reset.
4. **Auth/session:** the auth subscription is installed before the bootstrap request, and an auth event wins over a late bootstrap response. A generic bootstrap/profile failure is not treated as logout. Supabase-confirmed null sessions still route to sign-in. The active-activity sign-out guard remains in the Profile screen, and sign-out does not erase completed local history.
5. **SQLite/cache:** territory RPC plus SQLite failure returns an empty cache result. Corrupt territory, inventory, weekly, and exploration JSON is ignored. Weekly/exploration cache-write failure no longer discards valid server data. Active-session discard deletes its points and session in one transaction.
6. **Activity durability:** the durable point stream and deterministic replay are unchanged. Startup now waits for a five-minute stale threshold and only interrupts after native tracking explicitly reports not registered; native/SQLite check failures preserve the session. Interrupted sessions and their points remain available to recovery UI.
7. **Activity sync:** `clientActivityId` remains the idempotency key. The process-wide running guard and retry throttle remain. Network, auth, server, and unknown global failures stop the queue; permanent per-activity rejection/version/GPS failures allow later items to proceed. Authoritative success is committed before optional cache refreshes, and player refresh now occurs only when the sync reports a success.
8. **AppState/listeners:** mounted AppState, repository, location, interval, timeout, and auth listeners audited in `src`; component listeners expose cleanup. Supabase's module-lifetime auto-refresh listener intentionally lives for the process lifetime. Existing independent foreground refreshes remain scoped to their owning screens/providers.
9. **POI:** location exceptions remain isolated from routed screens. Failed initial POI fetch degrades to an empty set; stale data is retained on later transient failures. POIs refresh after 750 m of movement or 15 minutes, not every GPS update, and request generations block stale results.
10. **Request races:** existing map and Ranking generation guards remain. Social search and POI requests now use generation checks.
11. **Logging/privacy:** all current application diagnostics found in `src` are development-gated. No production diagnostic intentionally logs tokens, email, profile payloads, or route coordinates. Safe map performance diagnostics remain.
12. **Hardening V2:** `loadTrackingState()` still performs a full deterministic point replay whenever the active-activity repository notifies. For very long activities, investigate an in-memory incremental projection with a durable checkpoint, but do not risk changing tracking math in V1. A device-level fault-injection pass should also validate SQLite open/disk-full presentation on every activity screen and exhaustively exercise every paginated UI.
13. **Hardening V3 native branding:** `app.json` still exposes `CONQUEST` as the app name; both expo-location permission strings and both iOS `NSLocation*UsageDescription` strings also say `CONQUEST`. The slug, scheme, Android package identifier, database/cache names, and location task identifiers retain legacy technical names and must not be renamed without a migration plan. No identifiers were changed here.
14. **Tests:** regression checks cover cache corruption, boot state distinctions/retry/no-sign-out behavior, transactional discard/conservative recovery, double-failure territory fallback, sync idempotency/queue classification, stale social/POI requests, listener cleanup, and logging privacy. Existing GPS, map performance, Ranking, and battle suites remain unchanged.
15. **Backend/deployment:** no backend code, schema, economy, territory, Ranking, or GPS acceptance rules changed. No Supabase migration or Edge Function deployment is required. No dependency/native configuration changed, so no native/EAS rebuild is required.

## Manual beta failure matrix

| Scenario | Expected safe behavior |
| --- | --- |
| Launch normally online | Session resolves once, player reaches the appropriate sign-in/onboarding/map route, and pending sync runs without concurrent loops. |
| Launch with network unavailable | A signed-in cached session is not discarded; failed player/bootstrap loading ends on **RUQEST COULDN'T CONNECT** with retry. Locally recorded activity remains safe. |
| Lose network while viewing Ranking | Existing rows remain visible where available; the screen exposes its recoverable request error and does not sign out. |
| Finish activity while server unavailable | Completion remains pending/failed locally with “could not sync” safety copy; no reward is claimed as authoritative. |
| Close/reopen with an active activity | SQLite session and points reload. A recent session is not marked interrupted during native initialization; a stale, explicitly unregistered session becomes recoverable as interrupted. |
| Return after several minutes in background | Auth auto-refresh, throttled activity sync, permission recheck, and screen-local stale refreshes run; mounted listeners do not multiply. |
| Server sync fails, then succeeds | The same `clientActivityId` is retried after throttle/manual retry and produces at most one authoritative activity/reward. |
| Cached map while backend unavailable | Cached viewport renders. Corrupt/missing/failed SQLite cache yields an empty map overlay rather than a crash. |
| Load-more request fails | Previously loaded rows remain visible and retry does not duplicate a page. Validate Activities, Ranking, Notifications, and Social on-device. |
| Session becomes invalid | A Supabase-confirmed auth transition clears the session and routes cleanly to sign-in; ordinary request/network failures do not. |
