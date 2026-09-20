# Activity lifecycle and deployment parity V2.1

## Audited lifecycle

An outdoor start requests foreground/background location, atomically creates one owner-scoped SQLite session, starts the existing Expo background task, and records raw fixes in an append-only table. The tracking engine alone promotes accepted fixes. Finish stops native updates, waits for ingestion, reloads that canonical stream, saves the complete private route locally as `pending`, then removes the active session and starts synchronization. Sync calls `complete-activity`; the Edge Function authenticates the bearer, independently validates/recomputes route distance and territory allocation, and invokes `finalize_activity_transaction` with a service-role client. That transaction idempotently writes `activities`, `activity_territory_impacts`, `influence_ledger`, `territory_influence`, player progress, loot grants and inventory. Only its complete response changes local state to `synced`.

The world map calls authenticated `get_world_regions`, which reads positive authoritative `territory_influence` and returns viewport-limited organic Polygon/MultiPolygon geometry. Local pending traversals never become a public overlay. A successful sync now invalidates the mounted map request, so server geometry is fetched again.

## Truthful sync states

- **PENDING:** safely stored locally; no server confirmation yet.
- **SYNCING:** an invocation is currently in flight. A process restart recovers stale `syncing` rows to `pending`.
- **SYNCED:** the server accepted/idempotently found the activity and returned the complete authoritative contract.
- **FAILED:** the latest attempt failed. The UI keeps the route and offers Retry Sync.

Failures are persisted as `NETWORK_UNAVAILABLE`, `BACKEND_VERSION_MISMATCH`, `AUTHENTICATION_FAILURE`, `ACTIVITY_REJECTED`, `SERVER_ERROR`, or `UNKNOWN_ERROR`; production UI stores a safe explanation rather than a backend trace. Authentication is the only global queue stop. Every other failed row is isolated so newer rows continue.

## Root cause and contract audit

Before V2.1, one failed activity executed `break`, blocking every later queue item. A malformed response also became a generic error and the UI rendered every non-synced status as “pending.” The current client additionally requires `loot`, introduced by `202609190005_inventory_loot_v1.sql`. A project running only through Territory V2, or an older Edge Function/finalizer that omits `loot`, `territoryImpacts`, or numeric authoritative totals, is a **backend version mismatch** and cannot safely be called synced. That mismatch is now a visible failed state.

Territory is written only inside `finalize_activity_transaction`, after activity validation, and is visible only when influence is positive. Previously per-territory flooring could turn a valid 100+ meter route split across sub-100-meter territory portions into zero total influence. Allocation now retains `floor(total accepted distance / 100)` while distributing remainder points deterministically; the economy remains exactly 100 meters per point.

## Deployment parity checklist

Deploy these together, in migration order:

1. All migrations through `supabase/migrations/202609190005_inventory_loot_v1.sql` (including `202609190004_territory_engine_v2.sql`).
2. The current `supabase/functions/complete-activity/index.ts` and `activity.ts` as one Edge Function deployment.
3. The matching app build/update from the same Git revision.

Dashboard/Web workflow: open **Database > Migrations** (or use the Supabase CLI) and verify the migration history; confirm `finalize_activity_transaction` has the Inventory V1 return contract; deploy `complete-activity`; then inspect its deployment timestamp/logs and run an authenticated smoke activity. Do not paste, log, or ship the service-role key. It remains an Edge Function environment secret.

## Physical-device acceptance

A. Start Walking: remain on the live map; accepted route grows and duration/distance update. B. Tap Minimize: Home shows Activity in progress; tap it and confirm the identical route/session/time/distance. C. Attempt another start: the existing session resumes. D. Walk at least 100 accepted meters and Finish: result opens, briefly pending/syncing if necessary, then server confirmed. E. Return Home: the organic influenced region appears without restart and no atomic hex board appears. F. Open Activities and tap the card: private route, metrics, sync state and authoritative impacts appear. G. Disable networking or point a test build at an intentionally stale backend: local route remains, failed/pending meaning is truthful, Retry works after restoration, and later independent rows are not blocked.

No native dependency changed. An over-the-air JavaScript update is sufficient for an already compatible development/production build; a new Development Build is not required for V2.1 itself.

## SQLite lock stabilization

The first V2.1 implementation used `withExclusiveTransactionAsync` for session creation. On a physical device, that transaction could overlap the native background task's point ingestion and fail while Expo finalized a prepared statement with `database is locked`. Session creation now uses one atomic `INSERT ... SELECT ... WHERE NOT EXISTS` statement and checks `changes` to retain the one-session invariant without holding an exclusive lock. WAL remains enabled and a bounded five-second SQLite busy timeout lets short native writer overlap settle instead of failing immediately.
