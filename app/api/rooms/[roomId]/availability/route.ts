/**
 * API Route: GET /api/rooms/[roomId]/availability
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Checks whether a time slot is available (no overlapping approved bookings).
 * Used by the booking form for inline overlap warnings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BookingRepository } from '@/lib/repositories/booking-repository';

function getRepo() {
  return new BookingRepository(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const start = req.nextUrl.searchParams.get('start');
  const end = req.nextUrl.searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end query params required' }, { status: 400 });
  }

  const overlaps = await getRepo().getOverlappingBookings(roomId, start, end);
  return NextResponse.json({ available: overlaps.length === 0 });
}
