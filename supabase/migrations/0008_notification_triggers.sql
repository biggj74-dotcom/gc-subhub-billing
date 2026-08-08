-- Populates public.notifications automatically from the actions already
-- built (new offer, accepted offer, new message), so the in-app
-- Notifications screen has real data even before push delivery is wired
-- up (see 0009_push_webhook.sql).

-- Same reasoning as 0006 for messages: lets NotificationsScreen subscribe
-- to postgres_changes instead of polling.
alter publication supabase_realtime add table public.notifications;

--
-- The "user reads own notifications" policy from 0002 deliberately has no
-- matching INSERT policy — notification rows are meant to be written by
-- the system, not by whichever client happens to be online. create_notification()
-- is a narrow SECURITY DEFINER helper (it does nothing but this one insert)
-- that both the trigger functions below and accept_load_offer() use to write
-- into another user's notifications despite that missing policy, without
-- having to widen either caller's own privileges to do it.
create function public.create_notification(p_user_id uuid, p_type text, p_title text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body)
  values (p_user_id, p_type, p_title, p_body);
end;
$$;

grant execute on function public.create_notification(uuid, text, text, text) to authenticated;

create function public.notify_new_offer()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_poster_id uuid;
  v_load_ref text;
begin
  select posted_by_id, origin || ' -> ' || destination
  into v_poster_id, v_load_ref
  from public.loads
  where id = new.load_id;

  if v_poster_id is null then
    return new;
  end if;

  perform public.create_notification(
    v_poster_id,
    'new_offer',
    'New offer received',
    'New offer of $' || new.offered_rate || ' on ' || v_load_ref || '.'
  );

  return new;
end;
$$;

create trigger on_offer_created
  after insert on public.load_offers
  for each row execute procedure public.notify_new_offer();

create function public.notify_new_message()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_recipient_id uuid;
begin
  select case when posted_by_id = new.sender_id then assigned_driver_id else posted_by_id end
  into v_recipient_id
  from public.loads
  where id = new.load_id;

  if v_recipient_id is null then
    return new;
  end if;

  perform public.create_notification(v_recipient_id, 'new_message', 'New message', left(new.body, 120));

  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute procedure public.notify_new_message();

-- Redefines accept_load_offer() from 0005 to also notify the driver whose
-- offer just got accepted. Same body as before, plus the notification insert.
create or replace function public.accept_load_offer(p_offer_id uuid)
returns public.loads
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_load_id uuid;
  v_driver_id uuid;
  v_load public.loads;
begin
  select load_id, driver_id into v_load_id, v_driver_id
  from public.load_offers
  where id = p_offer_id and status = 'pending';

  if v_load_id is null then
    raise exception 'Offer % not found or is no longer pending', p_offer_id;
  end if;

  update public.load_offers
  set status = 'accepted'
  where id = p_offer_id;

  update public.load_offers
  set status = 'rejected'
  where load_id = v_load_id and id != p_offer_id and status = 'pending';

  update public.loads
  set status = 'booked', assigned_driver_id = v_driver_id
  where id = v_load_id
  returning * into v_load;

  perform public.create_notification(
    v_driver_id,
    'offer_accepted',
    'Offer accepted',
    'Your offer on ' || v_load.origin || ' -> ' || v_load.destination || ' was accepted.'
  );

  return v_load;
end;
$$;
