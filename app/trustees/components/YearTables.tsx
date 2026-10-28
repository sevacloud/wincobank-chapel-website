/**
 * Multi-year income & expenditure and bank-balance tables, shared by the
 * Annual Statement (this year vs prior) and 3-Year Comparison pages.
 */

import type { NominalLine, YearFigures } from '@/lib/quickfile/reports';
import { formatGBP, formatGBPAccounting } from '@/lib/quickfile/format';
import { numClass, tableClass, tdClass, thClass } from './styles';

export function NominalTable({ years }: { years: YearFigures[] }) {
  const amount = (y: YearFigures, code: number) => y.nominals.find((n) => n.code === code)?.amount ?? 0;

  const section = (category: NominalLine['category']) => {
    const names = new Map<number, string>();
    for (const y of years) for (const n of y.nominals) if (n.category === category && !names.has(n.code)) names.set(n.code, n.name);
    return [...names.entries()].sort(([a], [b]) => a - b);
  };
  const income = section('Income');
  const expenditure = section('Expenditure');
  const sum = (y: YearFigures, rows: Array<[number, string]>) => rows.reduce((s, [code]) => s + amount(y, code), 0);
  const cols = years.length + 2;

  const renderSection = (title: string, rows: Array<[number, string]>, totalLabel: string) => (
    <>
      <tr className="bg-gray-100">
        <td colSpan={cols} className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-700">{title}</td>
      </tr>
      {rows.map(([code, name]) => (
        <tr key={code}>
          <td className={`${tdClass} text-gray-500 w-16`}>{code}</td>
          <td className={tdClass}>{name || code}</td>
          {years.map((y) => <td key={y.fy.label} className={`${tdClass} ${numClass}`}>{formatGBP(amount(y, code))}</td>)}
        </tr>
      ))}
      <tr className="border-t-2 border-gray-200 font-bold">
        <td className={tdClass} />
        <td className={tdClass}>{totalLabel}</td>
        {years.map((y) => <td key={y.fy.label} className={`${tdClass} ${numClass}`}>{formatGBP(sum(y, rows))}</td>)}
      </tr>
    </>
  );

  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>Code</th>
            <th className={thClass}>Description</th>
            {years.map((y) => <th key={y.fy.label} className={`${thClass} ${numClass}`}>{y.fy.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {renderSection('Income and endowments', income, 'Total income and endowments')}
          {renderSection('Expenditure', expenditure, 'Total expenditure')}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-bold">
            <td className={tdClass} />
            <td className={tdClass}>Net income / (expenditure)</td>
            {years.map((y) => <td key={y.fy.label} className={`${tdClass} ${numClass}`}>{formatGBPAccounting(sum(y, income) - sum(y, expenditure))}</td>)}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function BalancesTable({ years }: { years: YearFigures[] }) {
  const accounts = years[0]?.balances.map((b) => b.account) ?? [];
  if (!accounts.length) return null;
  const balance = (y: YearFigures, bankId: number) => y.balances.find((b) => b.account.bankId === bankId)?.balance ?? null;

  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>Account</th>
            {years.map((y) => <th key={y.fy.label} className={`${thClass} ${numClass}`}>{y.fy.label}<br /><span className="font-normal text-xs">at {y.fy.to}</span></th>)}
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.bankId}>
              <td className={tdClass}>{a.name}</td>
              {years.map((y) => <td key={y.fy.label} className={`${tdClass} ${numClass}`}>{formatGBP(balance(y, a.bankId))}</td>)}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-bold">
            <td className={tdClass}>Total</td>
            {years.map((y) => (
              <td key={y.fy.label} className={`${tdClass} ${numClass}`}>
                {formatGBP(y.balances.reduce((s, b) => s + (b.balance ?? 0), 0))}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
