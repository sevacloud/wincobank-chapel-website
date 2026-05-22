/**
 * Booking Repository
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * GoF Pattern: REPOSITORY (structural / data access)
 * ─────────────────────────────────────────────────────────────────────────
 * All Supabase queries for bookings live here. No component or API route
 * touches the Supabase client directly — they call this repository.
 *
 * Benefits:
 * - Swap Supabase for any other backend by rewriting this one file
 * - Every query is typed end-to-end
 * - Testable in isolation by injecting a mock client
 *
 * Data Structures:
 * - Returns typed objects, never raw Supabase rows
 * - Overlap detection uses a linear scan of approved bookings for the room
 *   on the requested date. O(n) where n = bookings per room per day.
 *   Acceptable at charity scale; for high volume, use the DB btree_gist index
 *   directly via a stored procedure.
 */

import { createClient } from '@supabase/supabase-js';
import { isValidTransition, type BookingStatus } from '../state/booking-state-machine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Room {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  /** Price in pence — divide by 100 for display */
  price_pence: number;
  image_url: string | null;
  is_active: boolean;
}

export interface Booking {
  id: string;
  room_id: string;
  room?: Pick<Room, 'name' | 'price_pence'>;
  user_id: string | null;
  booker_name: string;
  booker_email: string;
  booker_phone: string | null;
  start_time: string;
  end_time: string;
  purpose: string;
  attendee_count: number;
  status: BookingStatus;
  deposit_amount_pence: number;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  admin_notes: string | null;
  created_at: string;
}

export interface CreateBookingInput {
  room_id: string;
  user_id?: string;
  booker_name: string;
  booker_email: string;
  booker_phone?: string;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  purpose: string;
  attendee_count: number;
  deposit_amount_pence: number;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class BookingRepository {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ── Rooms ──────────────────────────────────────────────────────────────

  /** Fetch all active rooms — used on the public booking page */
  async getActiveRooms(): Promise<Room[]> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw new Error(`getActiveRooms: ${error.message}`);
    return data ?? [];
  }

  /** Fetch a single room by ID */
  async getRoomById(id: string): Promise<Room | null> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  // ── Bookings ───────────────────────────────────────────────────────────

  /**
   * Check for overlapping APPROVED bookings.
   * Called before creating a new booking to inform the user of conflicts.
   * The DB index (btree_gist) also enforces this — this is a user-friendly
   * pre-check that returns which slots are unavailable.
   *
   * Algorithm: interval overlap → A starts before B ends AND A ends after B starts.
   * Time complexity: O(n) but Supabase query is filtered to room + date range.
   */
  async getOverlappingBookings(
    roomId: string,
    startTime: string,
    endTime: string
  ): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'approved')
      .lt('start_time', endTime)   // existing booking starts before our end
      .gt('end_time', startTime);  // existing booking ends after our start

    if (error) throw new Error(`getOverlappingBookings: ${error.message}`);
    return (data ?? []) as Booking[];
  }

  /** Create a new booking — always starts in 'pending' state */
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const { data, error } = await this.supabase
      .from('bookings')
      .insert({
        ...input,
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (error) throw new Error(`createBooking: ${error.message}`);
    return data as Booking;
  }

  /**
   * Transition a booking to a new status.
   *
   * State Machine integration: validates the transition before writing.
   * If the transition is illegal, throws — the caller never touches the DB.
   *
   * @param adminId - must be an admin profile ID (RLS enforces this at DB level too)
   */
  async transitionStatus(
    bookingId: string,
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
    adminId: string,
    adminNotes?: string
  ): Promise<Booking> {
    // Guard: State Machine validation BEFORE the DB call
    if (!isValidTransition(currentStatus, newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${newStatus}`
      );
    }

    const { data, error } = await this.supabase
      .from('bookings')
      .update({
        status: newStatus,
        admin_notes: adminNotes ?? null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw new Error(`transitionStatus: ${error.message}`);
    return data as Booking;
  }

  /** Fetch all bookings — admin only (RLS enforces this at DB level) */
  async getAllBookings(filters?: {
    status?: BookingStatus;
    roomId?: string;
  }): Promise<Booking[]> {
    let query = this.supabase
      .from('bookings')
      .select('*, room:rooms(name, price_pence)')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.roomId) query = query.eq('room_id', filters.roomId);

    const { data, error } = await query;
    if (error) throw new Error(`getAllBookings: ${error.message}`);
    return (data ?? []) as Booking[];
  }

  /** Fetch bookings for the current authenticated user */
  async getMyBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*, room:rooms(name, price_pence)')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (error) throw new Error(`getMyBookings: ${error.message}`);
    return (data ?? []) as Booking[];
  }

  /** Pending bookings count — used for admin dashboard badge */
  async getPendingCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw new Error(`getPendingCount: ${error.message}`);
    return count ?? 0;
  }
}
