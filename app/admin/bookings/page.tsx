/**
 * Admin Bookings Dashboard
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /admin/bookings
 *
 * Shows all pending bookings with approve/reject actions.
 * Protected by middleware checking user role = 'admin'.
 *
 * Design notes:
 * - State Machine integration: action buttons derive from validNextStates()
 *   so the UI can never show an illegal action
 * - Repository pattern: all data fetching through BookingRepository
 * - Observer pattern: approve/reject triggers DB → notification → email
 *   without any explicit email call here
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  STATUS_LABELS,
  STATUS_COLOURS,
  validNextStates,
  type BookingStatus,
} from '@/lib/state/booking-state-machine';

interface Booking {
  id: string;
  booker_name: string;
  booker_email: string;
  booker_phone: string | null;
  room: { name: string; price_pence: number };
  start_time: string;
  end_time: string;
  purpose: string;
  attendee_count: number;
  status: BookingStatus;
  deposit_amount_pence: number;
  payment_status: string;
  admin_notes: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatPrice(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

// Status filter tabs — using an array to preserve display order
const STATUS_FILTERS: Array<BookingStatus | 'all'> = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [acting, setActing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter !== 'all' ? `?status=${filter}` : '';
      const [bookingsRes, countRes] = await Promise.all([
        fetch(`/api/admin/bookings${qs}`),
        fetch('/api/admin/bookings/pending-count'),
      ]);
      const [data, { count }] = await Promise.all([bookingsRes.json(), countRes.json()]);
      setBookings(data);
      setPendingCount(count);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function handleTransition(booking: Booking, newStatus: BookingStatus) {
    setActing(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_notes: adminNotes }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? 'Action failed');
      }

      setActionBooking(null);
      setAdminNotes('');
      await fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActing(false);
    }
  }

  // ── Action button label and colour per transition ────────────────────────
  const ACTION_CONFIG: Record<BookingStatus, { label: string; colour: string }> = {
    approved:  { label: 'Approve',   colour: 'bg-green-600 hover:bg-green-700 text-white' },
    rejected:  { label: 'Reject',    colour: 'bg-red-600 hover:bg-red-700 text-white' },
    cancelled: { label: 'Cancel',    colour: 'bg-gray-600 hover:bg-gray-700 text-white' },
    pending:   { label: 'Reset',     colour: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage room booking requests for Wincobank Chapel</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
            {pendingCount} awaiting review
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
              filter === s
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No bookings found.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => {
            const nextStates = validNextStates(booking.status);
            return (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
              >
                {/* Row 1: name, room, status badge */}
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{booking.booker_name}</p>
                    <p className="text-sm text-gray-500">{booking.booker_email}
                      {booking.booker_phone && ` · ${booking.booker_phone}`}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOURS[booking.status]}`}>
                    {STATUS_LABELS[booking.status]}
                  </span>
                </div>

                {/* Row 2: booking details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-700 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Room</p>
                    <p className="font-medium">{booking.room.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Start</p>
                    <p>{formatDate(booking.start_time)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">End</p>
                    <p>{formatDate(booking.end_time)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Attendees</p>
                    <p>{booking.attendee_count}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Purpose</p>
                    <p>{booking.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Deposit</p>
                    <p className="font-medium">{formatPrice(booking.deposit_amount_pence)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Payment</p>
                    <p className={booking.payment_status === 'paid' ? 'text-green-600 font-medium' : 'text-gray-600'}>
                      {booking.payment_status}
                    </p>
                  </div>
                </div>

                {booking.admin_notes && (
                  <p className="text-sm text-gray-500 italic mb-3">
                    Note: {booking.admin_notes}
                  </p>
                )}

                {/* Action buttons — derived from State Machine, not hardcoded */}
                {nextStates.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {nextStates.map(nextStatus => (
                      <button
                        key={nextStatus}
                        onClick={() => setActionBooking(booking)}
                        className={`text-sm px-4 py-1.5 rounded-md font-medium transition-colors ${ACTION_CONFIG[nextStatus].colour}`}
                      >
                        {ACTION_CONFIG[nextStatus].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action modal — notes + confirm */}
      {actionBooking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Action: {actionBooking.booker_name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {actionBooking.room.name} · {formatDate(actionBooking.start_time)}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes for the booker (optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Please ensure the room is left tidy. Deposit details will follow."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActionBooking(null); setAdminNotes(''); }}
                className="text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {/* Approve */}
              {validNextStates(actionBooking.status).includes('approved') && (
                <button
                  onClick={() => handleTransition(actionBooking, 'approved')}
                  disabled={acting}
                  className="text-sm px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {acting ? 'Saving…' : 'Approve Booking'}
                </button>
              )}
              {/* Reject */}
              {validNextStates(actionBooking.status).includes('rejected') && (
                <button
                  onClick={() => handleTransition(actionBooking, 'rejected')}
                  disabled={acting}
                  className="text-sm px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {acting ? 'Saving…' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
