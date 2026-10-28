/**
 * Trustee Portal — Overview
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees
 *
 * Balance per bank account for the selected financial year: opening,
 * income, spend, net movement and live (or year-end) balance. Clicking an
 * account opens its transactions.
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { getDashboard, type AccountOverview } from '@/lib/quickfile/reports';
import { formatGBP, formatGBPAccounting } from '@/lib/quickfile/format';
import { Card, ErrorBox, PageHeading, RagBadge, WarningList, errorMessage, ragStatus, resolvePeriod, type SearchParams } from '../components/ui';
import { numClass, tableClass, tdClass, thClass } from '../components/styles';
import AccountCards from '../components/AccountCards';

export const metadata = { title: 'Overview' };

const NET_LABELS = { green: 'On budget', amber: 'Near limit', red: 'Over limit' } as const;

export default async function OverviewPage({ searchParams }: { searchParams: SearchParams }) {
  await requireTrustee();
  const period = await resolvePeriod(searchParams);
  const { fy, isCurrentFY } = period;

  let rows: AccountOverview[];
  try {
    rows = await getDashboard(fy, isCurrentFY);
  } catch (e) {
    return (<><PageHeading title="Overview" period={period} /><ErrorBox message={errorMessage(e)} /></>);
  }

  const ok = rows.filter((r) => !r.error);
  const totals = ok.reduce(
    (t, r) => ({
      opening: t.opening + (r.opening ?? 0),
      income: t.income + r.income,
      expenditure: t.expenditure + r.expenditure,
      closing: t.closing + (r.closing ?? 0),
    }),
    { opening: 0, income: 0, expenditure: 0, closing: 0 },
  );
  const totalNet = totals.income - totals.expenditure;
  const balanceLabel = isCurrentFY ? 'Live balance' : 'Closing balance';

  return (
    <>
      <PageHeading title="Overview" period={period}>Financial year {fy.label} · {fy.from} to {fy.to}</PageHeading>

      <WarningList items={rows.filter((r) => r.error).map((r) => ({ label: r.account.name, message: r.error! }))} />

      <AccountCards
        accounts={rows.map((r) => ({
          bankId: r.account.bankId,
          name: r.account.name,
          balance: r.closing,
          opening: r.opening,
          error: r.error,
        }))}
        balanceLabel={balanceLabel}
        from={fy.from}
        to={fy.to}
      />

      <Card title={`Account Summary — Financial Year ${fy.label}`}>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Account</th>
                <th className={`${thClass} ${numClass}`}>Opening balance</th>
                <th className={`${thClass} ${numClass}`}>Income</th>
                <th className={`${thClass} ${numClass}`}>Spend</th>
                <th className={`${thClass} ${numClass}`}>Net movement</th>
                <th className={`${thClass} ${numClass}`}>{balanceLabel}</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const net = r.income - r.expenditure;
                return (
                  <tr key={r.account.bankId}>
                    <td className={`${tdClass} font-medium`}>{r.account.name}</td>
                    {r.error ? (
                      <td className={`${tdClass} text-red-700`} colSpan={6}>{r.error}</td>
                    ) : (
                      <>
                        <td className={`${tdClass} ${numClass}`}>{formatGBP(r.opening)}</td>
                        <td className={`${tdClass} ${numClass}`}>{formatGBP(r.income)}</td>
                        <td className={`${tdClass} ${numClass}`}>{formatGBP(r.expenditure)}</td>
                        <td className={`${tdClass} ${numClass} font-semibold`}>{formatGBPAccounting(net)}</td>
                        <td className={`${tdClass} ${numClass} font-bold`}>{formatGBP(r.closing)}</td>
                        <td className={tdClass}><RagBadge status={ragStatus(net)} labels={NET_LABELS} /></td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className={tdClass}>Combined</td>
                <td className={`${tdClass} ${numClass}`}>{formatGBP(totals.opening)}</td>
                <td className={`${tdClass} ${numClass}`}>{formatGBP(totals.income)}</td>
                <td className={`${tdClass} ${numClass}`}>{formatGBP(totals.expenditure)}</td>
                <td className={`${tdClass} ${numClass}`}>{formatGBPAccounting(totalNet)}</td>
                <td className={`${tdClass} ${numClass}`}>{formatGBP(totals.closing)}</td>
                <td className={tdClass}><RagBadge status={ragStatus(totalNet)} labels={NET_LABELS} /></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <p className="text-xs text-gray-500">
        Figures cached for up to 15 minutes. Opening balance = {balanceLabel.toLowerCase()} minus all transactions in the period.
      </p>
    </>
  );
}
