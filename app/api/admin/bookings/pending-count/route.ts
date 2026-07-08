/**
 * API Route: GET /api/admin/bookings/pending-count
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Returns the count of pending bookings for the admin dashboard badge.
 */

import { NextResponse } from 'next/server';
import { BookingRepository } from '@/lib/repositories/booking-repository';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getRepo() {
  return new BookingRepository(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const repo = getRepo();
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const count = await repo.getPendingCount();
    return NextResponse.json({ count });
  } catch (err) {
    console.error('GET /api/admin/bookings/pending-count error:', err);
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
  }
}
