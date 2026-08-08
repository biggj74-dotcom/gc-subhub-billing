-- Community isn't in the handoff doc's data model at all — the prototype's
-- CommunityScreen is a flat, read-only mock feed with no backing table.
-- This is the minimal shape that supports it: no replies, no likes, no
-- moderation tooling, matching the prototype's own flat structure.
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index community_posts_created_at_idx on public.community_posts (created_at desc);

alter table public.community_posts enable row level security;

create policy "community posts are readable by authenticated" on public.community_posts
  for select to authenticated using (true);

create policy "users post as themselves" on public.community_posts
  for insert to authenticated with check (auth.uid() = author_id);

create policy "users delete their own posts" on public.community_posts
  for delete to authenticated using (auth.uid() = author_id);
