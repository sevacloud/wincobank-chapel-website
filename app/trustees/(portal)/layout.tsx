/**
 * Trustee portal shell — auth gate, navigation, period selector
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Every route in the (portal) group renders inside this layout, which
 * redirects anyone who isn't a signed-in trustee to /trustees/login.
 * Pages and actions still call requireTrustee() themselves: layouts don't
 * re-run on client-side navigation, so they can't be the only check.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireTrustee } from '@/lib/trustees/auth';
import { financialYears } from '@/lib/quickfile/financial-year';
import { signOut } from '../actions';
import PortalNav from '../components/PortalNav';
import PeriodSelect from '../components/PeriodSelect';

export const metadata: Metadata = {
  title: { default: 'Trustee Portal', template: '%s — Trustee Portal' },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Pages enforce the temporary-password redirect themselves (the account page must stay reachable).
  const trustee = await requireTrustee({ allowTemporaryPassword: true });
  const years = financialYears().map((y) => y.label);

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:flex lg:gap-8">
        <aside className="lg:w-56 lg:shrink-0 mb-6 lg:mb-0">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Trustee Portal</p>
            <p className="text-sm font-medium text-gray-900 truncate" title={trustee.email}>{trustee.name}</p>
          </div>
          <Suspense>
            <PortalNav />
          </Suspense>
          <form action={signOut} className="mt-6">
            <button type="submit" className="text-sm text-gray-600 hover:text-gray-900 underline">Sign out</button>
          </form>
        </aside>
        <div className="flex-1 min-w-0">
          <Suspense>
            <PeriodSelect years={years} />
          </Suspense>
          {children}
        </div>
      </div>
    </div>
  );
}
