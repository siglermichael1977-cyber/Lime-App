-- Linkup shows "No linkups posted yet": the 3 seeded events exist, but RLS on
-- public.events returns no rows to the app (guests and signed-in users alike).
-- Run in Supabase → SQL Editor. Safe to run more than once.

-- 1) Diagnose (optional): how many events exist, and what the live policies are.
select count(*) as events_total, count(*) filter (where starts_at >= now()) as upcoming from public.events;
select tablename, policyname, cmd, roles, qual from pg_policies
 where schemaname = 'public' and tablename in ('events', 'event_rsvps');

-- 2) Fix: make events and RSVPs readable by every signed-in session (guests are
--    anonymous sessions, which use the "authenticated" role).
begin;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

drop policy if exists "events readable" on public.events;
create policy "events readable" on public.events
  for select to authenticated using (true);

drop policy if exists "rsvps readable" on public.event_rsvps;
create policy "rsvps readable" on public.event_rsvps
  for select to authenticated using (true);

grant select on public.events, public.event_rsvps to authenticated;
commit;

-- 3) Verify: should return the 3 carnival events.
select title, starts_at from public.events order by starts_at;
