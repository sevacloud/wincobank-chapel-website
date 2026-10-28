/**
 * Trustee Portal — 3-Year Comparison
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/year-comparison?fy=
 *
 * Income and expenditure by nominal code for the three completed financial
 * years before the selected one, plus year-end bank balances.
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { getYearComparison, type YearFigures } from '@/lib/quickfile/reports';
import { Card, ErrorBox, PageHeading, errorMessage, resolvePeriod, type SearchParams } from '../../components/ui';
import { BalancesTable, NominalTable } from '../../components/YearTables';

export const metadata = { title: '3-Year Comparison' };

export default async function YearComparisonPage({ searchParams }: { searchParams: SearchParams }) {
  await requireTrustee();
  const period = await resolvePeriod(searchParams);
  const { fy } = period;

  let years: YearFigures[];
  try {
    years = await getYearComparison(fy);
  } catch (e) {
    return (<><PageHeading title="3-Year Comparison" period={period} /><ErrorBox message={errorMessage(e)} /></>);
  }

  return (
    <>
      <PageHeading title="3-Year Comparison" period={period}>
        The three financial years before {fy.label}.
      </PageHeading>
      <Card title="Income & Expenditure Comparison">
        <NominalTable years={years} />
      </Card>
      <Card title="Bank Account Balances at Year End">
        <BalancesTable years={years} />
      </Card>
    </>
  );
}
