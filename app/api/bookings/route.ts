/**
 * API Route: POST /api/bookings
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Creates a new booking request.
 * - Validates input
 * - Checks room exists
 * - Writes via BookingRepository (always starts 'pending')
 * - DB trigger fires automatically → notification queued → email sent
 *
 * No explicit email call here — Observer pattern handles it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BookingRepository } from '@/lib/repositories/booking-repository';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const repo = new BookingRepository(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for server-side writes
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Input validation ────────────────────────────────────────────────
    const required = ['room_id', 'booker_name', 'booker_email', 'start_time', 'end_time', 'purpose', 'attendee_count'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    if (new Date(body.end_time) <= new Date(body.start_time)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    if (body.attendee_count < 1) {
      return NextResponse.json({ error: 'attendee_count must be at least 1' }, { status: 400 });
    }

    // ── Room validation ─────────────────────────────────────────────────
    const room = await repo.getRoomById(body.room_id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (body.attendee_count > room.capacity) {
      return NextResponse.json(
        { error: `Room capacity is ${room.capacity}. Please reduce your attendee count.` },
        { status: 400 }
      );
    }

    // ── Get authenticated user if logged in (optional) ──────────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();

    // ── Create booking ──────────────────────────────────────────────────
    const booking = await repo.createBooking({
      room_id: body.room_id,
      user_id: user?.id,
      booker_name: String(body.booker_name).trim(),
      booker_email: String(body.booker_email).trim().toLowerCase(),
      booker_phone: body.booker_phone ? String(body.booker_phone).trim() : undefined,
      start_time: body.start_time,
      end_time: body.end_time,
      purpose: String(body.purpose).trim(),
      attendee_count: Number(body.attendee_count),
      deposit_amount_pence: room.price_pence,
    });

    return NextResponse.json({ booking }, { status: 201 });

  } catch (err) {
    console.error('POST /api/bookings error:', err);
    return NextResponse.json(
      { error: 'Unable to submit booking. Please try again.' },
      { status: 500 }
    );
  }
}
