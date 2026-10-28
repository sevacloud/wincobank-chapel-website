/**
 * API Route: GET /api/trustees/transactions?account=&from=&to=
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Bank transactions for one account (feeds the Overview drawer).
 * Trustees only. The account must be one of the dashboard's bank accounts,
 * so the endpoint can't be used to read arbitrary QuickFile records.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrustee } from '@/lib/trustees/auth';
import { getAccountBalance, getBankAccounts, getTransactions } from '@/lib/quickfile/reports';
import { isIsoDate } from '@/lib/quickfile/financial-year';
import { QuickFileError } from '@/lib/quickfile/client';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  const trustee = await getTrustee();
  if (!trustee || trustee.mustChangePassword) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401, headers: NO_STORE });
  }

  const sp = req.nextUrl.searchParams;
  const bankId = Number(sp.get('account'));
  const from = sp.get('from');
  const to = sp.get('to');
  if (!Number.isInteger(bankId) || !isIsoDate(from) || !isIsoDate(to) || from > to) {
    return NextResponse.json({ error: 'Invalid account or date range' }, { status: 400, headers: NO_STORE });
  }

  try {
    const account = (await getBankAccounts()).find((a) => a.bankId === bankId);
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404, headers: NO_STORE });

    const [transactions, balance] = await Promise.all([
      getTransactions(bankId, from, to),
      getAccountBalance(bankId).catch(() => null),
    ]);
    return NextResponse.json({ balance, transactions }, { headers: NO_STORE });
  } catch (err) {
    console.error('GET /api/trustees/transactions error:', err);
    const status = err instanceof QuickFileError ? err.status : 500;
    return NextResponse.json({ error: 'Could not load transactions from QuickFile' }, { status, headers: NO_STORE });
  }
}
