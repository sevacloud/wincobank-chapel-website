/**
 * Small presentational building blocks shared by the trustee report pages.
 * Server-safe (no hooks).
 */

import { cardClass, cardTitleClass, inputClass, primaryButtonClass } from './styles';
import { financialYears, isIsoDate, resolveFinancialYear, type FinancialYear } from '@/lib/quickfile/financial-year';

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export interface Period {
  fy: FinancialYear;
  isCurrentFY: boolean;
  from: string;
  to: string;
}

/** ?fy= picks the financial year; optional ?from=&to= narrow it to a custom range. */
export async function resolvePeriod(searchParams: SearchParams): Promise<Period> {
  const sp = await searchParams;
  const fy = resolveFinancialYear(sp.fy);
  const from = isIsoDate(sp.from) ? sp.from : fy.from;
  const to = isIsoDate(sp.to) && sp.to >= from ? sp.to : fy.to;
  return { fy, isCurrentFY: fy.label === financialYears()[0].label, from, to };
}

export function Card({ title, aside, children }: { title?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={cardClass}>
      {title && (
        <div className={`${cardTitleClass} flex items-baseline justify-between gap-4`}>
          <h2>{title}</h2>
          {aside && <span className="text-sm font-normal text-gray-500">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {children && <p className="text-sm text-gray-600 mt-1">{children}</p>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6" role="alert">
      <strong>Could not load data from QuickFile: </strong>{message}
    </div>
  );
}

export function WarningList({ items }: { items: Array<{ label: string; message: string }> }) {
  if (!items.length) return null;
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6" role="alert">
      <strong>⚠ Some data could not be loaded:</strong>
      <ul className="list-disc ml-5 mt-1">
        {items.map((i, n) => <li key={n}><strong>{i.label}:</strong> {i.message}</li>)}
      </ul>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 py-8 text-center">{children}</p>;
}

/**
 * RAG against a pound figure (net movement, or budget remaining):
 * green ≥ £0, amber within £500 below zero, red beyond that.
 */
export function ragStatus(value: number): 'green' | 'amber' | 'red' {
  if (value >= 0) return 'green';
  if (value >= -500) return 'amber';
  return 'red';
}

/** Status badge — always icon + label, never colour alone. */
export function RagBadge({ status, labels }: { status: 'green' | 'amber' | 'red'; labels: Record<'green' | 'amber' | 'red', string> }) {
  const styles = {
    green: 'bg-green-50 text-green-800 ring-green-200',
    amber: 'bg-amber-50 text-amber-900 ring-amber-200',
    red: 'bg-red-50 text-red-800 ring-red-200',
  };
  const icons = { green: '●', amber: '▲', red: '■' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles[status]}`}>
      <span aria-hidden>{icons[status]}</span>{labels[status]}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900 tabular-nums">{value}</div>
    </div>
  );
}

/** Plain GET form — works without JavaScript and keeps the range in the URL. */
export function DateRangeForm({ period }: { period: Period }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 mb-6" aria-label="Date range">
      <input type="hidden" name="fy" value={period.fy.label} />
      <div>
        <label htmlFor="from" className="block text-xs text-gray-600 mb-1">From</label>
        <input id="from" name="from" type="date" defaultValue={period.from} required className={inputClass} />
      </div>
      <div>
        <label htmlFor="to" className="block text-xs text-gray-600 mb-1">To</label>
        <input id="to" name="to" type="date" defaultValue={period.to} required className={inputClass} />
      </div>
      <button type="submit" className={primaryButtonClass}>Load</button>
    </form>
  );
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
