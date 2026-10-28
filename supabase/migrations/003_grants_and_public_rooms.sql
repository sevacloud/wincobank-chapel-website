-- =============================================================================
-- Wincobank Chapel — Table privileges + public room listing
-- Migration: 003_grants_and_public_rooms
-- © Liamarjit Bhogal (© Seva Cloud 2026)
--
-- Run AFTER 002_contact_messages.sql. Safe to re-run.
--
-- Why: this project does not grant table privileges to Supabase's API roles
-- by default, so every PostgREST call — even with the service-role key —
-- failed with "permission denied for table …". This grants:
--   • service_role (server-side API routes only): full access to app tables.
--     It bypasses RLS, so this restores what the server code already expects.
--   • anon / authenticated (the public website): read-only access to ACTIVE
--     rooms, enforced by RLS. Nothing else is exposed to the public.
-- No data is changed.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Server-side access (API routes using SUPABASE_SERVICE_ROLE_KEY).
grant select, insert, update, delete
  on public.rooms, public.bookings, public.profiles, public.notifications, public.contact_messages
  to service_role;

-- Public room listing on /rooms.
alter table public.rooms enable row level security;

grant select on public.rooms to anon, authenticated;

drop policy if exists "Active rooms are publicly readable" on public.rooms;
create policy "Active rooms are publicly readable"
  on public.rooms
  for select
  to anon, authenticated
  using (is_active);
