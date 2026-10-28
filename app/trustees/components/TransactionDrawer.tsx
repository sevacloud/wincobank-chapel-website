'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDate, formatGBP, formatGBPAccounting } from '@/lib/quickfile/format';
import type { Transaction } from '@/lib/quickfile/reports';
import { inputClass, numClass, secondaryButtonClass, tableClass, tdClass, thClass } from './styles';

interface TransactionData {
  balance: number | null;
  transactions: Transaction[];
}

async function fetchTransactions(bankId: number, from: string, to: string): Promise<TransactionData> {
  const res = await fetch(`/api/trustees/transactions?${new URLSearchParams({ account: String(bankId), from, to })}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

interface Props {
  bankId: number;
  name: string;
  defaultFrom: string;
  defaultTo: string;
  onClose: () => void;
}

export default function TransactionDrawer({ bankId, name, defaultFrom, defaultTo, onClose }: Props) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((p: Promise<TransactionData>) => p
    .then((d) => { setData(d); setError(null); })
    .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
    .finally(() => setLoading(false)), []);

  // Initial load for the account's default period; later loads come from the form.
  useEffect(() => {
    apply(fetchTransactions(bankId, defaultFrom, defaultTo));
  }, [apply, bankId, defaultFrom, defaultTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden />
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white z-50 shadow-xl flex flex-col" role="dialog" aria-modal="true" aria-label={`${name} transactions`}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
            {data?.balance != null && <p className="text-sm text-gray-600">Current balance: <strong>{formatGBP(data.balance)}</strong></p>}
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900 text-xl leading-none" aria-label="Close">✕</button>
        </div>

        <form
          className="flex flex-wrap items-end gap-3 px-5 py-3 border-b border-gray-100"
          onSubmit={(e) => { e.preventDefault(); setLoading(true); apply(fetchTransactions(bankId, from, to)); }}
        >
          <label className="text-xs text-gray-600">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} /></label>
          <label className="text-xs text-gray-600">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} /></label>
          <button type="submit" disabled={loading} className={secondaryButtonClass}>{loading ? 'Loading…' : 'Load'}</button>
        </form>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          {loading && <p className="text-sm text-gray-500" role="status">Loading…</p>}
          {!loading && !error && data && data.transactions.length === 0 && (
            <p className="text-sm text-gray-500">No transactions found for this period.</p>
          )}
          {!loading && data && data.transactions.length > 0 && (
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Reference</th>
                  <th className={`${thClass} ${numClass}`}>Amount</th>
                  <th className={`${thClass} ${numClass}`}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatDate(t.date)}</td>
                    <td className={tdClass}>{t.reference || '—'}</td>
                    <td className={`${tdClass} ${numClass} font-semibold`}>{formatGBPAccounting(t.amount)}</td>
                    <td className={`${tdClass} ${numClass}`}>{formatGBP(t.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
