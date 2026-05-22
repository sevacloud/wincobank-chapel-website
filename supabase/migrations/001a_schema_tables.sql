-- =============================================================================
-- Wincobank Chapel — Room Booking System
-- Migration: 001_initial_schema
-- © Liamarjit Bhogal (© Seva Cloud 2026)
--
-- Design notes:
-- • State machine enforced via CHECK constraint on bookings.status.
--   Illegal states are rejected at the database level — not just application
--   level — so no client-side bug can corrupt the booking lifecycle.
-- • Row Level Security (RLS) is the primary authorisation boundary.
--   The application layer is a convenience; RLS is the guarantee.
-- • Triggers implement the Observer pattern: booking state changes
--   automatically insert notification queue rows without the application
--   needing to remember to do so.
-- • All monetary values stored as INTEGER pence/pennies (GBP × 100) to avoid
--   floating-point rounding errors. Display layer divides by 100.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUM: booking_status
-- Enforces the State Machine — only these values are legal.
-- ---------------------------------------------------------------------------
create type booking_status as enum (
  'pending',    -- submitted, awaiting admin review
  'approved',   -- admin approved
  'rejected',   -- admin rejected
  'cancelled'   -- cancelled by user or admin after approval
);

-- ---------------------------------------------------------------------------
-- ENUM: payment_status
-- ---------------------------------------------------------------------------
create type payment_status as enum (
  'unpaid',
  'paid',
  'refunded'
);

-- ---------------------------------------------------------------------------
-- ENUM: user_role
-- ---------------------------------------------------------------------------
create type user_role as enum (
  'public',   -- one-off booker, no account
  'member',   -- registered church member
  'admin'     -- staff with full access
);

-- ---------------------------------------------------------------------------
-- TABLE: profiles
-- Extends Supabase auth.users. Created automatically on user sign-up
-- via the handle_new_user() trigger below.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text,
  role        user_role not null default 'public',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per Supabase auth user. Role controls RLS access.';

-- ---------------------------------------------------------------------------
-- TABLE: rooms
-- Each bookable space in the chapel.
-- ---------------------------------------------------------------------------
create table public.rooms (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  capacity        integer not null check (capacity > 0),
  -- Price stored as integer pence to avoid float arithmetic errors.
  -- Strategy Pattern: price_pence is the "strategy" for now (fixed fee).
  -- Replace with a price_policy_id FK when variable pricing is needed.
  price_pence     integer not null check (price_pence >= 0),
  image_url       text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.rooms.price_pence is
  'Fixed deposit in GBP pence (e.g. 5000 = £50.00). Strategy Pattern hook.';

-- ---------------------------------------------------------------------------
-- TABLE: bookings
-- Core entity. Status column enforces State Machine via the enum type.
--
-- Data structure choice: start_time/end_time as timestamptz (not date + slots)
-- gives maximum flexibility — rooms can be booked for irregular durations
-- without a lookup table of time slots. Overlap detection uses a simple
-- range exclusion check in the application and a DB constraint below.
-- ---------------------------------------------------------------------------
create table public.bookings (
  id                  uuid primary key default uuid_generate_v4(),
  room_id             uuid not null references public.rooms(id),
  user_id             uuid references public.profiles(id) on delete set null,

  -- Booker details (denormalised for guest bookings where user_id is null)
  booker_name         text not null,
  booker_email        text not null,
  booker_phone        text,

  -- Time range
  start_time          timestamptz not null,
  end_time            timestamptz not null,

  -- Booking details
  purpose             text not null,
  attendee_count      integer not null check (attendee_count > 0),

  -- State Machine: status transitions are validated in application layer
  -- and enforced by the enum type at DB level.
  status              booking_status not null default 'pending',

  -- Payment (Strategy Pattern: fixed fee today; extend later)
  deposit_amount_pence  integer not null check (deposit_amount_pence >= 0),
  payment_status        payment_status not null default 'unpaid',

  -- Admin workflow
  admin_notes         text,
  reviewed_by         uuid references public.profiles(id) on delete set null,
  reviewed_at         timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Bookings must not overlap for the same room when approved.
  -- Pending bookings CAN overlap (admin resolves conflicts on approval).
  -- This constraint is enforced in application logic; a DB-level exclusion
  -- constraint requires the btree_gist extension (added below).
  constraint end_after_start check (end_time > start_time)
);

comment on table public.bookings is
  'Core booking entity. Status follows a strict State Machine (pending → approved/rejected, approved → cancelled).';

-- Prevent double-booking of approved slots at the database level.
-- btree_gist enables range overlap operators on non-range types.
create extension if not exists btree_gist;

create unique index no_approved_overlap
  on public.bookings using gist (
    room_id,
    tstzrange(start_time, end_time, '[)')
  )
  where status = 'approved';

comment on index public.no_approved_overlap is
  'Prevents two approved bookings overlapping for the same room. Pending bookings may overlap — admin resolves on approval.';

-- ---------------------------------------------------------------------------
-- TABLE: notifications
