/**
 * Checks that past events hide themselves. Run with:
 *   node --experimental-strip-types scripts/check-whats-on.ts
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 */
import assert from 'node:assert/strict';
import { oneOffEvents, type OneOffEvent } from '../content/whats-on.ts';
import { formatEventDate, formatEventTime, londonNow, upcomingEvents } from '../lib/whats-on.ts';

const sample: OneOffEvent[] = [
  { date: '2026-11-28', start: '13:00', end: '16:00', title: 'Christmas Fair' },
  { date: '2026-11-12', start: '18:30', end: '20:30', title: 'Past meeting' },
  { date: '2027-01-09', start: '10:00', end: '12:00', title: 'Garden Group' },
];
const titlesAt = (iso: string) => upcomingEvents(sample, new Date(iso)).map(e => e.title);

// Every event must have a valid date and times.
for (const e of oneOffEvents) {
  assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/, `bad date on "${e.title}"`);
  assert.match(e.start, /^\d{2}:\d{2}$/, `bad start on "${e.title}"`);
  assert.match(e.end, /^\d{2}:\d{2}$/, `bad end on "${e.title}"`);
  assert.ok(e.end > e.start, `end before start on "${e.title}"`);
}

// Past events hide; the rest are sorted soonest first.
assert.deepEqual(titlesAt('2026-11-21T12:00:00Z'), ['Christmas Fair', 'Garden Group']);
// An event still shows until its end time (4pm GMT), then hides.
assert.deepEqual(titlesAt('2026-11-28T15:59:00Z'), ['Christmas Fair', 'Garden Group']);
assert.deepEqual(titlesAt('2026-11-28T16:00:00Z'), ['Garden Group']);
// After the last event: nothing left.
assert.deepEqual(titlesAt('2027-01-10T00:00:00Z'), []);
// British Summer Time: 23:30 UTC on 30 Jun is already 1 Jul in London.
assert.equal(londonNow(new Date('2027-06-30T23:30:00Z')), '2027-07-01T00:30');

assert.equal(formatEventDate('2026-11-28'), 'Saturday 28 November 2026');
assert.equal(formatEventTime('13:00', '16:00'), '1–4pm');
assert.equal(formatEventTime('18:30', '20:30'), '6.30–8.30pm');
assert.equal(formatEventTime('10:00', '12:00'), '10am–12 noon');

console.log('Upcoming on the live site right now:');
for (const e of upcomingEvents(oneOffEvents)) console.log(`  ${e.date} ${e.title}`);
console.log('All What\'s On checks passed.');
