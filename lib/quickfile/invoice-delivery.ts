/**
 * Getting a sales invoice to the client
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Design notes:
 * - The PDF comes from GET invoices/{id}/get-pdf, which returns a link to
 *   QuickFile's rendered PDF. It is fetched server-side and streamed to the
 *   trustee, so the browser never needs a QuickFile session. The link is only
 *   followed if it points at QuickFile (or the configured API host — the
 *   local mock), and our API token is never sent with it.
 * - Emailing goes through POST invoices/{id}/send, which is also the only
 *   way the API can mark an invoice as sent. The contact must belong to the
 *   invoice's client and have an email address — re-checked before sending.
 */

import 'server-only';
import { QuickFileError, qfGetFresh, qfPost } from './client';

const PDF_TIMEOUT_MS = 30_000;
const MAX_PDF_BYTES = 20 * 1024 * 1024;

export interface InvoiceContact {
  id: number;
  name: string;
  email: string;
  isDefault: boolean;
}

const unwrap = (r: Record<string, unknown>) => (r.data as Record<string, unknown> | undefined) ?? r;

function allowedPdfHost(url: URL): boolean {
  const apiHost = new URL(process.env.QUICKFILE_API_URL || 'https://api-beta.quickfile.co.uk/').host;
  return (url.protocol === 'https:' && (url.hostname === 'quickfile.co.uk' || url.hostname.endsWith('.quickfile.co.uk'))) || url.host === apiHost;
}

export async function getInvoicePdf(invoiceId: number): Promise<{ bytes: ArrayBuffer; filename: string }> {
  const [invoice, pdf] = await Promise.all([
    qfGetFresh<Record<string, unknown>>(`invoices/${invoiceId}`).then(unwrap),
    qfGetFresh<Record<string, unknown>>(`invoices/${invoiceId}/get-pdf`).then(unwrap),
  ]);
  let url: URL;
  try {
    url = new URL(String(pdf.uri ?? ''));
  } catch {
    throw new QuickFileError('QuickFile did not return a PDF link for this invoice.');
  }
  if (!allowedPdfHost(url)) throw new QuickFileError(`Refusing to fetch the invoice PDF from ${url.host}.`);

  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(PDF_TIMEOUT_MS) });
  if (!res.ok) throw new QuickFileError(`Could not download the invoice PDF (HTTP ${res.status}).`);
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > MAX_PDF_BYTES) throw new QuickFileError('The invoice PDF is unexpectedly large.');

  const number = String(invoice.invoice_number ?? invoiceId).replace(/[^\w.-]+/g, '-');
  return { bytes, filename: `Invoice-${number}.pdf` };
}

export async function getInvoiceContacts(invoiceId: number): Promise<{ clientName: string; status: string; contacts: InvoiceContact[] }> {
  const invoice = unwrap(await qfGetFresh<Record<string, unknown>>(`invoices/${invoiceId}`));
  const clientId = Number(invoice.client_id ?? 0);
  if (!clientId) throw new QuickFileError('This invoice has no client.');
  const raw = await qfGetFresh<unknown>(`clients/${clientId}/contacts`);
  const rows = (Array.isArray(raw) ? raw : ((raw as { data?: unknown[] }).data ?? [])) as Array<Record<string, unknown>>;
  return {
    clientName: String(invoice.client_company_name ?? ''),
    status: String(invoice.status ?? ''),
    contacts: rows
      .map((c) => ({
        id: Number(c.id ?? 0),
        name: [c.first_name, c.surname].filter(Boolean).join(' ').trim(),
        email: String(c.email ?? '').trim(),
        isDefault: Boolean(c.is_default),
      }))
      .filter((c) => c.id),
  };
}

/** Emails the invoice via QuickFile, which marks it as sent. Returns the address used. */
export async function emailInvoice(invoiceId: number, contactId: number): Promise<string> {
  const { contacts } = await getInvoiceContacts(invoiceId);
  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) throw new QuickFileError('That contact does not belong to this invoice\'s client.', 400);
  if (!contact.email) throw new QuickFileError('That contact has no email address.', 400);

  const res = await qfPost<{ success?: boolean }>(`invoices/${invoiceId}/send`, {
    by_email: true,
    by_snail_mail: false,
    client_contact_id: contactId,
  });
  if (res.success === false) throw new QuickFileError('QuickFile did not send the invoice.');
  return contact.email;
}
