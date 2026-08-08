# GCSubHub Trucking

Load-board / fleet-management app for truck drivers, dispatchers, brokers, and
fleets. This repo contains the React Native (Expo) mobile app and the
Supabase backend schema, built from a validated React prototype and technical
handoff doc.

## Repo layout

```
mobile/      Expo (React Native + TypeScript) app
supabase/    SQL migrations for the Postgres schema, RLS policies, and storage
```

## Stack

- **App**: Expo (React Native, TypeScript)
- **Navigation**: React Navigation (bottom tabs + native-stack per tab)
- **Styling**: NativeWind (Tailwind for RN) for layout/spacing, plus the
  ported `C` / `display` / `body` / `mono` design tokens (`mobile/src/theme/tokens.ts`)
  applied via `style` for colors and fonts — same hybrid pattern the
  prototype used.
- **State**: Zustand for auth/session/language; TanStack Query for all
  Supabase-backed server state (loads, offers, profile), refreshed live
  where it matters via Supabase Realtime (`messages`, `notifications`)
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + Edge
  Functions)
- **Location**: expo-location (foreground-only) for tracking check-ins
- **Push**: expo-notifications, delivered via a Supabase Edge Function

## Build status

Per the handoff doc's suggested build order, this repo currently implements:

1. ✅ **Auth + user profiles** — real Supabase Auth (email/password), role
   selection at signup (driver/dispatcher/fleet/broker), profile row
   auto-created via a Postgres trigger, session persisted on-device.
2. ✅ **Load board** — CRUD on `loads` (post a load, browse the open board
   with equipment/hazmat filters, "My Loads"), offer submission wired to
   `load_offers`.
3. ✅ **Offers + load detail** — the load's poster sees every offer with
   Accept/Reject; accepting books the load to that driver and auto-rejects
   the rest via `accept_load_offer()`.
4. ✅ **Documents** — upload UI on a dedicated Documents screen (off
   Profile), files go to the `documents` Storage bucket, rows to the
   `documents` table.
5. ✅ **Tracking** — GPS check-ins (`tracking_events`) shown as a
   chronological timeline; no map view yet (see `TrackingScreen`'s header
   comment for the scope call).
6. ✅ **Messaging** — real-time per-load chat via Supabase Realtime.
7. ⬜ Settlements + Stripe billing — blocked on you having a Stripe account;
   also needs a webhook endpoint (Supabase Edge Function is the natural
   choice, same as push below) since a client-only Expo app can't host one.
8. ✅ **Push notifications** — Expo push tokens registered per-device,
   in-app Notifications screen, and Postgres triggers that create
   notification rows for new offers/accepted offers/new messages. Actual
   push *delivery* needs a one-time manual deploy step — see "Push
   notifications setup" below.

The Community tab still renders a "Coming soon" placeholder — the 5-tab
shell (Home / Loads / Messages / Community / Profile) is wired up per the
prototype's validated IA, but Community itself hasn't been built (it's not
in the handoff's suggested build order).

## Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run every file in `supabase/migrations/` **in order**
   (they're numbered `0001`...`0009`). If you have the
   [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your
   project instead, `supabase db push` will apply them the same way — except
   `0009_push_webhook.sql`, which needs a manual edit first (see below)
   before it'll run correctly.
3. In Project Settings → API, copy your Project URL and `anon` public key.
4. In `mobile/`, copy `.env.example` to `.env` and fill in those two values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Push notifications setup

Everything up through creating a `notifications` row happens automatically
(new offer, offer accepted, new message all trigger one). Actual push
*delivery* to a device needs three manual steps this repo can't do for you:

1. **Give the app an EAS project ID.** Push tokens are requested via
   `Notifications.getExpoPushTokenAsync({ projectId })`
   (`mobile/src/hooks/usePushRegistration.ts`), which needs an EAS project
   to exist. Run `eas init` in `mobile/` (or set
   `expo.extra.eas.projectId` in `app.json` yourself) — until then,
   registration fails silently and no token is saved, by design (there's
   nothing actionable to show the user in-app about it).
2. **Deploy the Edge Function**: `supabase functions deploy send-push
   --no-verify-jwt` from the repo root (needs the Supabase CLI logged in
   and linked to your project). `--no-verify-jwt` is required — a database
   trigger has no logged-in user to attach a JWT for. See the comment at
   the top of `supabase/functions/send-push/index.ts` and
   `supabase/migrations/0009_push_webhook.sql` for the security tradeoff
   that comes with that (short version: the function URL, once known, is
   callable by anyone; worst case is push spam to one account, not a data
   leak — harden it with a shared-secret header before a real launch).
3. **Point the trigger at your function**: edit
   `0009_push_webhook.sql`, replacing `<project-ref>` in the URL with your
   actual project ref, then run that migration (last, after the others).

Steps 1 and 2 only need to happen once per environment. Skipping all three
still leaves the in-app Notifications screen fully working — it's reading
real `notifications` rows either way, just without a push alert.

### Schema notes / assumptions made beyond the handoff doc

- `public.users` is keyed 1:1 to `auth.users` (`id` is a foreign key to
  `auth.users.id`), populated automatically by an `on_auth_user_created`
  trigger that reads `full_name`/`role` out of the sign-up metadata.
- `subscriptions.plan` reuses the `user_role` enum (driver/dispatcher/fleet/
  broker) rather than a separate free-text tier, since the prototype's
  pricing tiers map 1:1 to roles.
- RLS is enabled on every table. Notably: `settlements`, `subscriptions`, and
  `notifications` have **no client insert/update policies** — those are
  meant to be written server-side (Stripe webhooks, payroll runs, a
  notification-sending function) using the `service_role` key, never from
  the app. `notifications` rows are actually written by `SECURITY DEFINER`
  Postgres triggers now (0008), not a webhook — see `create_notification()`.
- `users.expo_push_token` (0007) isn't in the handoff's data model — added
  because something has to record which device to push to. One token per
  user; a sign-in on a new device just overwrites it.
- The prototype's load-board "Full only" filter chip isn't implemented — the
  handoff's `loads` schema has no full/partial field, so it was dropped
  rather than inventing a new column. Equipment-type and hazmat filters are
  implemented since those fields exist in the schema.

## Running the app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i`/`a` for a
simulator/emulator.

## Design system

Colors, typography, and the i18n `dict`/`makeL` pattern are ported directly
from the prototype:

- `mobile/src/theme/tokens.ts` — the `C` palette (charcoal/chrome/gold) and
  `display`/`body`/`mono` font tokens
- `mobile/src/i18n/dict.ts` — the bilingual (EN/ES) dictionary, extended with
  keys for the new auth screens
- `mobile/src/i18n/useLanguage.ts` — Zustand store + `useL()` hook wrapping
  `makeL()`, persisted on-device
- `mobile/src/components/TopBar.tsx`, `StatusPill.tsx` — ported 1:1 from the
  prototype's components of the same name
