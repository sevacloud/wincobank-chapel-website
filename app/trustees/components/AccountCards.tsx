'use client';

import { useCallback, useState } from 'react';
import { formatGBP } from '@/lib/quickfile/format';
import TransactionDrawer from './TransactionDrawer';

interface AccountCard {
  bankId: number;
  name: string;
  balance: number | null;
  opening: number | null;
  error: string | null;
}

export default function AccountCards({ accounts, balanceLabel, from, to }: {
  accounts: AccountCard[];
  balanceLabel: string;
  from: string;
  to: string;
}) {
  const [open, setOpen] = useState<AccountCard | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
        {accounts.map((a) => (
          <button
            key={a.bankId}
            type="button"
            onClick={() => setOpen(a)}
            className={`text-left bg-white border border-gray-200 border-t-4 rounded-lg p-5 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-chapel-500 ${
              a.error ? 'border-t-red-600' : 'border-t-chapel-400'
            }`}
          >
            <div className="text-sm text-gray-600">{a.name}</div>
            {a.error ? (
              <div className="text-sm text-red-700 mt-2">{a.error}</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{formatGBP(a.balance)}</div>
                <div className="text-xs text-gray-500 mt-1">{balanceLabel} · Opening {formatGBP(a.opening)}</div>
              </>
            )}
            <div className="text-xs text-chapel-600 mt-3">View transactions →</div>
          </button>
        ))}
      </div>
      {open && <TransactionDrawer bankId={open.bankId} name={open.name} defaultFrom={from} defaultTo={to} onClose={close} />}
    </>
  );
}
