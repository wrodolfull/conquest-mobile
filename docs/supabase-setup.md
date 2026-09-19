# Supabase backend setup

CONQUEST stores workouts locally first. Supabase supplies authentication and the authoritative persistent world; internet access is never required while GPS is recording.

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

Never put a database password, OAuth client secret, secret/service-role key in `EXPO_PUBLIC_*`, EAS app config, or Git. Preserve the separate `GOOGLE_MAPS_API_KEY` workflow.

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

AsyncStorage, WebBrowser, and AuthSession are new native dependencies. **Rebuild the Android Development Build**; Expo Go is not an adequate test target for CONQUEST background location.

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
