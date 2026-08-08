-- Fires the send-push Edge Function whenever a notification is inserted,
-- so push delivery happens automatically for everything 0008's triggers
-- (and accept_load_offer()) already write to public.notifications.
--
-- MANUAL STEPS REQUIRED before this does anything (see README "Push
-- notifications setup"):
--   1. supabase functions deploy send-push --no-verify-jwt
--   2. Replace <project-ref> below with your actual project ref, then run
--      this migration (or edit-and-rerun it — it's not sensitive to run
--      twice by hand, but isn't idempotent if applied via `supabase db
--      push` a second time without dropping the trigger first).
--
-- --no-verify-jwt is required: this trigger can't attach a signed
-- user JWT (there's no logged-in user in a database trigger's context),
-- and Postgres trigger arguments are static literals baked into this
-- migration, not a place to put a real secret without committing it to
-- git. The tradeoff: the function URL, once known, can be POSTed to by
-- anyone. That's an acceptable MVP risk — the function only reads
-- `record.user_id`/title/body from the payload and looks up that user's
-- push token, so the worst case is unwanted push spam to one account, not
-- a data leak. Add your own shared-secret header check inside the
-- function before this matters for a real production launch.
create trigger on_notification_insert_send_push
  after insert on public.notifications
  for each row
  execute function supabase_functions.http_request(
    'https://<project-ref>.functions.supabase.co/send-push',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '5000'
  );
