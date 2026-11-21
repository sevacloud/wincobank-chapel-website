/**
 * What's On helpers — filtering and formatting one-off events
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * All comparisons use UK time (Europe/London), whatever the server's own
 * time zone is, so an event hides at the right moment for local visitors.
 */

import type { OneOffEvent } from '@/content/whats-on';

const TIME_ZONE = 'Europe/London';

/** The current UK wall-clock time as "YYYY-MM-DDTHH:MM" (sorts as text). */
export function londonNow(now: Date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map(p => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Events that haven't finished yet, soonest first. */
export function upcomingEvents(events: OneOffEvent[], now: Date = new Date()): OneOffEvent[] {
  const current = londonNow(now);
  return events
    .filter(e => `${e.date}T${e.end}` > current)
    .sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
}

/** "Saturday 28 November 2026" */
export function formatEventDate(date: string): string {
  // Noon UTC keeps the calendar day the same in London all year round.
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(',', '');
}

/** "13:00" → "1pm", "18:30" → "6.30pm", "12:00" → "12 noon" */
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (h === 12 && m === 0) return '12 noon';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? 'am' : 'pm';
  return m === 0 ? `${hour12}${suffix}` : `${hour12}.${String(m).padStart(2, '0')}${suffix}`;
}

/** "1–4pm", "6.30–8.30pm", "10am–12 noon" */
export function formatEventTime(start: string, end: string): string {
  const s = formatTime(start);
  const e = formatTime(end);
  const sameHalf = Number(start.slice(0, 2)) < 12 === Number(end.slice(0, 2)) < 12;
  if (sameHalf && !e.includes('noon')) return `${s.replace(/am|pm/, '')}–${e}`;
  return `${s}–${e}`;
}
