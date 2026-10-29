/**
 * Trustee Portal — shared list of purchases (expenses) or sales invoices
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Server component behind /trustees/expenses and /trustees/invoices: the
 * records dated in the selected period, newest first, each linking to
 * QuickFile when the web-link templates are configured.
 */

import Link from 'next/link';
import { getInvoices, getPurchases, type DocumentRow } from '@/lib/quickfile/reports';
import { quickFileUrl } from '@/lib/quickfile/links';
import { formatDate, formatGBP } from '@/lib/quickfile/format';
import { isSettled, statusLabel, statusRag } from '@/lib/quickfile/status';
import { Card, DateRangeForm, Empty, ErrorBox, PageHeading, RagBadge, errorMessage, type Period } from './ui';
import { numClass, primaryButtonClass, tableClass, tdClass, thClass } from './styles';

const KINDS = {
  // Unpaid expenses are listed first, as a group: they're the treasurer's priority.
  purchase: { title: 'Expenses', noun: 'expense', party: 'Supplier', addHref: '/trustees/expenses/new', addLabel: 'Add Expense', load: getPurchases, groupUnpaid: true },
  invoice: { title: 'Invoices', noun: 'invoice', party: 'Client', addHref: '/trustees/invoices/new', addLabel: 'Add Invoice', load: getInvoices, groupUnpaid: false },
};

const RAG_EDGE = { green: 'border-l-green-600', amber: 'border-l-amber-500', red: 'border-l-red-600' };

export default async function DocumentList({ kind, period, intro }: {
  kind: keyof typeof KINDS;
  period: Period;
  intro: string;
}) {
  const k = KINDS[kind];
  let rows: DocumentRow[];
  try {
    rows = await k.load(period.from, period.to);
  } catch (e) {
    return (<><PageHeading title={k.title} period={period} /><DateRangeForm period={period} /><ErrorBox message={errorMessage(e)} /></>);
  }
  // Newest first (ISO dates sort as strings); ties by ID, i.e. most recently created first.
  rows = [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const total = rows.reduce((s, r) => s + r.gross, 0);
  const hasLinks = rows.some((r) => quickFileUrl(kind, r.id));
  const columns = hasLinks ? 8 : 7;
  const groups: Array<{ title?: string; rows: DocumentRow[] }> = k.groupUnpaid
    ? [
        { title: 'Unpaid', rows: rows.filter((r) => !isSettled(r.status)) },
        { title: 'Paid & credit notes', rows: rows.filter((r) => isSettled(r.status)) },
      ].filter((g) => g.rows.length > 0)
    : [{ rows }];

  return (
    <>
      <PageHeading title={k.title} period={period}>{intro}</PageHeading>
      <DateRangeForm period={period} />

      <Card
        title={`${rows.length} ${k.noun}${rows.length === 1 ? '' : 's'}`}
        aside={<Link href={k.addHref} className={`${primaryButtonClass} inline-block`}>{k.addLabel}</Link>}
      >
        {rows.length === 0 ? (
          <Empty>No {k.noun}s in this period.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Number</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>{k.party}</th>
                  <th className={thClass}>Description</th>
                  <th className={thClass}>Project</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} ${numClass}`}>Amount</th>
                  {hasLinks && <th className={thClass}><span className="sr-only">Links</span></th>}
                </tr>
              </thead>
              {groups.map((g) => (
                <tbody key={g.title ?? 'all'}>
                  {g.title && (
                    <tr className="bg-gray-100">
                      <th scope="rowgroup" colSpan={columns} className="px-3 py-2 text-left font-semibold text-gray-900 border-l-[3px] border-l-transparent">
                        {g.title} · {g.rows.length} · {formatGBP(g.rows.reduce((s, r) => s + r.gross, 0))}
                      </th>
                    </tr>
                  )}
                  {g.rows.map((r) => {
                    const url = quickFileUrl(kind, r.id);
                    const rag = statusRag(r.status);
                    const label = statusLabel(r.status);
                    return (
                      <tr key={r.id}>
                        <td className={`${tdClass} whitespace-nowrap border-l-[3px] ${RAG_EDGE[rag]}`}>{r.number || '—'}</td>
                        <td className={`${tdClass} whitespace-nowrap`}>{r.date ? formatDate(r.date) : '—'}</td>
                        <td className={tdClass}>{r.party || '—'}</td>
                        <td className={tdClass}>{r.description || '—'}</td>
                        <td className={tdClass}>{r.tags.join(', ') || '—'}</td>
                        <td className={`${tdClass} whitespace-nowrap`}><RagBadge status={rag} labels={{ green: label, amber: label, red: label }} /></td>
                        <td className={`${tdClass} ${numClass}`}>{formatGBP(r.gross)}</td>
                        {hasLinks && (
                          <td className={`${tdClass} whitespace-nowrap`}>
                            {url && (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-chapel-600 hover:underline">
                                View in QuickFile<span className="sr-only"> ({k.noun} {r.number}, opens in a new tab)</span>
                              </a>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              ))}
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className={`${tdClass} border-l-[3px] border-l-transparent`} colSpan={6}>Total</td>
                  <td className={`${tdClass} ${numClass}`}>{formatGBP(total)}</td>
                  {hasLinks && <td className={tdClass} />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
