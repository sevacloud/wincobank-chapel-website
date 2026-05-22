/**
 * API Route: GET /api/admin/bookings
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Returns all bookings, optionally filtered by status.
 * Admin only — auth checked via Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BookingRepository } from '@/lib/repositories/booking-repository';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { BookingStatus } from '@/lib/state/booking-state-machine';

const repo = new BookingRepository(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
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

    const status = req.nextUrl.searchParams.get('status') as BookingStatus | null;
    const bookings = await repo.getAllBookings(status ? { status } : undefined);

    return NextResponse.json(bookings);
  } catch (err) {
    console.error('GET /api/admin/bookings error:', err);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
