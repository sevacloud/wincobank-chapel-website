/**
 * Public Booking Request Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /rooms/[roomId]/book
 *
 * This is a React Server Component (Next.js App Router).
 * The form submission hits /api/bookings (POST) which uses the
 * BookingRepository to create the booking and returns validation errors.
 *
 * UX decisions:
 * - Overlap check is shown inline BEFORE submission — saves a round trip
 * - Deposit amount is shown from the room data — no surprises
 * - Guest users can book without an account (booker_name/email captured)
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { STATUS_LABELS } from '@/lib/state/booking-state-machine';

interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price_pence: number;
}

interface FormData {
  booker_name: string;
  booker_email: string;
  booker_phone: string;
  start_time: string;
  end_time: string;
  purpose: string;
  attendee_count: string;
}

const INITIAL_FORM: FormData = {
  booker_name: '',
  booker_email: '',
  booker_phone: '',
  start_time: '',
  end_time: '',
  purpose: '',
  attendee_count: '',
};

export default function BookRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [overlapWarning, setOverlapWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Fetch room details on mount
  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(setRoom)
      .catch(console.error);
  }, [roomId]);

  // Check for overlapping bookings when time range changes
  useEffect(() => {
    if (!form.start_time || !form.end_time) return;
    if (form.end_time <= form.start_time) return;

    fetch(`/api/rooms/${roomId}/availability?start=${form.start_time}&end=${form.end_time}`)
      .then(r => r.json())
      .then(({ available }) => setOverlapWarning(!available))
      .catch(console.error);
  }, [roomId, form.start_time, form.end_time]);

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.booker_name.trim()) e.booker_name = 'Please enter your name';
    if (!form.booker_email.includes('@')) e.booker_email = 'Please enter a valid email';
    if (!form.start_time) e.start_time = 'Please choose a start time';
    if (!form.end_time) e.end_time = 'Please choose an end time';
    if (form.end_time && form.start_time && form.end_time <= form.start_time)
      e.end_time = 'End time must be after start time';
    if (!form.purpose.trim()) e.purpose = 'Please describe the purpose';
    if (!form.attendee_count || parseInt(form.attendee_count) < 1)
      e.attendee_count = 'Please enter the number of attendees';
    if (room && parseInt(form.attendee_count) > room.capacity)
      e.attendee_count = `This room holds a maximum of ${room.capacity} people`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !room) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          ...form,
          attendee_count: parseInt(form.attendee_count),
          deposit_amount_pence: room.price_pence,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function field(
    name: keyof FormData,
    label: string,
    type = 'text',
    extra?: React.InputHTMLAttributes<HTMLInputElement>
  ) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
          {label}
        </label>
        <input
          id={name}
          type={type}
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors[name] ? 'border-red-400' : 'border-gray-300'
          }`}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          {...extra}
        />
        {errors[name] && (
          <p id={`${name}-error`} className="mt-1 text-xs text-red-600" role="alert">
            {errors[name]}
          </p>
        )}
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4" aria-hidden>✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your booking request. We'll review it and send a confirmation
          email within 2 working days.
        </p>
        <button
          onClick={() => router.push('/rooms')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Back to Rooms
        </button>
      </main>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (!room) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center text-gray-500">
        Loading room details…
      </main>
    );
  }

  // ── Booking form ─────────────────────────────────────────────────────────
  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      {/* Room summary */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-8">
        <h1 className="text-xl font-bold text-gray-900">{room.name}</h1>
        <p className="text-sm text-gray-600 mt-1">{room.description}</p>
        <p className="text-sm font-medium text-indigo-700 mt-2">
          Deposit: £{(room.price_pence / 100).toFixed(2)} — Max capacity: {room.capacity}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Details</h2>

      <form onSubmit={handleSubmit} noValidate>
        {field('booker_name', 'Full Name *', 'text', { autoComplete: 'name', required: true })}
        {field('booker_email', 'Email Address *', 'email', { autoComplete: 'email', required: true })}
        {field('booker_phone', 'Phone Number (optional)', 'tel', { autoComplete: 'tel' })}

        <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Booking Details</h2>

        {field('start_time', 'Start Date & Time *', 'datetime-local', {
          min: new Date().toISOString().slice(0, 16),
          required: true,
        })}
        {field('end_time', 'End Date & Time *', 'datetime-local', {
          min: form.start_time || new Date().toISOString().slice(0, 16),
          required: true,
        })}

        {/* Overlap warning — shown inline before submission */}
        {overlapWarning && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800" role="alert">
            ⚠️ This time slot may conflict with an existing booking. You can still submit your request — our team will contact you if there's an issue.
          </div>
        )}

        {field('purpose', 'Purpose / Event Description *', 'text', { required: true })}
        {field('attendee_count', 'Expected Number of Attendees *', 'number', {
          min: '1',
          max: String(room.capacity),
          required: true,
        })}

        {/* Deposit summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 my-6 text-sm text-gray-700">
          <p className="font-medium mb-1">Deposit Required</p>
          <p className="text-2xl font-bold text-gray-900">
            £{(room.price_pence / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Payable after your booking is approved. Our team will send payment details by email.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-md font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {submitting ? 'Submitting…' : 'Submit Booking Request'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          All bookings are subject to admin approval. You'll receive an email confirmation.
        </p>
      </form>
    </main>
  );
}
