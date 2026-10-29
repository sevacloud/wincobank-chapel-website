import type { SubmittedRecord as RecordData } from '@/lib/quickfile/submissions';
import { formatDate, formatGBP } from '@/lib/quickfile/format';
import { statusLabel } from '@/lib/quickfile/status';
import { cardTitleClass, numClass, tableClass, tdClass, thClass } from '../styles';

/** Read-only view of a purchase or invoice as QuickFile stored it. */
export default function SubmittedRecord({ kind, number, partyName, record }: {
  kind: 'Purchase' | 'Invoice';
  number: string;
  partyName: string;
  record: RecordData;
}) {
  const isInvoice = kind === 'Invoice';
  const details: Array<[string, string]> = [
    [isInvoice ? 'Client' : 'Supplier', partyName],
    [isInvoice ? 'Issue date' : 'Receipt date', formatDate(record.date)],
    ...(record.dueDate ? [['Due date', formatDate(record.dueDate)] as [string, string]] : []),
    ...(record.termDays !== undefined ? [['Payment terms', `${record.termDays} days`] as [string, string]] : []),
    [isInvoice ? 'Purchase reference' : 'Receipt / invoice number', record.reference || '—'],
    ['Description', record.description || '—'],
    ['Project', record.tags.join(', ') || '—'],
    ['Status', statusLabel(record.status)],
  ];

  return (
    <section className="mt-6" aria-labelledby="submitted-record-title">
      <h3 id="submitted-record-title" className={cardTitleClass}>{kind} {number}</h3>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-sm mb-5">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Description</th>
              <th className={thClass}>Category</th>
              {isInvoice && <th className={`${thClass} text-right`}>Qty</th>}
              {isInvoice && <th className={`${thClass} text-right`}>Unit price</th>}
              <th className={`${thClass} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {record.lines.map((l, i) => (
              <tr key={i}>
                <td className={tdClass}>{l.description}</td>
                <td className={tdClass}>{l.nominalName ? `${l.nominalCode} · ${l.nominalName}` : l.nominalCode}</td>
                {isInvoice && <td className={`${tdClass} ${numClass}`}>{l.quantity}</td>}
                {isInvoice && <td className={`${tdClass} ${numClass}`}>{formatGBP(l.unitCost)}</td>}
                <td className={`${tdClass} ${numClass}`}>{formatGBP(l.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="px-3 py-2 font-semibold" colSpan={isInvoice ? 4 : 2}>Total</td>
              <td className={`px-3 py-2 font-semibold ${numClass}`}>{formatGBP(record.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
