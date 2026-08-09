-- Real moderation for the Community feed, replacing the prototype's
-- "Report an issue or block a user" button, which was (and until now
-- stayed) a UI stub with nothing behind it. None of this is in the
-- handoff's data model — there's no admin/moderator role anywhere in the
-- schema, so this is scoped to what users can do for themselves: report a
-- post (auto-hidden once enough people flag it) and block a user (their
-- posts disappear from your own feed). No admin review queue — building
-- one would mean inventing a role the schema doesn't have.

alter table public.community_posts add column hidden boolean not null default false;

create table public.community_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  reporter_id uuid not null references public.users (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

alter table public.community_post_reports enable row level security;

create policy "users report posts as themselves" on public.community_post_reports
  for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and not exists (select 1 from public.community_posts p where p.id = post_id and p.author_id = auth.uid())
  );

create policy "users read their own reports" on public.community_post_reports
  for select to authenticated using (reporter_id = auth.uid());

-- Auto-hides a post once 3 distinct people have reported it. SECURITY
-- DEFINER because reporters have no UPDATE policy on community_posts (nor
-- should they) — this is the one narrow, automatic exception.
create function public.check_post_report_threshold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_count int;
begin
  select count(distinct reporter_id) into v_report_count
  from public.community_post_reports
  where post_id = new.post_id;

  if v_report_count >= 3 then
    update public.community_posts set hidden = true where id = new.post_id;
  end if;

  return new;
end;
$$;

create trigger on_post_reported
  after insert on public.community_post_reports
  for each row execute procedure public.check_post_report_threshold();

create table public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users (id) on delete cascade,
  blocked_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id != blocked_id)
);

alter table public.user_blocks enable row level security;

create policy "users manage their own block list" on public.user_blocks
  for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

-- Replaces 0011's blanket "readable by authenticated" policy: still true
-- for your own posts (even hidden ones — you should be able to see what
-- happened to what you posted), but everyone else's posts are additionally
-- filtered by hidden status and your block list.
drop policy "community posts are readable by authenticated" on public.community_posts;

create policy "community posts are readable, minus hidden/blocked" on public.community_posts
  for select to authenticated
  using (
    author_id = auth.uid()
    or (
      not hidden
      and not exists (
        select 1 from public.user_blocks b where b.blocker_id = auth.uid() and b.blocked_id = author_id
      )
    )
  );
