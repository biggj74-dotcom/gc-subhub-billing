-- Stripe Billing support. Not in the handoff's data model: a Stripe
-- customer exists independently of any one subscription, and the webhook
-- needs somewhere to record it.
alter table public.subscriptions add column stripe_customer_id text;

-- One current subscription record per user, updated in place across its
-- lifecycle (created -> updated -> canceled) rather than a new row per
-- Stripe event — matches how a Stripe subscription object itself behaves.
alter table public.subscriptions add constraint subscriptions_user_id_key unique (user_id);

-- Lets a load's poster record what a driver was paid once a load is
-- delivered. Settlements otherwise stay server-write-only per 0002 (no
-- policy at all covered this insert before); this is deliberately narrow:
-- only for the poster's own load, and only for the driver actually
-- assigned to it.
create policy "poster records settlement for their load" on public.settlements
  for insert to authenticated
  with check (
    exists (
      select 1 from public.loads l
      where l.id = load_id and l.posted_by_id = auth.uid() and l.assigned_driver_id = driver_id
    )
  );

-- Without this, the poster who just recorded a settlement couldn't read it
-- back (0002's "driver reads own settlements" only covers the driver).
create policy "poster reads settlements for their loads" on public.settlements
  for select to authenticated
  using (exists (select 1 from public.loads l where l.id = load_id and l.posted_by_id = auth.uid()));
