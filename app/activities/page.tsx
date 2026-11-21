/**
 * Activities Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /activities
 * Migrated from legacy: whats-going-on-at-wincobank-chapel.html
 *
 * Content lives in content/whats-on.ts. The page renders on every visit so
 * one-off events disappear by themselves once they have finished (UK time).
 */

import type { Metadata } from 'next';
import { connection } from 'next/server';
import { oneOffEvents, venue, weeklyActivities, type WeeklyActivity } from '@/content/whats-on';
import { formatEventDate, formatEventTime, upcomingEvents } from '@/lib/whats-on';

export const metadata: Metadata = {
  title: 'Activities',
  description:
    'Weekly activities and upcoming events at Upper Wincobank Chapel — exercise, coffee mornings, toddlers, boccia, a welcome café and Sunday chapel.',
};

const DAY_ORDER: WeeklyActivity['day'][] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

export default async function ActivitiesPage() {
  // Render at request time, not build time, so "today" is always today.
  await connection();
  const events = upcomingEvents(oneOffEvents);

  const days = DAY_ORDER.map(day => ({
    day,
    items: weeklyActivities.filter(a => a.day === day),
  })).filter(d => d.items.length > 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        What&apos;s Going On at Wincobank Chapel
      </h1>

      <div className="bg-chapel-50 border border-chapel-100 rounded-lg p-5 mb-10">
        <p className="font-semibold text-gray-900">{venue.name}</p>
        <p className="text-gray-800">{venue.address}</p>
        <p className="text-gray-800 mb-2">{venue.directions}</p>
        <p className="font-semibold text-chapel-700">All welcome.</p>
      </div>

      {/* One-off events — only shown when there is at least one still to come */}
      <section aria-labelledby="events-heading" className="mb-12">
        <h2 id="events-heading" className="text-2xl font-bold text-gray-900 mb-4">
          Coming Up
        </h2>
        {events.length > 0 ? (
          <ul className="space-y-4">
            {events.map(e => (
              <li
                key={`${e.date}-${e.start}-${e.title}`}
                className="bg-white border-2 border-chapel-600 rounded-lg p-5"
              >
                <p className="text-sm font-semibold text-chapel-700 mb-1">
                  <time dateTime={`${e.date}T${e.start}`}>{formatEventDate(e.date)}</time>
                  {' · '}
                  {formatEventTime(e.start, e.end)}
                </p>
                <h3 className="text-lg font-semibold text-gray-900">{e.title}</h3>
                {e.description && <p className="text-gray-700 mt-1">{e.description}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700">
            No special events are planned just now — but our weekly activities below run
            every week. Do pop in!
          </p>
        )}
      </section>

      {/* Weekly timetable */}
      <section aria-labelledby="weekly-heading" className="mb-12">
        <h2 id="weekly-heading" className="text-2xl font-bold text-gray-900 mb-4">
          Every Week
        </h2>
        <div className="space-y-8">
          {days.map(({ day, items }) => (
            <div key={day}>
              <h3 className="text-lg font-bold text-chapel-700 mb-3">{day}s</h3>
              <ul className="space-y-3">
                {items.map(a => (
                  <li
                    key={`${a.day}-${a.time}-${a.title}`}
                    className="bg-white border border-gray-200 rounded-lg p-5"
                  >
                    <p className="text-sm font-semibold text-chapel-700 mb-1">{a.time}</p>
                    <h4 className="font-semibold text-gray-900">{a.title}</h4>
                    <p className="text-gray-700">{a.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="more-heading" className="space-y-4">
        <h2 id="more-heading" className="sr-only">More</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Heritage Tours</h3>
          <p className="text-sm font-semibold text-chapel-700 mb-1">By arrangement</p>
          <p className="text-gray-700">
            Tours of the Chapel and nearby Iron Age hill fort. Please phone 07980 143776
            for further details.
          </p>
        </div>
        <p className="text-gray-700">
          Find us on Facebook: <strong>{venue.facebook}</strong>
        </p>
      </section>
    </div>
  );
}
