# Supabase backend setup

RUQEST stores workouts locally first. Supabase supplies authentication and the authoritative persistent world; internet access is never required while GPS is recording.

## Project and database

1. Create a project at [database.new](https://database.new/).
2. From the project **Connect** dialog (or API project settings), copy the Project URL and **publishable** key.
3. Install/link the CLI and apply migrations:

```sh
npm install --global supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase db lint --linked
```

The migration enables PostGIS, creates the schema/trigger/functions, and enables RLS on every public table. Inspect remote policies before production.

## App environment

Copy `.env.example` to ignored `.env.local`, or configure EAS:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

```sh
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR_PROJECT_REF.supabase.co --environment development --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value sb_publishable_YOUR_KEY --environment development --visibility sensitive
```

Never put a database password, OAuth client secret, secret/service-role key in `EXPO_PUBLIC_*`, EAS app config, or Git. The public Mapbox runtime token belongs in `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`; never place a secret Mapbox download token in public configuration.

## Email and Google Auth

1. Enable email/password in Supabase Auth and choose the desired email-confirmation behavior.
2. In Google Cloud Console, create an OAuth **Web application** client.
3. In Supabase **Authentication → Providers → Google**, enable Google and enter its client ID and secret. The secret belongs only in Supabase.
4. Add the exact Supabase callback displayed there to Google's authorized redirect URIs (normally `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`).
5. In Supabase **Authentication → URL Configuration**, allow `conquest://auth/callback`.

The app uses PKCE through Supabase `signInWithOAuth`, the system authentication browser, and Supabase's authorization-code exchange. The provider abstraction can add Apple later; V1 intentionally has no Apple button.

## Edge Function

```sh
supabase functions deploy complete-activity
```

JWT verification remains enabled. Hosted Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; never expose the latter in the app. The function verifies the JWT with `auth.getUser()`, derives the user (ignoring body `user_id`), validates/recomputes the route, and calls one service-role-only transaction.

```sh
curl -i -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/complete-activity" -H 'content-type: application/json' -d '{}'
```

The unauthenticated request must return `401`. An identical authenticated `clientActivityId` retry must return the existing result without another award.

## Android build and manual validation

AsyncStorage, WebBrowser, and AuthSession are new native dependencies. **Rebuild the Android Development Build**; Expo Go is not an adequate test target for RUQEST background location.

```sh
npm install
npx expo-doctor
eas build --profile development --platform android
```

On physical Android hardware:

1. Account A signs in with Google, completes a real Walking session, and locks/switches the app during tracking.
2. Confirm the result appears from SQLite immediately, including when offline.
3. Restore connectivity/foreground. Confirm a private SRID-4326 `activities.route`, impact/ledger rows, progression updates, and persistent Home influence.
4. Retry the same activity and confirm no second award.
5. Account B on another account/device sees aggregate shared territory state but cannot select Account A's activity or route.
6. With Account A's client JWT, direct updates to progression/influence/ledger must fail.

## Privacy, checks, and limitations

Only accepted route points upload; rejected/raw GPS samples remain local. Exact routes are owner-only. The snapshot RPC returns aggregate world fields and never routes, email, or auth metadata. `anon` and `authenticated` cannot execute the privileged transaction.

V1 rejects malformed coordinates/times, unreasonable accuracy, oversized routes, non-monotonic samples, teleport/hard-speed violations, and duplicate awards. It prevents basic payload tampering but **does not prove device GPS is genuine**. Future hardening may include Play Integrity, App Attest/DeviceCheck, rate limits, anomaly detection, and server risk scoring.

With Docker and Supabase CLI available:

```sh
supabase start
supabase db reset
supabase db lint
npm test
```

Use separate users/JWTs to test RLS. Force invalid impact data and confirm the transaction leaves no activity, influence, ledger, or progression partial write.

## PLAYER IDENTITY V1

The `202609190001_player_identity_v1.sql` migration is additive and intentionally leaves every existing profile with `onboarding_completed = false`, so existing test accounts experience player creation once. It backfills a conservative privacy row for each profile and does not reset authentication, progression, activities, routes, influence, or territories.

### Apply and verify in Supabase Web

1. Open **SQL Editor**, paste the new migration, and choose **Run** once (or apply it with `supabase db push`). Review the resulting `profiles` columns, `profile_privacy`, and `friendships` tables in **Table Editor**.
2. Open **Storage → Buckets** and verify the migration created the public `avatars` bucket with a 5 MB limit and JPEG, PNG, and WebP MIME allow-list. Public reads are intentional because an avatar is minimum game identity. In **Storage → Policies → objects**, verify insert/update/delete require bucket `avatars` and the first path segment to equal `auth.uid()` (for example `<user-id>/avatar.jpg`).
3. In **Database → Functions**, verify authenticated execution and no anon execution for `complete_player_onboarding`, `update_player_profile`, `is_username_available`, `get_player_profile`, `search_players`, and the four friendship functions. The onboarding function derives identity only from `auth.uid()` and commits profile/privacy/completion atomically.
4. In **Authentication → Policies**, verify raw `profiles` and `profile_privacy` SELECT/UPDATE remain owner-only and `friendships` has no direct client privileges. Safe cross-player reads must use the definer RPCs.
5. Test with accounts A and B: complete onboarding with unique names; confirm a simultaneous duplicate username loses cleanly; search by three or more username/display-name characters; test public, friends, and private visibility; accept and block relationships; verify hidden stats return `NULL`.
6. As account B, attempt direct updates to A's profile/privacy and an upload under `A_UUID/avatar.jpg`; all must fail. Inspect the profile/search RPC response shapes and confirm they contain no email, auth metadata, activity rows, geometry, or exact route.

Avatar bytes can already be stored securely by the backend, and Google avatar URLs are retained. The current JavaScript dependency set has no media-library picker. Adding local gallery selection later requires the Expo-compatible `expo-image-picker` native package and a fresh Development Build; no heavy image-processing dependency was added solely for cosmetics.

## SOCIAL V1

`202609190002_social_v1.sql` extends the existing `friendships` table without dropping or recreating it. It preserves the normalized unordered-pair unique index, adds lookup indexes, keeps direct friendship access revoked, and replaces the early friendship functions with caller-derived state transitions. The app never sends an actor/requester identity: every function uses `auth.uid()`.

### Supabase Dashboard verification

After applying the migration with **SQL Editor** or `supabase db push`:

1. In **Table Editor → friendships**, verify `pending`, `accepted`, and `blocked` remain the allowed statuses and the self-pair check remains. Existing rows must still be present.
2. In **Database → Indexes**, verify `friendships_pair_unique`, `friendships_pending_addressee_idx`, and `friendships_status_participants_idx`. The pair index must use `least(requester_id, addressee_id)` and `greatest(...)`, preventing A→B and B→A duplicates.
3. In **Authentication → Policies**, verify RLS is enabled on `friendships`. In **Database → Roles/Privileges**, verify `anon` and `authenticated` have no direct table privileges; social reads and mutations are RPC-only.
4. In **Database → Functions**, verify authenticated-only execution for `send_friend_request`, `accept_friend_request`, `decline_friend_request`, `cancel_friend_request`, `remove_friend`, `block_player`, `unblock_player`, `get_relationship`, `search_players`, `get_my_social_list`, `get_my_social_counts`, `get_blocked_players`, and `get_player_profile`.
5. Confirm the search function returns at most 20 rows, rejects queries shorter than three characters, searches only username/display name, omits blocked pairs, and exposes no email, phone, OAuth metadata, activities, coordinates, or routes.
6. Confirm `get_player_profile` leaves username/display name/avatar as minimum identity, requires an accepted friendship for friends-only fields, never treats pending as friendship, respects every field toggle, sanitizes a block created by the other user as `restricted`, and returns aggregates—not activity rows or geometry.
7. With a JWT for Account A, try accepting a request addressed to Account B, cancelling B's outgoing request, and removing an unrelated friendship. Each must fail. Direct `insert`, `update`, `delete`, or broad `select` against `friendships` must also fail.

### Exact two-account validation

1. **Account A:** search Account B. Confirm B appears with only privacy-safe identity, tap **ADD**, and confirm the state becomes **REQUESTED**.
2. **Account B:** open **Profile → Friends → Requests**. Confirm the incoming request appears, then accept it.
3. **Account A:** reopen Friends (or foreground the app), confirm B is in the roster, open B, and confirm friends-level fields appear only according to B's visibility switches.
4. **Account B:** change profile visibility to **PRIVATE**. **Account A:** reopen B and confirm only minimum private-profile identity remains.
5. **Account A:** block B. Confirm the friendship is no longer active, B disappears from A's ordinary search, B cannot send a new request, and friends-level fields are no longer exposed. In the blocked-player management RPC, confirm only A's own blocks are listed; unblock B and confirm the relationship returns to none.
6. Throughout the flow, inspect Network responses and confirm exact routes, route coordinates, start/end locations, email addresses, OAuth metadata, and precise live location never appear.

Run database-backed RLS validation against a local Supabase stack or staging project with separate A, B, and unrelated C JWTs. The source tests validate migration invariants but are not a substitute for executing PostgreSQL/RLS integration tests.

SOCIAL V1 adds only TypeScript/Expo Router UI and SQL; it adds no native dependency. An Android Development Build does **not** need to be rebuilt solely for this milestone. Apply the database migration before using the screen.

## REAL DATA V1 — Supabase Web Dashboard

1. Open **SQL Editor → New query**, paste `supabase/migrations/202609190003_real_data_v1.sql`, review it, and click **Run** once. Do not edit older applied migrations.
2. In **Table Editor → game_pois**, confirm RLS is enabled and the only player policy is authenticated SELECT of active rows. There must be no authenticated INSERT/UPDATE/DELETE policy.
3. Add an Arena in SQL Editor (replace the example with a real verified coordinate):
   ```sql
   insert into public.game_pois(type,name,location,enter_radius_meters,exit_radius_meters)
   values ('arena','Verified Arena',extensions.st_setsrid(extensions.st_makepoint(-46.6333,-23.5505),4326),75,100);
   ```
4. Add a Training Ground similarly, changing `type` to `training_ground`, its real name and longitude/latitude. `ST_MakePoint` takes **longitude first**.
5. Test as an authenticated user: `select * from get_nearby_game_pois(-23.5505,-46.6333,2000);`. Confirm inactive rows are absent and invalid/over-20-km radii return no rows.
6. Run `select * from get_my_weekly_summary();`; compare counts and distance with accepted rows in `activities` for the authenticated user and current UTC/database week.
7. Obtain visible territory IDs, then run `select * from get_territory_snapshot(array['territory-id']);`. Confirm owner is the highest influence row, control is owner/total, and only safe identity is returned.
8. In **Table Editor → activities**, filter by your user ID and client activity ID. Confirm one accepted row after retrying the same activity (idempotency), then inspect `activity_territory_impacts` without exposing route data to other players.
9. In **Authentication → Policies**, verify anonymous access is absent for these APIs and use a non-admin test account for all client checks.

## TERRITORY ENGINE V2 — Supabase Web Dashboard first

Territory V2 is additive. Apply `supabase/migrations/202609190004_territory_engine_v2.sql` **after** Real Data V1. It preserves every activity, profile, friendship, atomic territory ID, influence row, and progression value.

### Apply and inspect

1. In **SQL Editor → New query**, paste the V2 migration, review it, and select **Run** once. Do not edit an older migration in an already provisioned project.
2. In **Database → Functions**, inspect `get_world_regions(west, south, east, north)` and the replaced `get_territory_snapshot(territory_ids)`. Both are authenticated-only. `get_world_regions` rejects invalid boxes and boxes wider or taller than 0.25 degrees.
3. In **Table Editor → territory_influence**, filter by a territory ID. These are authoritative integer points: 100 accepted metres produce one point. Inspect owner calculation with:
   ```sql
   select ti.territory_id, ti.user_id, p.display_name, ti.influence_points,
          dense_rank() over(partition by ti.territory_id order by ti.influence_points desc) as influence_rank
   from public.territory_influence ti join public.profiles p on p.id=ti.user_id
   where ti.territory_id='local-Q-R' order by ti.influence_points desc;
   ```
   One highest scorer is the current influence-leader owner. Equal highest scores are contested and return no owner. This is not permanent battle capture.
4. Verify geometry and indexes in SQL Editor:
   ```sql
   select id, extensions.st_geometrytype(geometry), extensions.st_isvalid(geometry) from public.territories limit 20;
   select indexname, indexdef from pg_indexes where tablename='territories';
   ```
   Expect GiST indexes on both `geometry` and `center`.
5. With an authenticated SQL/JWT context, test a local viewport:
   ```sql
   select * from public.get_world_regions(-46.66,-23.58,-46.61,-23.53);
   ```
   Expected fields are only `region_id`, safe owner ID/display name, Polygon/MultiPolygon `geometry`, aggregate influence values, exact control ratio, cell count, and caller-relative status. There is no email, auth metadata, GPS, friendship state, or activity route.
6. Inspect the organic pipeline in the migration: authoritative atomic polygons are spatially filtered, collected/unary-unioned, conservatively closed with +18/-18 metre buffers in EPSG:3857, repaired, validated, topology-preserving simplified, and returned as MultiPolygon-capable GeoJSON. Metric route distance remains computed geodesically; the completion validator subdivides accepted long segments before atomic assignment rather than assigning a whole crossing segment to one midpoint.

### Contested and privacy test with two users

1. **Account A** completes and syncs a real outdoor activity in an untouched area. Confirm `activities`, `activity_territory_impacts`, and `territory_influence` contain one authoritative award. Home should show a soft organic green region, never production cell boundaries.
2. **Account B** opens the same viewport. B sees A's aggregate region as a stable rival color but cannot retrieve A's activity or route. Inspect the world RPC response and verify its geometry is composed from `territories.geometry`, not `activities.route`.
3. B completes enough accepted activity in those cells. Query influence again. Below A, B sees contested (because B contributes but does not lead); above A, B becomes the sole influence leader; exactly equal top scores return `owner_user_id = null` and `status = contested` deterministically.
4. Compare `owner_influence / total_influence * 100` with `control_percentage`. Influence columns are points and must never be presented with `%`.
5. As B, attempt to select A's `activities`, call any territory endpoint looking for route/email fields, and inspect owner profile results under A's privacy settings. Exact route access must fail, and no territory response may contain it.
6. Retry A's same client activity ID and confirm no second ledger, impact, or influence award. Existing pre-V2 influence must appear without replaying old activities.

If the network is unavailable, the app reads a covering last-known viewport from SQLite and labels its source `cache`; with no cache it shows only the base map. It never synthesizes neutral territory or fictional ownership. The atomic debug overlay requires both a development bundle and `EXPO_PUBLIC_ENABLE_TERRITORY_GRID_DEBUG=true`.

CLI is optional: run `supabase db push`, then `supabase db lint` and database-backed RLS tests against a local stack. Source-level SQL tests do not replace executing PostGIS and RLS integration tests.

Map Engine V2 renders this unchanged Territory V2 data through `@rnmapbox/maps`. The native Mapbox dependency means a **new development build is required**; Expo Go is unsupported.

## INVENTORY + LOOT V1 — Supabase Web Dashboard first

Inventory V1 is an additive, server-authoritative collection system. **It intentionally does not backfill historical activities.** Only activities first finalized after this migration is deployed receive loot; retries of older activities return an empty loot list.

### Apply the database and function changes

1. In **SQL Editor → New query**, paste `supabase/migrations/202609190005_inventory_loot_v1.sql`, review it, and click **Run** once after the four earlier migrations. Never edit or replay an already-applied migration.
2. Deploy the updated function from a terminal with `supabase functions deploy complete-activity`. The app must not be tested for new rewards until both the migration and function are deployed.
3. In **Table Editor**, inspect `item_definitions`, `player_inventory`, and `loot_grants`. The catalog contains two production collectibles at each V1 rarity: Field Marker, Pathfinder Token, Verdant Compass, Border Sigil, Wayfinder Prism, Cartographer's Seal, Dominion Shard, Horizon Beacon, Crown of Routes, and Conqueror's Astrolabe. Descriptions are flavor only.
4. In **Authentication → Policies**, verify `item_definitions` exposes only active rows to authenticated users and `player_inventory` exposes only `auth.uid()` rows. `loot_grants` has no client SELECT or mutation policy. In **Database → Roles/Privileges**, verify authenticated users have no INSERT/UPDATE/DELETE on any of the three tables.
5. In **Database → Functions**, verify `get_my_inventory()` and `get_activity_loot(uuid)` are authenticated-only. The former accepts no user ID. The latter joins the activity owner to `auth.uid()`. The finalizer remains executable only by `service_role`.

### Inspect and validate authoritative data

Use Table Editor as an administrator, or SQL Editor with explicit filters:

```sql
select id,name,rarity,category,active from public.item_definitions order by rarity,name;
select * from public.player_inventory where user_id='ACCOUNT_A_UUID' order by last_acquired_at desc;
select * from public.loot_grants where user_id='ACCOUNT_A_UUID' order by created_at desc;
```

Do not expose the service-role key to the app. To test caller behavior, use the app or a REST client carrying an ordinary Account A JWT. As Account A, `rpc/get_my_inventory` must return only A. Direct attempts to insert a Legendary grant, increment `player_inventory.quantity`, deactivate/change an item definition, or insert a milestone must fail. Repeat with Account B and confirm B cannot select A's inventory; call `get_activity_loot` with A's activity ID and confirm B receives no rows.

### One-kilometre, idempotency, and manual app flow

1. Sign in as **Account A** and open Inventory. A new account shows **NO LOOT YET**.
2. Complete a real accepted Walking, Running, or Cycling activity over 1 km and under 2 km. When offline, Activity Result shows **COMMON — REWARD PENDING SYNC** and no item identity.
3. Restore connectivity and let the existing completion sync run. Activity Result must show exactly one real Common catalog item, unlocked at 1 km. Inventory must show that same item and quantity from `get_my_inventory()`.
4. Inspect `activities` and `loot_grants`. There must be one activity and one `(activity_id, 1000)` row. Re-submit the identical `client_activity_id`; the response must contain the same grant, `loot_grants` must remain one row, and inventory quantity must not change.
5. Complete a new outdoor activity over 3 km. Its result must contain exactly Common, Uncommon, and Rare grants at 1000, 2000, and 3000 metres. Exact server-distance boundaries are `>= 1000`, `>= 2000`, `>= 3000`, `>= 5000`, and `>= 10000`; over 10 km still produces only five grants.
6. Complete an indoor activity and verify it creates no distance loot. Deactivate a catalog item as an administrator, complete another qualifying activity, and verify that item is not selected for a new grant while any existing owned copy remains visible through `get_my_inventory()`.

For a concurrency check, submit the same authenticated completion request twice in parallel. The unique activity key and `unique(activity_id,milestone_meters)` ledger constraint are the database backstops: only one progression/influence update and one grant per crossed milestone may commit. Selection is stable server-side ordering by an MD5 of activity UUID, milestone, and candidate item ID; no client reward list or random choice is accepted.

### Cache, deployment, and build impact

Confirmed activity loot is added to the existing SQLite activity payload with a sync timestamp. Inventory RPC results are cached by authenticated owner in SQLite, refreshed when Inventory opens, after successful activity sync, and when the app returns to foreground after the cache becomes stale. Offline mode only reads that last-known snapshot and never mutates ownership.

This milestone uses the existing TypeScript, Supabase, Edge Function, and Expo SQLite dependencies. It adds **no native dependency**, so another Android/iOS Development Build is **not required**. A JavaScript update plus the SQL migration and Edge Function deployment is sufficient.
