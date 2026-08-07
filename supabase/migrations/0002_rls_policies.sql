-- Row Level Security. Every table is readable/writable only through these
-- policies when queried with the anon/authenticated client key — the
-- service_role key (server-side only, e.g. Stripe webhooks) bypasses RLS
-- entirely, which is intentional for settlements/subscriptions/notifications.

alter table public.users enable row level security;
alter table public.trucks enable row level security;
alter table public.loads enable row level security;
alter table public.load_offers enable row level security;
alter table public.tracking_events enable row level security;
alter table public.documents enable row level security;
alter table public.settlements enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

-- users: profiles are readable by any signed-in user (needed to show
-- poster/driver names on loads, offers, fleet overview, messages), but only
-- editable by their owner.
create policy "users are readable by authenticated" on public.users
  for select to authenticated using (true);

create policy "users can update own profile" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- trucks: visible to any signed-in user (fleet overview), managed by the
-- fleet owner.
create policy "trucks are readable by authenticated" on public.trucks
  for select to authenticated using (true);

create policy "fleet owners manage their trucks" on public.trucks
  for all to authenticated
  using (auth.uid() = fleet_owner_id)
  with check (auth.uid() = fleet_owner_id);

-- loads: the board is browsable by any signed-in user; only
-- dispatcher/fleet/broker roles can post, only the poster or the assigned
-- driver can update (e.g. status changes as a load moves).
create policy "loads are readable by authenticated" on public.loads
  for select to authenticated using (true);

create policy "dispatchers post loads" on public.loads
  for insert to authenticated
  with check (
    auth.uid() = posted_by_id
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('dispatcher', 'fleet', 'broker')
    )
  );

create policy "poster or assigned driver update load" on public.loads
  for update to authenticated
  using (auth.uid() = posted_by_id or auth.uid() = assigned_driver_id)
  with check (auth.uid() = posted_by_id or auth.uid() = assigned_driver_id);

create policy "poster deletes own load" on public.loads
  for delete to authenticated using (auth.uid() = posted_by_id);

-- load_offers: a driver sees/creates their own offers; the load's poster
-- sees every offer on their load and updates status (accept/reject).
create policy "driver reads own offers" on public.load_offers
  for select to authenticated
  using (
    auth.uid() = driver_id
    or exists (select 1 from public.loads l where l.id = load_id and l.posted_by_id = auth.uid())
  );

create policy "drivers submit offers" on public.load_offers
  for insert to authenticated
  with check (
    auth.uid() = driver_id
    and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'driver')
  );

create policy "poster updates offer status" on public.load_offers
  for update to authenticated
  using (exists (select 1 from public.loads l where l.id = load_id and l.posted_by_id = auth.uid()))
  with check (exists (select 1 from public.loads l where l.id = load_id and l.posted_by_id = auth.uid()));

create policy "driver withdraws pending offer" on public.load_offers
  for delete to authenticated using (auth.uid() = driver_id and status = 'pending');

-- tracking_events: append-only log visible to the load's poster and
-- assigned driver; only the assigned driver writes pings.
create policy "load participants read tracking" on public.tracking_events
  for select to authenticated
  using (
    exists (
      select 1 from public.loads l
      where l.id = load_id and (l.posted_by_id = auth.uid() or l.assigned_driver_id = auth.uid())
    )
  );

create policy "assigned driver writes tracking" on public.tracking_events
  for insert to authenticated
  with check (
    exists (select 1 from public.loads l where l.id = load_id and l.assigned_driver_id = auth.uid())
  );

-- documents: private to the uploading user.
create policy "users manage own documents" on public.documents
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- settlements: drivers can read their own; writes are server-side only
-- (payroll/settlement runs via service_role), so no insert/update policy.
create policy "driver reads own settlements" on public.settlements
  for select to authenticated using (auth.uid() = driver_id);

-- messages: visible to the load's poster and assigned driver; either can post.
create policy "load participants read messages" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.loads l
      where l.id = load_id and (l.posted_by_id = auth.uid() or l.assigned_driver_id = auth.uid())
    )
  );

create policy "load participants send messages" on public.messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.loads l
      where l.id = load_id and (l.posted_by_id = auth.uid() or l.assigned_driver_id = auth.uid())
    )
  );

-- subscriptions: readable by the owner; writes are server-side only (Stripe
-- webhook using service_role), so no insert/update policy.
create policy "user reads own subscription" on public.subscriptions
  for select to authenticated using (auth.uid() = user_id);

-- notifications: readable by the owner, who may also mark them read;
-- creation is server-side only (triggers/service_role).
create policy "user reads own notifications" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

create policy "user marks own notifications read" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
