/**
 * API Route: GET /api/trustees/purchases/:id/pdf[?download=1]
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * A PDF summary of a purchase (expense), generated from the QuickFile record
 * (QuickFile's API has no purchase PDF — see purchase-pdf.ts).
 * Trustees only. Shown inline by default; ?download=1 saves it instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrustee } from '@/lib/trustees/auth';
import { getPurchase } from '@/lib/quickfile/submissions';
import { buildPurchasePdf } from '@/lib/quickfile/purchase-pdf';
import { QuickFileError } from '@/lib/quickfile/client';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const trustee = await getTrustee();
  if (!trustee || trustee.mustChangePassword) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401, headers: NO_STORE });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid purchase' }, { status: 400, headers: NO_STORE });
  }

  try {
    const purchase = await getPurchase(id);
    const bytes = await buildPurchasePdf({ id, ...purchase });
    const filename = `Purchase-${purchase.number.replace(/[^\w.-]+/g, '-')}.pdf`;
    const disposition = req.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        ...NO_STORE,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error(`GET /api/trustees/purchases/${id}/pdf error:`, err);
    const status = err instanceof QuickFileError ? err.status : 500;
    return NextResponse.json({ error: 'Could not build the purchase PDF' }, { status, headers: NO_STORE });
  }
}
