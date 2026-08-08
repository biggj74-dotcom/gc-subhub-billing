-- Not in the handoff doc's data model — needed to know which device to
-- push a notification to. One token per user; a fresh sign-in on a new
-- device just overwrites it (fine for MVP; a users-can-have-many-devices
-- model would need a separate table).
alter table public.users add column expo_push_token text;
