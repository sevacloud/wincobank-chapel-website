/**
 * Trustee Portal — Projects
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/projects?fy=&from=&to=
 *
 * Income (tagged sales invoices) vs spend (tagged purchases) for each
 * QuickFile project tag, with optional budgets from QUICKFILE_PROJECT_BUDGETS.
 */

import { requireTrustee } from '@/lib/trustees/auth';
import { getProjects, type DocumentRow, type ProjectSummary } from '@/lib/quickfile/reports';
import { formatGBP, formatGBPAccounting } from '@/lib/quickfile/format';
import { statusLabel } from '@/lib/quickfile/status';
import { Card, DateRangeForm, Empty, ErrorBox, PageHeading, RagBadge, Stat, errorMessage, ragStatus, resolvePeriod, type SearchParams } from '../../components/ui';
import { numClass, tableClass, tdClass, thClass } from '../../components/styles';

export const metadata = { title: 'Projects' };

const BUDGET_LABELS = { green: 'Under budget', amber: 'Near limit', red: 'Over budget' } as const;

function DocumentTable({ rows, total, party }: { rows: DocumentRow[]; total: number; party: string }) {
  return (
    <div className="overflow-x-auto mt-3">
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>Number</th>
            <th className={thClass}>Date</th>
            <th className={thClass}>{party}</th>
            <th className={thClass}>Description</th>
            <th className={thClass}>Status</th>
            <th className={`${thClass} ${numClass}`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className={tdClass}>{r.number || '—'}</td>
              <td className={`${tdClass} whitespace-nowrap`}>{r.date || '—'}</td>
              <td className={tdClass}>{r.party || '—'}</td>
              <td className={tdClass}>{r.description || '—'}</td>
              <td className={tdClass}>{statusLabel(r.status)}</td>
              <td className={`${tdClass} ${numClass}`}>{formatGBP(r.gross)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-bold">
            <td className={tdClass} colSpan={5}>Total</td>
            <td className={`${tdClass} ${numClass}`}>{formatGBP(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ProjectCard({ p }: { p: ProjectSummary }) {
  const hasBudget = p.budget > 0;
  const remaining = p.budget - p.spend;
  const pct = hasBudget ? Math.min((p.spend / p.budget) * 100, 100) : 0;
  const rag = hasBudget ? ragStatus(remaining) : null;
  const bar = rag === 'red' ? 'bg-red-600' : rag === 'amber' ? 'bg-amber-500' : 'bg-chapel-400';

  return (
    <Card title={p.tag} aside={rag && <RagBadge status={rag} labels={BUDGET_LABELS} />}>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Income" value={formatGBP(p.income)} />
        <Stat label="Spend" value={formatGBP(p.spend)} />
        <Stat label="Net" value={formatGBPAccounting(p.net)} />
        <Stat label="Budget" value={hasBudget ? formatGBP(p.budget) : <span className="text-base font-normal text-gray-400">Not set</span>} />
        {hasBudget && <Stat label="Budget remaining" value={formatGBPAccounting(remaining)} />}
      </div>

      {hasBudget && (
        <div className="mt-4">
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{pct.toFixed(1)}% of budget used</p>
        </div>
      )}

      {p.invoices.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-chapel-600 hover:underline">{p.invoices.length} sales invoice(s)</summary>
          <DocumentTable rows={p.invoices} total={p.income} party="Client" />
        </details>
      )}
      {p.purchases.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-chapel-600 hover:underline">{p.purchases.length} purchase(s)</summary>
          <DocumentTable rows={p.purchases} total={p.spend} party="Supplier" />
        </details>
      )}
    </Card>
  );
}

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireTrustee();
  const period = await resolvePeriod(searchParams);

  let projects: ProjectSummary[];
  try {
    projects = await getProjects(period.from, period.to);
  } catch (e) {
    return (<><PageHeading title="Projects" period={period} /><DateRangeForm period={period} /><ErrorBox message={errorMessage(e)} /></>);
  }

  const income = projects.reduce((s, p) => s + p.income, 0);
  const spend = projects.reduce((s, p) => s + p.spend, 0);
  const budget = projects.reduce((s, p) => s + p.budget, 0);

  return (
    <>
      <PageHeading title="Projects" period={period}>Income and spend for each QuickFile project tag.</PageHeading>
      <DateRangeForm period={period} />

      {projects.length === 0 ? (
        <Empty>No project tags found in QuickFile.</Empty>
      ) : (
        <>
          <Card>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <Stat label="Projects" value={projects.length} />
              <Stat label="Total income" value={formatGBP(income)} />
              <Stat label="Total spend" value={formatGBP(spend)} />
              <Stat label="Net" value={formatGBPAccounting(income - spend)} />
              <Stat label="Total budget" value={budget > 0 ? formatGBP(budget) : '—'} />
            </div>
          </Card>
          {projects.map((p) => <ProjectCard key={p.tag} p={p} />)}
        </>
      )}
    </>
  );
}
