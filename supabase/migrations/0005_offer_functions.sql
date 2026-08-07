-- Accepting an offer is a multi-table operation (offer -> accepted, load ->
-- booked to that driver, every other pending offer on the load -> rejected)
-- that needs to happen atomically, so it's a function rather than several
-- sequential client-side writes.
--
-- SECURITY INVOKER (the default, stated explicitly here) means this runs as
-- the calling user and is still subject to every RLS policy above — it's a
-- convenience wrapper for atomicity, not a privilege escalation. The
-- existing "poster updates offer status" and "poster or assigned driver
-- update load" policies are what actually authorize the two updates below.
create function public.accept_load_offer(p_offer_id uuid)
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

  return v_load;
end;
$$;

grant execute on function public.accept_load_offer(uuid) to authenticated;
