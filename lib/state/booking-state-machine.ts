/**
 * Booking State Machine
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * GoF Pattern: STATE MACHINE (behavioural)
 * ─────────────────────────────────────────────────────────────────────────
 * Each booking lives in exactly one state. This module is the single source
 * of truth for which transitions are legal and who may perform them.
 *
 * Benefits:
 * - Impossible to accidentally move a booking from 'rejected' to 'approved'
 * - Business rules live in ONE place — not scattered across components
 * - Adding a new state (e.g. 'waitlisted') only requires editing this file
 *
 * Data Structure: adjacency map (Record<Status, Status[]>)
 * O(1) lookup for valid next states given a current state.
 * Small, fixed set of states makes a map the right choice over a graph lib.
 */

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type UserRole = 'public' | 'member' | 'admin';

// Adjacency map: current state → array of valid next states
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending:   ['approved', 'rejected'],  // admin only
  approved:  ['cancelled'],             // user or admin
  rejected:  [],                         // terminal state
  cancelled: [],                         // terminal state
};

// Who may trigger each transition
const TRANSITION_ROLES: Record<string, UserRole[]> = {
  'pending→approved':  ['admin'],
  'pending→rejected':  ['admin'],
  'approved→cancelled': ['admin', 'member', 'public'],
};

/**
 * Returns true if moving from `from` → `to` is a legal transition.
 */
export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * Returns true if `role` may trigger the transition `from` → `to`.
 */
export function canTransition(
  from: BookingStatus,
  to: BookingStatus,
  role: UserRole
): boolean {
  if (!isValidTransition(from, to)) return false;
  const key = `${from}→${to}`;
  const allowed = TRANSITION_ROLES[key] ?? [];
  return allowed.includes(role);
}

/**
 * Returns all valid next states from the current state.
 * Used to render the correct action buttons in the UI.
 */
export function validNextStates(current: BookingStatus): BookingStatus[] {
  return TRANSITIONS[current];
}

/**
 * Human-readable labels for each status — used in UI badges.
 */
export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending:   'Awaiting Approval',
  approved:  'Approved',
  rejected:  'Not Approved',
  cancelled: 'Cancelled',
};

/**
 * Tailwind colour classes per status — co-located with the state definition
 * so adding a state automatically prompts adding its colour.
 */
export const STATUS_COLOURS: Record<BookingStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};
