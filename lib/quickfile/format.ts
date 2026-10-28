/**
 * Display formatting for the trustee dashboard (client- and server-safe).
 */

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export function formatGBP(v: number | null | undefined): string {
  return v == null ? '—' : gbp.format(v);
}

/** Accounting style: negatives in brackets, e.g. (£1,234.00). */
export function formatGBPAccounting(v: number | null | undefined): string {
  if (v == null) return '—';
  return v < 0 ? `(${gbp.format(-v)})` : gbp.format(v);
}

/** "2025-04" → "Apr 25" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1).toLocaleString('en-GB', { month: 'short', year: '2-digit' });
}

/** "2025-04-09" → "09 Apr 2025" */
export function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Every YYYY-MM between two dates inclusive, so empty months still appear on charts. */
export function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  let [y, m] = from.slice(0, 7).split('-').map(Number);
  const [ey, em] = to.slice(0, 7).split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}
