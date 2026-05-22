/**
 * Rooms / Booking Page (Placeholder)
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /rooms
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Book a Room',
  description: 'Book a room at Wincobank Chapel for your event, meeting, or celebration.',
};

export default function RoomsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4" aria-hidden>🚧</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Room Booking</h1>
      <p className="text-gray-600 mb-6">
        This feature is under development. Online room booking is coming soon.
      </p>
      <p className="text-sm text-gray-500">
        In the meantime, please{' '}
        <Link href="/contact" className="text-indigo-600 hover:text-indigo-800 underline">
          contact us
        </Link>{' '}
        or call <strong>07980 143776</strong> to arrange a booking.
      </p>
    </div>
  );
}
