-- =============================================================================
-- Wincobank Chapel — Contact Messages
-- Migration: 002_contact_messages
-- © Liamarjit Bhogal (© Seva Cloud 2026)
--
-- Stores submissions from the public contact form (/api/contact).
-- The API route writes using the service-role key, which bypasses RLS.
-- RLS is enabled with no public policies so the table is not readable or
-- writable by the anon/public key — only the server (service role) and
-- admins can access it.
-- =============================================================================

create extension if not exists "uuid-ossp";

create table public.contact_messages (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  phone       text,
  subject     text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

comment on table public.contact_messages is
  'Public contact form submissions. Written server-side via service role.';

-- Enable RLS. No public policies = anon key cannot read or write.
alter table public.contact_messages enable row level security;

-- Allow admins to read messages (for a future admin inbox view).
create policy "Admins can read contact messages"
  on public.contact_messages
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Helpful index for sorting the newest messages first.
create index contact_messages_created_at_idx
  on public.contact_messages (created_at desc);
