/**
 * Trustee Portal — Monthly Summary
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/monthly?fy=&from=&to=&account=
 *
 * Month-by-month income and spend from bank transactions, combined and per
 * account. ?account= narrows to one account; colours stay with the account.
 */

import Link from 'next/link';
import { requireTrustee } from '@/lib/trustees/auth';
import { getMonthlySummary, type AccountResult, type MonthlyTotals } from '@/lib/quickfile/reports';
import { formatGBP, formatGBPAccounting, monthLabel, monthsBetween } from '@/lib/quickfile/format';
import { Card, DateRangeForm, Empty, ErrorBox, PageHeading, WarningList, errorMessage, resolvePeriod, type SearchParams } from '../../components/ui';
import { numClass, tableClass, tdClass, thClass } from '../../components/styles';
import Chart from '../../components/Chart';

export const metadata = { title: 'Monthly Summary' };

export default async function MonthlyPage({ searchParams }: { searchParams: SearchParams }) {
  await requireTrustee();
  const period = await resolvePeriod(searchParams);
  const selected = Number((await searchParams).account) || null;

  let results: AccountResult<MonthlyTotals>[];
  try {
    results = await getMonthlySummary(period.from, period.to);
  } catch (e) {
    return (<><PageHeading title="Monthly Summary" period={period} /><DateRangeForm period={period} /><ErrorBox message={errorMessage(e)} /></>);
  }

  // Palette slot is fixed by position in the full account list.
  const slots = new Map(results.map((r, i) => [r.account.bankId, i]));
  const visible = results.filter((r) => !selected || r.account.bankId === selected);
  const months = monthsBetween(period.from, period.to);
  const cell = (r: AccountResult<MonthlyTotals>, m: string) => r.data?.[m] ?? { income: 0, expenditure: 0 };

  const combined = months.map((m) =>
    visible.reduce((t, r) => ({ income: t.income + cell(r, m).income, expenditure: t.expenditure + cell(r, m).expenditure }), { income: 0, expenditure: 0 }),
  );
  const hasData = combined.some((c) => c.income || c.expenditure);
  const labels = months.map(monthLabel);
  const qs = (account?: number) => {
    const p = new URLSearchParams({ fy: period.fy.label, from: period.from, to: period.to });
    if (account) p.set('account', String(account));
    return `?${p}`;
  };

  return (
    <>
      <PageHeading title="Monthly Summary" period={period}>Income and spend by month from bank transactions.</PageHeading>
      <DateRangeForm period={period} />

      {results.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {[{ id: 0, name: 'All accounts' }, ...results.map((r) => ({ id: r.account.bankId, name: r.account.name }))].map((a) => {
            const active = (selected ?? 0) === a.id;
            return (
              <Link
                key={a.id}
                href={qs(a.id || undefined)}
                className={`rounded-full px-3 py-1 text-sm border ${active ? 'bg-chapel-400 border-chapel-400 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                {a.name}
              </Link>
            );
          })}
        </div>
      )}

      <WarningList items={visible.filter((r) => r.error).map((r) => ({ label: r.account.name, message: r.error! }))} />

      {!hasData ? (
        <Empty>No transactions found for this period.</Empty>
      ) : (
        <>
          <Card title="Income vs Expenditure" aside={visible.length > 1 ? 'All selected accounts' : visible[0]?.account.name}>
            <Chart
              type="line"
              labels={labels}
              series={[
                { label: 'Income', data: combined.map((c) => c.income) },
                { label: 'Expenditure', data: combined.map((c) => c.expenditure) },
              ]}
              ariaLabel="Line chart of monthly income and expenditure. Figures are in the Monthly Breakdown table."
            />
          </Card>

          <Card title="Net Movement by Account">
            <Chart
              type="bar"
              labels={labels}
              series={visible.map((r) => ({
                label: r.account.name,
                data: months.map((m) => cell(r, m).income - cell(r, m).expenditure),
                slot: slots.get(r.account.bankId),
              }))}
              ariaLabel="Bar chart of monthly net movement per bank account. Figures are in the Monthly Breakdown table."
            />
          </Card>

          <Card title="Monthly Breakdown">
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Month</th>
                    {visible.map((r) => <th key={r.account.bankId} className={`${thClass} ${numClass}`}>{r.account.name}<br /><span className="font-normal text-xs">In / Out</span></th>)}
                    {visible.length > 1 && <th className={`${thClass} ${numClass}`}>Combined<br /><span className="font-normal text-xs">In / Out</span></th>}
                    <th className={`${thClass} ${numClass}`}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, i) => (
                    <tr key={m}>
                      <td className={tdClass}>{labels[i]}</td>
                      {visible.map((r) => (
                        <td key={r.account.bankId} className={`${tdClass} ${numClass}`}>
                          {formatGBP(cell(r, m).income)} / {formatGBP(cell(r, m).expenditure)}
                        </td>
                      ))}
                      {visible.length > 1 && (
                        <td className={`${tdClass} ${numClass} font-semibold`}>{formatGBP(combined[i].income)} / {formatGBP(combined[i].expenditure)}</td>
                      )}
                      <td className={`${tdClass} ${numClass} font-semibold`}>{formatGBPAccounting(combined[i].income - combined[i].expenditure)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td className={tdClass}>Total</td>
                    {visible.map((r) => {
                      const t = Object.values(r.data ?? {}).reduce((s, v) => ({ i: s.i + v.income, e: s.e + v.expenditure }), { i: 0, e: 0 });
                      return <td key={r.account.bankId} className={`${tdClass} ${numClass}`}>{formatGBP(t.i)} / {formatGBP(t.e)}</td>;
                    })}
                    {(() => {
                      const t = combined.reduce((s, c) => ({ i: s.i + c.income, e: s.e + c.expenditure }), { i: 0, e: 0 });
                      return (
                        <>
                          {visible.length > 1 && <td className={`${tdClass} ${numClass}`}>{formatGBP(t.i)} / {formatGBP(t.e)}</td>}
                          <td className={`${tdClass} ${numClass}`}>{formatGBPAccounting(t.i - t.e)}</td>
                        </>
                      );
                    })()}
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
