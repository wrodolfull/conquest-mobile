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
