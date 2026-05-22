/**
 * API Route: PATCH /api/admin/bookings/[id]/status
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Transitions a booking status. Admin only.
 * State machine validation happens in BookingRepository.transitionStatus()
 * before any DB write. Observer (DB trigger) fires the email automatically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BookingRepository } from '@/lib/repositories/booking-repository';
import { canTransition, type BookingStatus } from '@/lib/state/booking-state-machine';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const repo = new BookingRepository(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Auth check: must be admin ───────────────────────────────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Parse and validate body ─────────────────────────────────────────
    const { status: newStatus, admin_notes } = await req.json();

    if (!newStatus) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    // ── Fetch current booking to validate transition ────────────────────
    const bookings = await repo.getAllBookings();
    const booking = bookings.find(b => b.id === id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // ── State Machine check (application layer guard) ───────────────────
    if (!canTransition(booking.status, newStatus as BookingStatus, 'admin')) {
      return NextResponse.json(
        { error: `Cannot transition from ${booking.status} to ${newStatus}` },
        { status: 422 }
      );
    }

    // ── Apply transition via repository ────────────────────────────────
    // DB trigger fires here → notification row inserted → Edge Function → email
    const updated = await repo.transitionStatus(
      id,
      booking.status,
      newStatus as BookingStatus,
      user.id,
      admin_notes
    );

    return NextResponse.json({ booking: updated });

  } catch (err) {
    console.error('PATCH /api/admin/bookings/[id]/status error:', err);
    return NextResponse.json({ error: 'Action failed. Please try again.' }, { status: 500 });
  }
}
