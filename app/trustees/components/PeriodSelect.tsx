'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { PERIOD_PAGES } from './PortalNav';

/** Financial-year selector; writes ?fy= so the period survives reloads and links. */
export default function PeriodSelect({ years }: { years: string[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (!PERIOD_PAGES.includes(pathname)) return null;
  const current = params.get('fy') ?? years[0];

  return (
    <div className="flex items-center justify-end gap-2 mb-4">
      <label htmlFor="fy" className="text-sm text-gray-600">Financial year</label>
      <select
        id="fy"
        value={current}
        disabled={pending}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          next.set('fy', e.target.value);
          next.delete('from');
          next.delete('to');
          startTransition(() => router.push(`${pathname}?${next}`));
        }}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-chapel-500"
      >
        {years.map((y, i) => (
          <option key={y} value={y}>{y}{i === 0 ? ' (current)' : ''}</option>
        ))}
      </select>
      {pending && <span className="text-xs text-gray-500" role="status">Loading…</span>}
    </div>
  );
}
