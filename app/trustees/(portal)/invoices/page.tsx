/**
 * Trustee Portal — Invoices
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/invoices?fy=&from=&to=
 *
 * Lists QuickFile invoices in the period (see components/DocumentList).
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { resolvePeriod, type SearchParams } from '../../components/ui';
import DocumentList from '../../components/DocumentList';

export const metadata = { title: 'Invoices' };

export default async function InvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireTrustee();
  return <DocumentList kind="invoice" period={await resolvePeriod(searchParams)} intro="Sales invoices raised in QuickFile." />;
}
