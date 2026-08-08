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
- **Payments**: Stripe Billing (subscriptions) via Stripe Checkout, synced
  by a Stripe webhook running as a Supabase Edge Function

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
7. ✅ **Settlements + Stripe billing** — two related but separate things:
   - *Subscriptions*: `PricingScreen` opens real Stripe Checkout; a
     `stripe-webhook` Edge Function syncs the result into `subscriptions`.
   - *Settlements*: once a load is delivered (drivers can now advance a
     booked load through en_route → delivered from `LoadDetailScreen`),
     the load's poster records gross/deductions and the driver sees it on
     a real Earnings screen. This part has nothing to do with Stripe —
     it's an internal payout ledger, not a charge — see the schema notes
     below.
   Both need manual deploy/config steps — see "Stripe billing setup".
8. ✅ **Push notifications** — Expo push tokens registered per-device,
   in-app Notifications screen, and Postgres triggers that create
   notification rows for new offers/accepted offers/new messages. Actual
   push *delivery* needs a one-time manual deploy step — see "Push
   notifications setup" below.

All 5 tabs are now real. Beyond the handoff's suggested build order:

9. ✅ **Community** — a flat feed (post + read, no replies/likes/moderation,
   matching the prototype's own flat structure) backed by a new
   `community_posts` table that isn't in the handoff's data model at all —
   see the schema notes below.

## Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run every file in `supabase/migrations/` **in order**
   (they're numbered `0001`...`0011`). If you have the
   [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your
   project instead, `supabase db push` will apply them the same way — except
   `0009_push_webhook.sql`, which needs a manual edit first (see "Push
   notifications setup") before it'll run correctly.
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

## Stripe billing setup

Settlements (recording what a driver was paid) work with zero Stripe setup
— that's plain RLS-governed reads/writes on the `settlements` table, no
external service involved. The steps below are only for subscriptions
(`PricingScreen` → Stripe Checkout → `subscriptions` table).

1. **Create a Price per plan** in the Stripe dashboard (Products → add a
   recurring monthly price) for each of the app's 4 tiers: Driver,
   Dispatcher, Fleet, Broker. `PricingScreen` shows these 4 — not the
   prototype's 5, see the schema note below on why "Owner-Operator" isn't
   separately billable.
2. **Set Edge Function secrets** (from the repo root, with the Supabase CLI
   linked to your project):
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_...
   supabase secrets set STRIPE_PRICE_DRIVER=price_...
   supabase secrets set STRIPE_PRICE_DISPATCHER=price_...
   supabase secrets set STRIPE_PRICE_FLEET=price_...
   supabase secrets set STRIPE_PRICE_BROKER=price_...
   ```
3. **Deploy both functions**:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
   `create-checkout-session` keeps normal JWT verification (it's called
   from the signed-in app). `stripe-webhook` needs `--no-verify-jwt` for
   the same reason `send-push` does — Stripe calls it directly, with no
   Supabase user session to attach a JWT to. Here that's less of a
   tradeoff than for push: Stripe's own request signature (verified inside
   the function via `STRIPE_WEBHOOK_SECRET`) is the real authentication,
   not an afterthought.
4. **Add the webhook endpoint in Stripe**: Dashboard → Developers →
   Webhooks → add endpoint, URL
   `https://<project-ref>.functions.supabase.co/stripe-webhook`, subscribed
   to `checkout.session.completed`, `customer.subscription.updated`, and
   `customer.subscription.deleted`. Copy the signing secret it gives you:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

After that, subscribing in the app opens Stripe Checkout in the system
browser; on success Stripe redirects back to `gcsubhub-trucking://profile`
(the app's own URL scheme) and the webhook lands the real subscription row
moments later.

### Schema notes / assumptions made beyond the handoff doc

- `public.users` is keyed 1:1 to `auth.users` (`id` is a foreign key to
  `auth.users.id`), populated automatically by an `on_auth_user_created`
  trigger that reads `full_name`/`role` out of the sign-up metadata.
- `subscriptions.plan` reuses the `user_role` enum (driver/dispatcher/fleet/
  broker) rather than a separate free-text tier, since the prototype's
  pricing tiers map 1:1 to roles. That's also why `PricingScreen` shows 4
  tiers, not the prototype's 5 — "Owner-Operator" isn't a role, and adding
  a 5th enum value for one pricing tier felt like the wrong tradeoff versus
  just folding it out. `subscriptions.stripe_customer_id` (0010) also isn't
  in the handoff's model — a Stripe customer exists independently of any
  one subscription, and the webhook needs somewhere to record it.
- RLS is enabled on every table. `subscriptions` and `notifications` still
  have **no client insert/update policies** — written server-side only
  (the Stripe webhook, and `SECURITY DEFINER` Postgres triggers for
  notifications — see `create_notification()` in 0008), never from the
  app. `settlements` is the exception: 0010 gives a load's poster insert
  **and** select access scoped to their own loads (RLS didn't cover this
  at all before — recording a settlement is a plain in-app action, not a
  webhook, since it's an internal payout record rather than a real charge).
- `users.expo_push_token` (0007) isn't in the handoff's data model — added
  because something has to record which device to push to. One token per
  user; a sign-in on a new device just overwrites it.
- The prototype's load-board "Full only" filter chip isn't implemented — the
  handoff's `loads` schema has no full/partial field, so it was dropped
  rather than inventing a new column. Equipment-type and hazmat filters are
  implemented since those fields exist in the schema.
- `community_posts` (0011) has no equivalent anywhere in the handoff's data
  model — the prototype's Community tab was a flat, read-only mock feed
  with nothing backing it. Kept intentionally minimal to match: one table,
  no replies/likes/reporting. The prototype's ProfileScreen also had a
  "Report an issue or block a user" action with no real behavior behind
  it; that's still just a UI stub, not wired to anything real yet.

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
