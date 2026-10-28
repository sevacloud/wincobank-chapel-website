/**
 * Trustee Portal — Utilities
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/utilities?fy=&from=&to=
 *
 * Monthly spend on utility bills, from purchases tagged with the utility
 * project tags (Gas, Electricity, Water, … — see QUICKFILE_UTILITY_TAGS).
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { getUtilities } from '@/lib/quickfile/reports';
import { formatGBP, monthLabel, monthsBetween } from '@/lib/quickfile/format';
import { Card, DateRangeForm, Empty, ErrorBox, PageHeading, errorMessage, resolvePeriod, type SearchParams } from '../../components/ui';
import { numClass, tableClass, tdClass, thClass } from '../../components/styles';
import Chart from '../../components/Chart';

export const metadata = { title: 'Utilities' };

const UTILITY_LABELS: Record<string, string> = {
  Broadband: 'Broadband / Phone',
  Alarm: 'Alarm / Security',
};

export default async function UtilitiesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireTrustee();
  const period = await resolvePeriod(searchParams);

  let data: Record<string, Record<string, number>>;
  try {
    data = await getUtilities(period.from, period.to);
  } catch (e) {
    return (<><PageHeading title="Utilities" period={period} /><DateRangeForm period={period} /><ErrorBox message={errorMessage(e)} /></>);
  }

  const months = monthsBetween(period.from, period.to);
  const tags = Object.keys(data);
  const rowTotal = (tag: string) => Object.values(data[tag]).reduce((s, v) => s + v, 0);
  const monthTotal = (m: string) => tags.reduce((s, t) => s + (data[t][m] ?? 0), 0);
  const grand = tags.reduce((s, t) => s + rowTotal(t), 0);

  return (
    <>
      <PageHeading title="Utilities" period={period}>Monthly utility costs, from purchases tagged in QuickFile.</PageHeading>
      <DateRangeForm period={period} />

      {grand === 0 ? (
        <Empty>No tagged utility purchases found for this period.</Empty>
      ) : (
        <>
          <Card title="Monthly Utility Costs">
            <Chart
              type="line"
              labels={months.map(monthLabel)}
              series={tags.map((t) => ({ label: UTILITY_LABELS[t] ?? t, data: months.map((m) => data[t][m] ?? 0) }))}
              ariaLabel="Line chart of monthly cost per utility. Figures are in the breakdown table."
            />
          </Card>

          <Card title="Monthly Breakdown by Utility">
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Utility</th>
                    {months.map((m) => <th key={m} className={`${thClass} ${numClass}`}>{monthLabel(m)}</th>)}
                    <th className={`${thClass} ${numClass}`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((t) => (
                    <tr key={t}>
                      <td className={tdClass}>{UTILITY_LABELS[t] ?? t}</td>
                      {months.map((m) => <td key={m} className={`${tdClass} ${numClass}`}>{data[t][m] ? formatGBP(data[t][m]) : '—'}</td>)}
                      <td className={`${tdClass} ${numClass} font-bold`}>{formatGBP(rowTotal(t))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td className={tdClass}>Total</td>
                    {months.map((m) => <td key={m} className={`${tdClass} ${numClass}`}>{formatGBP(monthTotal(m))}</td>)}
                    <td className={`${tdClass} ${numClass}`}>{formatGBP(grand)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
