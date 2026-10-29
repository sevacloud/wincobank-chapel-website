/**
 * QuickFile reporting service (read-only)
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Maps QuickFile v2 responses into the shapes the trustee dashboard renders,
 * so the UI is insulated from QuickFile's field naming. Ported from the
 * quickfile-financial-dashboard WordPress plugin (QFD_API / QFD_REST).
 *
 * Configuration (environment):
 *   QUICKFILE_BANK_ACCOUNT_IDS  Optional comma list of bank IDs to show.
 *                               Defaults to every visible bank account.
 *   QUICKFILE_UTILITY_TAGS      Optional comma list of project tags used on
 *                               utility bills. Defaults to UTILITY_TAGS below.
 *   QUICKFILE_PROJECT_BUDGETS   Optional JSON map of project tag → budget (£),
 *                               e.g. {"Roof Repair": 12000}.
 */

import 'server-only';
import { qfGet, qfGetAll } from './client';
import { financialYear, type FinancialYear } from './financial-year';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BankAccount {
  bankId: number;
  nominalCode: number;
  name: string;
  bankType: string;
}

export interface Transaction {
  id: number;
  date: string;
  reference: string;
  notes: string;
  /** Signed: credits positive, debits negative */
  amount: number;
  balance: number;
}

export interface MonthTotals {
  income: number;
  expenditure: number;
}

/** YYYY-MM → totals */
export type MonthlyTotals = Record<string, MonthTotals>;

export interface NominalLine {
  code: number;
  name: string;
  amount: number;
  category: 'Income' | 'Expenditure';
}

export interface DocumentRow {
  id: number;
  number: string;
  date: string;
  party: string;
  description: string;
  status: string;
  net: number;
  gross: number;
  tags: string[];
}

export interface ProjectSummary {
  tag: string;
  invoices: DocumentRow[];
  purchases: DocumentRow[];
  income: number;
  spend: number;
  net: number;
  budget: number;
}

/** Per-account result that tolerates one account failing while others load. */
export type AccountResult<T> = { account: BankAccount } & ({ data: T; error: null } | { data: null; error: string });

const DEFAULT_UTILITY_TAGS = ['Gas', 'Electricity', 'Water', 'Broadband', 'Insurance', 'Alarm'];

const round2 = (n: number) => Math.round(n * 100) / 100;
const day = (s: unknown) => String(s ?? '').slice(0, 10);
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

// ---------------------------------------------------------------------------
// Bank accounts
// ---------------------------------------------------------------------------

export async function getBankAccounts(): Promise<BankAccount[]> {
  // 'types' omitted: absent means all account types.
  const raw = await qfGet<{ data?: Array<Record<string, unknown>> }>('bank_accounts', { include_hidden: false });
  const accounts = (raw.data ?? []).map((a) => ({
    bankId: Number(a.id ?? 0),
    nominalCode: Number(a.nominal_code ?? 0),
    name: String(a.name ?? ''),
    bankType: String(a.bank_type ?? ''),
  }));

  const allow = (process.env.QUICKFILE_BANK_ACCOUNT_IDS ?? '')
    .split(',').map((s) => Number(s.trim())).filter((n) => n > 0);
  return allow.length ? accounts.filter((a) => allow.includes(a.bankId)) : accounts;
}

export async function getAccountBalance(bankId: number): Promise<number> {
  const raw = await qfGet<{ balance?: number }>(`bank_accounts/${bankId}/balance`);
  return round2(Number(raw.balance ?? 0));
}

/** Every transaction for one account within a date range, newest first. */
export async function getTransactions(bankId: number, from: string, to: string): Promise<Transaction[]> {
  const rows = await qfGetAll<Record<string, unknown>>(`bank_accounts/${bankId}/transactions`, {
    date_from: from,
    date_to: to,
    order_column: 'date',
    order_direction: 'desc',
  });
  return rows.map((t) => ({
    id: Number(t.id ?? 0),
    date: day(t.date),
    reference: String(t.reference ?? ''),
    notes: String(t.notes ?? ''),
    amount: Number(t.amount ?? 0),
    balance: Number(t.balance ?? 0),
  }));
}

/** Bucket signed bank transactions into monthly income / expenditure. */
function aggregateMonthly(transactions: Transaction[]): MonthlyTotals {
  const months: MonthlyTotals = {};
  for (const t of transactions) {
    if (!t.date) continue;
    const m = (months[t.date.slice(0, 7)] ??= { income: 0, expenditure: 0 });
    if (t.amount >= 0) m.income += t.amount;
    else m.expenditure += -t.amount;
  }
  return Object.fromEntries(Object.entries(months).sort(([a], [b]) => a.localeCompare(b)));
}

async function perAccount<T>(accounts: BankAccount[], fn: (a: BankAccount) => Promise<T>): Promise<AccountResult<T>[]> {
  return Promise.all(accounts.map(async (account) => {
    try {
      return { account, data: await fn(account), error: null };
    } catch (e) {
      return { account, data: null, error: errorMessage(e) };
    }
  }));
}

export async function getMonthlySummary(from: string, to: string): Promise<AccountResult<MonthlyTotals>[]> {
  const accounts = await getBankAccounts();
  return perAccount(accounts, async (a) => aggregateMonthly(await getTransactions(a.bankId, from, to)));
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

/** Income and expenditure by nominal code. Turnover → Income; cost of sales and expenses → Expenditure. */
export async function getProfitAndLoss(from: string, to: string): Promise<NominalLine[]> {
  const raw = await qfGet<Record<string, Array<Record<string, unknown>> | undefined>>('reports/profit-and-loss', {
    date_from: from,
    date_to: to,
  });
  const sections: Array<[string, NominalLine['category']]> = [
    ['turnovers', 'Income'],
    ['less_cost_of_sales', 'Expenditure'],
    ['less_expenses', 'Expenditure'],
  ];
  return sections.flatMap(([section, category]) =>
    (raw[section] ?? []).map((e) => ({
      code: Number(e.nominal_code ?? 0),
      name: String(e.nominal_code_name ?? ''),
      amount: round2(Number(e.amount ?? 0)),
      category,
    })),
  );
}

/** Map of nominal code → balance-sheet amount at a date. */
export async function getBalanceSheet(to: string): Promise<Record<number, number>> {
  const raw = await qfGet<Record<string, Array<Record<string, unknown>> | undefined>>('reports/balance-sheet', { date_to: to });
  const balances: Record<number, number> = {};
  for (const section of ['fixed_assets', 'current_assets', 'current_liabilities', 'long_term_liabilities', 'capital_and_reserves']) {
    for (const item of raw[section] ?? []) {
      const code = Number(item.nominal_code ?? 0);
      if (code) balances[code] = round2(Number(item.amount ?? 0));
    }
  }
  return balances;
}

/** Bank balances at a date, read from the balance sheet (works for past years). */
export async function getBankBalancesAt(to: string): Promise<Array<{ account: BankAccount; balance: number | null }>> {
  const [accounts, bs] = await Promise.all([getBankAccounts(), getBalanceSheet(to)]);
  return accounts.map((account) => ({ account, balance: bs[account.nominalCode] ?? null }));
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface AccountOverview {
  account: BankAccount;
  error: string | null;
  opening: number | null;
  income: number;
  expenditure: number;
  /** Live balance for the current FY; closing balance for past years */
  closing: number | null;
}

export async function getDashboard(fy: FinancialYear, isCurrent: boolean): Promise<AccountOverview[]> {
  const accounts = await getBankAccounts();
  const closingFromBs = isCurrent ? null : await getBalanceSheet(fy.to).catch(() => null);

  return Promise.all(accounts.map(async (account): Promise<AccountOverview> => {
    try {
      const [months, live] = await Promise.all([
        getTransactions(account.bankId, fy.from, fy.to).then(aggregateMonthly),
        isCurrent ? getAccountBalance(account.bankId) : Promise.resolve(closingFromBs?.[account.nominalCode] ?? null),
      ]);
      const totals = Object.values(months).reduce(
        (acc, m) => ({ income: acc.income + m.income, expenditure: acc.expenditure + m.expenditure }),
        { income: 0, expenditure: 0 },
      );
      return {
        account,
        error: null,
        income: round2(totals.income),
        expenditure: round2(totals.expenditure),
        closing: live,
        // Opening balance: closing balance minus all movements in the period.
        opening: live === null ? null : round2(live - totals.income + totals.expenditure),
      };
    } catch (e) {
      return { account, error: errorMessage(e), opening: null, income: 0, expenditure: 0, closing: null };
    }
  }));
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function getProjectTags(): Promise<string[]> {
  // QuickFile caps /projects at 200 tags.
  const raw = await qfGet<unknown[]>('projects', { limit: 200 });
  return (Array.isArray(raw) ? raw : [])
    .map(String)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'en-GB', { numeric: true, sensitivity: 'base' }));
}

/** Sales invoices dated in the range, newest first; optionally only those with a project tag. */
export async function getInvoices(from: string, to: string, tag?: string): Promise<DocumentRow[]> {
  const rows = await qfGetAll<Record<string, unknown>>('invoices', {
    tag_name: tag,
    type: 'invoice',
    date_from: from,
    date_to: to,
    order_column: 'issue_date',
    order_direction: 'desc',
  });
  return rows.map((i) => ({
    id: Number(i.id ?? 0),
    number: String(i.invoice_number ?? ''),
    date: day(i.issue_date),
    party: String(i.client_company_name ?? i.client_contact_name ?? ''),
    description: String(i.description ?? ''),
    status: String(i.status ?? ''),
    net: Number(i.net_total ?? 0),
    gross: Number(i.gross_total ?? 0),
    tags: Array.isArray(i.tags) ? i.tags.map(String) : [],
  }));
}

/** Purchases dated in the range, newest first; optionally only those with a project tag. */
export async function getPurchases(from: string, to: string, tag?: string): Promise<DocumentRow[]> {
  const rows = await qfGetAll<Record<string, unknown>>('purchases', {
    tag_name: tag,
    date_from: from,
    date_to: to,
    order_column: 'receipt_date',
    order_direction: 'desc',
  });
  return rows.map((p) => ({
    id: Number(p.id ?? 0),
    number: String(p.receipt_number ?? ''),
    date: day(p.receipt_date),
    party: String(p.supplier_name ?? ''),
    description: String(p.description ?? ''),
    status: String(p.status ?? ''),
    net: Number(p.net_total ?? 0),
    gross: Number(p.gross_total ?? 0),
    tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
  }));
}

function projectBudgets(): Record<string, number> {
  try {
    const parsed = JSON.parse(process.env.QUICKFILE_PROJECT_BUDGETS || '{}');
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .map(([k, v]) => [k, Number(v)] as const)
        .filter(([, v]) => Number.isFinite(v) && v >= 0),
    );
  } catch {
    console.error('QUICKFILE_PROJECT_BUDGETS is not valid JSON — ignoring.');
    return {};
  }
}

/** Income (tagged sales invoices) vs spend (tagged purchases) per project tag. */
export async function getProjects(from: string, to: string): Promise<ProjectSummary[]> {
  const tags = await getProjectTags();
  const budgets = projectBudgets();
  const result: ProjectSummary[] = [];

  // Sequential per tag: QuickFile asks clients to avoid large parallel bursts.
  for (const tag of tags) {
    const [invoices, purchases] = await Promise.all([
      getInvoices(from, to, tag),
      getPurchases(from, to, tag),
    ]);
    const income = round2(invoices.reduce((s, i) => s + i.gross, 0));
    const spend = round2(purchases.reduce((s, p) => s + p.gross, 0));
    result.push({ tag, invoices, purchases, income, spend, net: round2(income - spend), budget: budgets[tag] ?? 0 });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Utility tag → YYYY-MM → spend. */
export async function getUtilities(from: string, to: string): Promise<Record<string, Record<string, number>>> {
  const configured = (process.env.QUICKFILE_UTILITY_TAGS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const tags = configured.length ? configured : DEFAULT_UTILITY_TAGS;

  const result: Record<string, Record<string, number>> = {};
  for (const tag of tags) {
    const months: Record<string, number> = {};
    for (const p of await getPurchases(from, to, tag)) {
      const m = p.date.slice(0, 7);
      if (m) months[m] = round2((months[m] ?? 0) + p.gross);
    }
    result[tag] = months;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Annual statement & year comparison
// ---------------------------------------------------------------------------

export interface YearFigures {
  fy: FinancialYear;
  nominals: NominalLine[];
  balances: Array<{ account: BankAccount; balance: number | null }>;
}

export async function getYearFigures(fy: FinancialYear): Promise<YearFigures> {
  const [nominals, balances] = await Promise.all([
    getProfitAndLoss(fy.from, fy.to),
    getBankBalancesAt(fy.to),
  ]);
  return { fy, nominals, balances };
}

/** The given year and the one before it — prior-year column comes straight from QuickFile. */
export async function getAnnualStatement(fy: FinancialYear): Promise<{ current: YearFigures; prior: YearFigures }> {
  const [current, prior] = await Promise.all([
    getYearFigures(fy),
    getYearFigures(financialYear(fy.startYear - 1)),
  ]);
  return { current, prior };
}

/** The three completed financial years before `current`, oldest first. */
export async function getYearComparison(current: FinancialYear): Promise<YearFigures[]> {
  const years = [3, 2, 1].map((n) => financialYear(current.startYear - n));
  return Promise.all(years.map(getYearFigures));
}
