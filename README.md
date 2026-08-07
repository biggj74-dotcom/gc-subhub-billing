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
  Supabase-backed server state (loads, offers, profile)
- **Backend**: Supabase (Postgres + Auth + Storage)

## Build status

Per the handoff doc's suggested build order, this repo currently implements:

1. ✅ **Auth + user profiles** — real Supabase Auth (email/password), role
   selection at signup (driver/dispatcher/fleet/broker), profile row
   auto-created via a Postgres trigger, session persisted on-device.
2. ✅ **Load board** — CRUD on `loads` (post a load, browse the open board
   with equipment/hazmat filters, "My Loads"), offer submission wired to
   `load_offers`.
3. ⬜ Offers + load detail refinements (accept/reject flow for dispatchers)
4. ⬜ Documents (upload UI → Supabase Storage `documents` bucket, already
   provisioned with RLS in `0004_storage.sql`)
5. ⬜ Tracking (GPS pings → `tracking_events`)
6. ⬜ Messaging (Supabase Realtime)
7. ⬜ Settlements + Stripe billing
8. ⬜ Push notifications

The Messages and Community tabs currently render a "Coming soon" placeholder
— the 5-tab shell (Home / Loads / Messages / Community / Profile) is wired up
per the prototype's validated IA, but only Home, Loads, and Profile have real
screens so far.

## Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in `supabase/migrations/` **in
   order** (`0001_schema.sql` → `0002_rls_policies.sql` →
   `0003_handle_new_user.sql` → `0004_storage.sql`). If you have the
   [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your
   project instead, `supabase db push` will apply them the same way.
3. In Project Settings → API, copy your Project URL and `anon` public key.
4. In `mobile/`, copy `.env.example` to `.env` and fill in those two values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

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
  the app.
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
