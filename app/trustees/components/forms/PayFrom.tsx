'use client';

import { createContext, useContext, useState } from 'react';
import { inputClass, labelClass } from '../styles';

/**
 * The chapel's three main accounts, matched by name (case-insensitive) in
 * the QuickFile bank account list. Each word is also used to narrow the
 * expense categories to that fund — e.g. "Trust" shows the Trust codes.
 */
const MAIN_ACCOUNTS = ['Trust', 'House', 'Chapel'];

export const fundOf = (accountName: string) =>
  MAIN_ACCOUNTS.find((w) => accountName.toLowerCase().includes(w.toLowerCase())) ?? null;

const FundContext = createContext<{ fund: string | null; setFund: (f: string | null) => void } | null>(null);

/** Shares the chosen account's fund between PayFromSelect and LineItems. */
export function PayFromProvider({ children }: { children: React.ReactNode }) {
  const [fund, setFund] = useState<string | null>(null);
  return <FundContext.Provider value={{ fund, setFund }}>{children}</FundContext.Provider>;
}

/** The chosen fund ("Trust", "House", "Chapel") or null — always null outside a PayFromProvider. */
export const useFund = () => useContext(FundContext)?.fund ?? null;

const linkButton = 'text-xs text-chapel-600 hover:underline mt-1';

export function PayFromSelect({ accounts }: { accounts: Array<{ nominalCode: number; name: string }> }) {
  const ctx = useContext(FundContext);
  const [value, setValue] = useState('');
  const main = MAIN_ACCOUNTS
    .map((w) => accounts.find((a) => fundOf(a.name) === w))
    .filter((a): a is { nominalCode: number; name: string } => !!a);
  const others = accounts.filter((a) => !main.includes(a));
  // Nothing to expand if none of the main accounts exist (e.g. renamed in QuickFile).
  const [showAll, setShowAll] = useState(main.length === 0);
  // A chosen "other" account stays listed after collapsing, so the selection isn't lost.
  const shown = showAll ? [...main, ...others] : [...main, ...others.filter((a) => String(a.nominalCode) === value)];

  return (
    <div>
      <label htmlFor="paid_from" className={labelClass}>Pay from which account? *</label>
      <select
        id="paid_from"
        name="paid_from"
        required
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          const account = accounts.find((a) => String(a.nominalCode) === e.target.value);
          ctx?.setFund(account ? fundOf(account.name) : null);
        }}
        className={inputClass}
      >
        <option value="" disabled>Choose an account…</option>
        {shown.map((a) => <option key={a.nominalCode} value={a.nominalCode}>{a.name}</option>)}
      </select>
      {others.length > 0 && main.length > 0 && (
        <button type="button" onClick={() => setShowAll((s) => !s)} className={linkButton}>
          {showAll ? 'Show main accounts only' : `Show ${others.length} more account${others.length === 1 ? '' : 's'}`}
        </button>
      )}
    </div>
  );
}
