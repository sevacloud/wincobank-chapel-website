/**
 * Financial year helpers
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Charity financial years run from QUICKFILE_FY_START_MONTH (default April)
 * for twelve months. Labels follow the "2025/26" convention; a January start
 * gives a single-year label ("2025").
 */

export interface FinancialYear {
  label: string;
  /** First day of the year, YYYY-MM-DD */
  from: string;
  /** Last day of the year, YYYY-MM-DD */
  to: string;
  /** Calendar year the FY starts in */
  startYear: number;
}

/** How many years the period selector offers (current + previous). */
const YEARS_OFFERED = 4;

export function fyStartMonth(): number {
  const m = Number(process.env.QUICKFILE_FY_START_MONTH ?? 4);
  return Number.isInteger(m) && m >= 1 && m <= 12 ? m : 4;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function financialYear(startYear: number, startMonth = fyStartMonth()): FinancialYear {
  const endMonth = startMonth === 1 ? 12 : startMonth - 1;
  const endYear = startMonth === 1 ? startYear : startYear + 1;
  // Day 0 of the following month = last day of endMonth.
  const endDay = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
  return {
    label: startYear === endYear ? String(startYear) : `${startYear}/${String(endYear).slice(2)}`,
    from: `${startYear}-${pad(startMonth)}-01`,
    to: `${endYear}-${pad(endMonth)}-${pad(endDay)}`,
    startYear,
  };
}

export function currentFinancialYear(now = new Date(), startMonth = fyStartMonth()): FinancialYear {
  const year = now.getMonth() + 1 >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
  return financialYear(year, startMonth);
}

/** Current FY first, then previous years, newest to oldest. */
export function financialYears(now = new Date()): FinancialYear[] {
  const current = currentFinancialYear(now);
  return Array.from({ length: YEARS_OFFERED }, (_, i) => financialYear(current.startYear - i));
}

/** Resolve a `?fy=2024/25` search param to a known year, defaulting to the current year. */
export function resolveFinancialYear(label: string | string[] | undefined): FinancialYear {
  const years = financialYears();
  return years.find((y) => y.label === label) ?? years[0];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(v: unknown): v is string {
  return typeof v === 'string' && ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));
}
