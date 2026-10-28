/**
 * Contact Form
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Posts to /api/contact. Used on /contact (general enquiries) and on /rooms
 * (booking enquiries), where it adds room, date and attendee fields and
 * folds them into the subject and message — so the contact API and the
 * contact_messages table need no changes.
 */

'use client';

import { useState } from 'react';

export interface RoomOption {
  id: string;
  name: string;
}

interface Props {
  /** Booking-enquiry mode: shows room/date/attendees instead of a free subject. */
  rooms?: RoomOption[];
  bookingEnquiry?: boolean;
  defaultRoomId?: string;
}

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chapel-500';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

export default function ContactForm({ rooms = [], bookingEnquiry = false, defaultRoomId = '' }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    roomId: rooms.some((r) => r.id === defaultRoomId) ? defaultRoomId : '',
    dates: '',
    attendees: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function payload() {
    if (!bookingEnquiry) {
      return { name: form.name, email: form.email, phone: form.phone, subject: form.subject, message: form.message };
    }
    const room = rooms.find((r) => r.id === form.roomId)?.name;
    const details = [
      `Room: ${room ?? 'Not sure yet'}`,
      form.dates && `Preferred date(s) / times: ${form.dates}`,
      form.attendees && `Expected attendees: ${form.attendees}`,
    ].filter(Boolean).join('\n');
    return {
      name: form.name,
      email: form.email,
      phone: form.phone,
      subject: `Room booking enquiry${room ? ` — ${room}` : ''}`,
      message: `${details}\n\n${form.message}`,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8" role="status">
        <div className="text-5xl mb-4" aria-hidden>✉️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
        <p className="text-gray-600">
          Thank you for getting in touch. A volunteer will respond as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>Name *</label>
        <input id="name" type="text" required autoComplete="name" value={form.name} onChange={set('name')} className={inputClass} />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email *</label>
        <input id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} className={inputClass} />
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Phone (optional)</label>
        <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className={inputClass} />
      </div>

      {bookingEnquiry ? (
        <>
          {rooms.length > 0 && (
            <div>
              <label htmlFor="room" className={labelClass}>Which space?</label>
              <select id="room" value={form.roomId} onChange={set('roomId')} className={`${inputClass} bg-white`}>
                <option value="">Not sure yet</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <div>
              <label htmlFor="dates" className={labelClass}>Preferred date(s) and times</label>
              <input id="dates" type="text" placeholder="e.g. Sat 14 March, 2–5pm" value={form.dates} onChange={set('dates')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="attendees" className={labelClass}>Expected attendees</label>
              <input id="attendees" type="number" min={1} inputMode="numeric" value={form.attendees} onChange={set('attendees')} className={inputClass} />
            </div>
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="subject" className={labelClass}>Subject *</label>
          <input id="subject" type="text" required value={form.subject} onChange={set('subject')} className={inputClass} />
        </div>
      )}

      <div>
        <label htmlFor="message" className={labelClass}>
          {bookingEnquiry ? 'Tell us about your event *' : 'Message *'}
        </label>
        <textarea id="message" required rows={5} value={form.message} onChange={set('message')} className={`${inputClass} resize-none`} />
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-chapel-400 text-white py-3 rounded-md font-medium text-sm hover:bg-chapel-500 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Sending…' : bookingEnquiry ? 'Send Booking Enquiry' : 'Send Message'}
      </button>
    </form>
  );
}
