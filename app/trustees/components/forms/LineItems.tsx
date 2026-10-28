'use client';

import { useState } from 'react';
import type { NominalCode } from '@/lib/quickfile/submissions';
import { formatGBP } from '@/lib/quickfile/format';
import { inputClass, labelClass, secondaryButtonClass } from '../styles';

interface Line { key: number; amount: string; qty: string }

/**
 * Repeating line items. Posts parallel arrays: line_description[],
 * line_nominal[], line_amount[] and (invoices) line_qty[].
 */
export default function LineItems({ codes, withQuantity, defaultCode }: {
  codes: NominalCode[];
  withQuantity: boolean;
  defaultCode?: number;
}) {
  const [lines, setLines] = useState<Line[]>([{ key: 0, amount: '', qty: '1' }]);
  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0) * (withQuantity ? Number(l.qty) || 0 : 1), 0);

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-900 mb-2">{withQuantity ? 'Items' : 'What was bought'}</legend>
      <div className="space-y-3">
        {lines.map((l, i) => (
          <div key={l.key} className={`grid gap-2 items-end ${withQuantity ? 'sm:grid-cols-[1fr_12rem_5rem_8rem_auto]' : 'sm:grid-cols-[1fr_12rem_8rem_auto]'}`}>
            <div>
              <label htmlFor={`desc-${l.key}`} className={labelClass}>Description</label>
              <input id={`desc-${l.key}`} name="line_description" required minLength={2} maxLength={500} className={inputClass} />
            </div>
            <div>
              <label htmlFor={`code-${l.key}`} className={labelClass}>Category</label>
              <select id={`code-${l.key}`} name="line_nominal" required defaultValue={defaultCode ?? ''} className={inputClass}>
                <option value="" disabled>Choose…</option>
                {codes.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
              </select>
            </div>
            {withQuantity && (
              <div>
                <label htmlFor={`qty-${l.key}`} className={labelClass}>Qty</label>
                <input id={`qty-${l.key}`} name="line_qty" type="number" min="0.01" step="0.01" required value={l.qty} onChange={(e) => update(l.key, { qty: e.target.value })} className={inputClass} />
              </div>
            )}
            <div>
              <label htmlFor={`amount-${l.key}`} className={labelClass}>{withQuantity ? 'Unit price £' : 'Amount £'}</label>
              <input id={`amount-${l.key}`} name="line_amount" inputMode="decimal" pattern="\d+(\.\d{1,2})?" required placeholder="0.00" value={l.amount} onChange={(e) => update(l.key, { amount: e.target.value })} className={inputClass} />
            </div>
            <button
              type="button"
              onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
              disabled={lines.length === 1}
              className={`${secondaryButtonClass} mb-0.5`}
              aria-label={`Remove line ${i + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={() => setLines((ls) => [...ls, { key: Math.max(...ls.map((x) => x.key)) + 1, amount: '', qty: '1' }])}
          disabled={lines.length >= 20}
          className={secondaryButtonClass}
        >
          + Add line
        </button>
        <p className="text-sm text-gray-700">Total <strong className="tabular-nums">{formatGBP(total)}</strong></p>
      </div>
    </fieldset>
  );
}
