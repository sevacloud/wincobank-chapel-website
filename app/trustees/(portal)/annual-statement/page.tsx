/**
 * Trustee Portal — Annual Statement
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/annual-statement?fy=
 *
 * Statement of Financial Activities (Charity SORP layout) for the selected
 * year, with the prior-year column taken from QuickFile's own P&L, and
 * bank balances at each year end. QuickFile's reports can't be filtered by
 * bank account, so these are combined figures.
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { getAnnualStatement, type YearFigures } from '@/lib/quickfile/reports';
import { Card, ErrorBox, PageHeading, errorMessage, resolvePeriod, type SearchParams } from '../../components/ui';
import { BalancesTable, NominalTable } from '../../components/YearTables';

export const metadata = { title: 'Annual Statement' };

export default async function AnnualStatementPage({ searchParams }: { searchParams: SearchParams }) {
  await requireTrustee();
  const { fy } = await resolvePeriod(searchParams);

  let years: YearFigures[];
  try {
    const { current, prior } = await getAnnualStatement(fy);
    years = [current, prior];
  } catch (e) {
    return (<><PageHeading title="Annual Statement" /><ErrorBox message={errorMessage(e)} /></>);
  }

  return (
    <>
      <PageHeading title="Annual Statement">
        Statement of Financial Activities (Charity SORP) · {fy.from} to {fy.to}
      </PageHeading>
      <Card title="Statement of Financial Activities" aside={fy.label}>
        <NominalTable years={years} />
      </Card>
      <Card title="Bank Account Balances at Year End">
        <BalancesTable years={years} />
      </Card>
    </>
  );
}
