/**
 * What's On — weekly timetable and one-off events
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * This is the only file you need to edit to change the What's On page
 * (/activities). See "How to add an event" in the README.
 *
 * RULES FOR EVENTS
 * - Every event MUST have a date ("YYYY-MM-DD") and a start and end time
 *   ("HH:MM", 24-hour clock, UK time).
 * - Past events hide themselves automatically once their end time has passed.
 * - When you edit this file, also delete any events that are already past.
 */

export type WeeklyActivity = {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  /** Shown exactly as written, e.g. "10–11am". */
  time: string;
  title: string;
  description: string;
};

export type OneOffEvent = {
  /** "YYYY-MM-DD", e.g. "2026-11-28". */
  date: string;
  /** "HH:MM", 24-hour clock, e.g. "13:00" for 1pm. */
  start: string;
  /** "HH:MM", 24-hour clock. The event hides once this time has passed. */
  end: string;
  title: string;
  description?: string;
};

export const venue = {
  name: 'Upper Wincobank Chapel',
  address: '132 Wincobank Avenue, Sheffield S5 6BB',
  directions: 'Opposite the Enchanted Chairs Sculptures, on the 76 and 76a bus route.',
  facebook: 'Upper Wincobank Chapel',
};

/** Weekly activities. These run every week and have no end date. */
export const weeklyActivities: WeeklyActivity[] = [
  {
    day: 'Tuesday',
    time: '10–11am',
    title: 'Fit & Fun',
    description: 'Easy exercise to music. Sit or stand — suitable for all.',
  },
  {
    day: 'Tuesday',
    time: '11am–12pm',
    title: 'Coffee Morning',
    description: 'A friendly cuppa and a chat, with occasional singing.',
  },
  {
    day: 'Wednesday',
    time: '10am–12 noon',
    title: 'Fun for Toddlers',
    description: 'For toddlers with their parents, grandparents and carers.',
  },
  {
    day: 'Thursday',
    time: '11am–12 noon',
    title: 'Mindful Exercise & Relaxation',
    description: 'Gentle exercise and time to relax.',
  },
  {
    day: 'Thursday',
    time: '12.30–1.30pm',
    title: 'Boccia',
    description: 'Seated soft bowls for all abilities.',
  },
  {
    day: 'Friday',
    time: '1–4pm',
    title: 'Chapel House Welcome Café',
    description:
      'Drop in for a free cuppa, a chat and art activities, including chair-based easy exercise at 3pm.',
  },
  {
    day: 'Sunday',
    time: '11am–12 noon',
    title: 'Chapel',
    description: 'Bible stories, song and prayer.',
  },
];

/**
 * One-off events. Keep them in date order.
 * Delete any that are already past when you edit this list.
 */
export const oneOffEvents: OneOffEvent[] = [
  { date: '2026-11-28', start: '13:00', end: '16:00', title: 'Christmas Fair' },
  { date: '2026-12-10', start: '18:30', end: '20:30', title: 'Friends of Wincobank Hill meeting' },
  { date: '2027-01-07', start: '18:30', end: '20:30', title: 'Friends of Wincobank Hill meeting' },
  { date: '2027-01-09', start: '10:00', end: '12:00', title: 'Chapel House Garden Group' },
];
