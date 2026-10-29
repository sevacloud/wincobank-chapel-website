/**
 * QuickFile invoice / purchase statuses
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * The API returns statuses upper-case, e.g. invoices DRAFT, SENT, PAIDFULL
 * and purchases UNPAID, PAIDFULL, CREDIT NOTE. Documented values: draft,
 * sent, disputed, paidpart, paidfull, active, unpaid, deleted, aged, paused,
 * agreed, declined; "credit note" is seen in practice but not documented.
 * Matching ignores case, spaces, hyphens and underscores.
 */

export type Rag = 'green' | 'amber' | 'red';

const key = (status: string) => status.toLowerCase().replace(/[\s_-]+/g, '');

const LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  unpaid: 'Unpaid',
  paidpart: 'Part paid',
  paidfull: 'Paid',
  creditnote: 'Credit note',
  disputed: 'Disputed',
  aged: 'Overdue',
  active: 'Active',
  paused: 'Paused',
  deleted: 'Deleted',
};

// Settled: nothing more to pay or collect. Problem: needs chasing.
const SETTLED = new Set(['paidfull', 'creditnote', 'deleted']);
const PROBLEM = new Set(['disputed', 'aged', 'declined']);
// Statuses an invoice can only reach after being sent to the client.
const SENT_OR_LATER = new Set(['sent', 'paidpart', 'paidfull', 'disputed', 'aged']);

export function statusLabel(status: string): string {
  if (!status.trim()) return '—';
  return LABELS[key(status)] ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/** Settled → green, disputed/overdue → red, anything still outstanding → amber. */
export function statusRag(status: string): Rag {
  const k = key(status);
  if (SETTLED.has(k)) return 'green';
  if (PROBLEM.has(k)) return 'red';
  return 'amber';
}

export const isSettled = (status: string) => statusRag(status) === 'green';

export const isInvoiceSent = (status: string) => SENT_OR_LATER.has(key(status));
