/**
 * API Route: GET /api/rooms/[roomId]
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Returns a single room's details for the booking form.
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
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = await getRepo().getRoomById(roomId);

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json(room);
}
