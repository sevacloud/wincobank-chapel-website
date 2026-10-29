/**
 * API Route: GET /api/trustees/invoices/:id/pdf[?download=1]
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * A sales invoice's PDF, fetched from QuickFile (see invoice-delivery.ts).
 * Trustees only. Shown inline by default; ?download=1 saves it instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrustee } from '@/lib/trustees/auth';
import { getInvoicePdf } from '@/lib/quickfile/invoice-delivery';
import { QuickFileError } from '@/lib/quickfile/client';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const trustee = await getTrustee();
  if (!trustee || trustee.mustChangePassword) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401, headers: NO_STORE });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid invoice' }, { status: 400, headers: NO_STORE });
  }

  try {
    const { bytes, filename } = await getInvoicePdf(id);
    const disposition = req.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';
    return new NextResponse(bytes, {
      headers: {
        ...NO_STORE,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error(`GET /api/trustees/invoices/${id}/pdf error:`, err);
    const status = err instanceof QuickFileError ? err.status : 500;
    return NextResponse.json({ error: 'Could not load the invoice PDF from QuickFile' }, { status, headers: NO_STORE });
  }
}
