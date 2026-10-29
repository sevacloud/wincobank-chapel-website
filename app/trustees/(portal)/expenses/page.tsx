/**
 * Trustee Portal — Expenses
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/expenses?fy=&from=&to=
 *
 * Lists QuickFile purchases in the period (see components/DocumentList).
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { resolvePeriod, type SearchParams } from '../../components/ui';
import DocumentList from '../../components/DocumentList';

export const metadata = { title: 'Expenses' };

export default async function ExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireTrustee();
  return <DocumentList kind="purchase" period={await resolvePeriod(searchParams)} intro="Purchases and expenses recorded in QuickFile." />;
}
