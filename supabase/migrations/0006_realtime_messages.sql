-- Enables Supabase Realtime (postgres_changes) on messages so the
-- MessageThreadScreen can subscribe to new rows as they're inserted,
-- instead of polling. RLS still applies to realtime subscriptions, so a
-- client only receives INSERTs on rows its "load participants read
-- messages" policy already lets it select.
alter publication supabase_realtime add table public.messages;
