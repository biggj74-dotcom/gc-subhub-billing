-- GCSubHub Trucking — core schema
-- Mirrors the data models in the technical handoff doc.

create extension if not exists "pgcrypto";

create type user_role as enum ('driver', 'dispatcher', 'fleet', 'broker');
create type truck_status as enum ('available', 'on_load', 'off_duty');
create type load_status as enum ('open', 'booked', 'en_route', 'delivered', 'cancelled');
create type offer_status as enum ('pending', 'accepted', 'rejected');
create type document_type as enum ('insurance', 'cdl', 'medical_card', 'rate_confirmation', 'other');
create type document_status as enum ('pending_review', 'verified', 'expiring', 'rejected');

-- One row per auth.users row (id is shared, 1:1). Created automatically by
-- the handle_new_user trigger in 0003_triggers.sql when someone signs up.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  phone text,
  full_name text,
  role user_role not null default 'driver',
  dot_number text,
  mc_number text,
  cdl_verified_at timestamptz,
  medical_card_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  fleet_owner_id uuid references public.users (id) on delete set null,
  truck_number text not null,
  status truck_status not null default 'available',
  current_driver_id uuid references public.users (id) on delete set null,
  last_location_lat double precision,
  last_location_lng double precision,
  updated_at timestamptz not null default now()
);

create table public.loads (
  id uuid primary key default gen_random_uuid(),
  posted_by_id uuid not null references public.users (id) on delete cascade,
  origin text not null,
  destination text not null,
  miles integer,
  rate numeric(10, 2),
  equipment_type text,
  weight text,
  pickup_date date,
  hazmat boolean not null default false,
  status load_status not null default 'open',
  assigned_driver_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.load_offers (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads (id) on delete cascade,
  driver_id uuid not null references public.users (id) on delete cascade,
  offered_rate numeric(10, 2) not null,
  status offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (load_id, driver_id)
);

-- Append-only: powers the tracking screen's stop history.
create table public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type document_type not null,
  file_url text not null,
  status document_status not null default 'pending_review',
  expires_at timestamptz,
  uploaded_at timestamptz not null default now()
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.users (id) on delete cascade,
  load_id uuid references public.loads (id) on delete set null,
  gross numeric(10, 2) not null,
  deductions numeric(10, 2) not null default 0,
  net numeric(10, 2) not null,
  paid_at timestamptz
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- plan reuses user_role since the prototype's pricing tiers map 1:1 to roles
-- (Driver / Owner-Operator / Dispatcher / Fleet / Broker-Shipper).
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan user_role not null,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index loads_status_idx on public.loads (status);
create index loads_posted_by_idx on public.loads (posted_by_id);
create index loads_assigned_driver_idx on public.loads (assigned_driver_id);
create index load_offers_load_idx on public.load_offers (load_id);
create index load_offers_driver_idx on public.load_offers (driver_id);
create index tracking_events_load_idx on public.tracking_events (load_id);
create index documents_user_idx on public.documents (user_id);
create index settlements_driver_idx on public.settlements (driver_id);
create index messages_load_idx on public.messages (load_id);
create index notifications_user_idx on public.notifications (user_id, read);
