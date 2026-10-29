/**
 * QuickFile submission service (writes)
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Trustees submit expenses (QuickFile purchases) and sales invoices directly
 * into QuickFile — there is no intermediate approval queue.
 *
 * Design notes:
 * - The trustee either picks an existing supplier/client (by QuickFile ID) or
 *   enters a new one, which is created first. Creating a duplicate name is
 *   refused so the ledger doesn't fill with near-identical contacts.
 * - Every expense is recorded unpaid — the treasurer pays it from one of the
 *   chapel's accounts and records the payment. The trustee's choice of
 *   account is only a note to the treasurer about where it should come from.
 * - The chapel is not VAT registered, so every line is posted at 0% VAT.
 * - The purchase/invoice is created first, then each supporting file is
 *   attached. QuickFile's record-level attachments are aimed at receipts and
 *   images; if it rejects a file (e.g. a .txt), it is filed in Document
 *   Management under EVIDENCE_COLLECTION, prefixed with the record number,
 *   so nothing the trustee uploaded is lost. Upload failures never undo the
 *   created record — the trustee is told exactly which files need re-sending.
 * - After creating, the record is read back so the trustee sees what
 *   QuickFile actually stored, with a "View in QuickFile" link (see links.ts).
 */

import 'server-only';
import { qfGet, qfGetAll, qfPost, qfUpload } from './client';
import { getBankAccounts } from './reports';
import { quickFileUrl } from './links';

/** Document Management folder for evidence QuickFile won't attach directly. */
const EVIDENCE_COLLECTION = 'Trustee Submissions';

// ---------------------------------------------------------------------------
// Lookups for form dropdowns
// ---------------------------------------------------------------------------

export interface NominalCode {
  code: number;
  name: string;
}

export interface Contact {
  id: number;
  name: string;
}

export interface FormOptions {
  purchaseCodes: NominalCode[];
  salesCodes: NominalCode[];
  suppliers: Contact[];
  clients: Contact[];
  projectTags: string[];
  bankAccounts: Array<{ nominalCode: number; name: string }>;
}

async function getNominals(): Promise<Array<NominalCode & { isPurchase: boolean; isSales: boolean }>> {
  const raw = await qfGet<unknown>('ledgers/nominals');
  const rows = (Array.isArray(raw) ? raw : ((raw as { data?: unknown[] }).data ?? [])) as Array<Record<string, unknown>>;
  return rows
    .map((n) => ({
      code: Number(n.nominal_code ?? 0),
      name: String(n.name ?? ''),
      isPurchase: Boolean(n.is_purchase_code),
      isSales: Boolean(n.is_sales_code),
    }))
    .filter((n) => n.code > 0)
    .sort((a, b) => a.code - b.code);
}

async function listContacts(path: 'suppliers' | 'clients'): Promise<Contact[]> {
  const rows = await qfGetAll<Record<string, unknown>>(path, { order_column: 'company_name', order_direction: 'asc' });
  return rows
    .map((r) => ({ id: Number(r.id ?? 0), name: String(r.company_name ?? '').trim() }))
    .filter((r) => r.id && r.name);
}

export async function getFormOptions(): Promise<FormOptions> {
  const [nominals, suppliers, clients, projectTags, bankAccounts] = await Promise.all([
    getNominals(),
    listContacts('suppliers'),
    listContacts('clients'),
    qfGet<unknown[]>('projects', { limit: 200 }).then((r) => (Array.isArray(r) ? r.map(String).filter(Boolean).sort() : [])),
    getBankAccounts(),
  ]);
  return {
    purchaseCodes: nominals.filter((n) => n.isPurchase).map(({ code, name }) => ({ code, name })),
    salesCodes: nominals.filter((n) => n.isSales).map(({ code, name }) => ({ code, name })),
    suppliers,
    clients,
    projectTags,
    bankAccounts: bankAccounts.map((a) => ({ nominalCode: a.nominalCode, name: a.name })),
  };
}

// ---------------------------------------------------------------------------
// Suppliers & clients
// ---------------------------------------------------------------------------

export interface NewContactDetails {
  companyName: string;
  firstName: string;
  surname: string;
  email: string;
  telephone: string;
  addressLine1: string;
  addressLine2: string;
  town: string;
  postCode: string;
}

export type PartyInput = { kind: 'existing'; id: number } | { kind: 'new'; details: NewContactDetails };

export class SubmissionError extends Error {}

const sameName = (a: string, b: string) => a.localeCompare(b, 'en-GB', { sensitivity: 'base' }) === 0;
const idOf = (r: unknown) => Number((r as { id?: number }).id ?? (r as { data?: { id?: number } }).data?.id ?? 0);
const orUndefined = (s: string) => s.trim() || undefined;

function address(d: NewContactDetails) {
  return {
    address_line1: orUndefined(d.addressLine1),
    address_line2: orUndefined(d.addressLine2),
    town: orUndefined(d.town),
    post_code: orUndefined(d.postCode),
    country_iso: d.addressLine1 || d.postCode ? 'GB' : undefined,
  };
}

async function resolveParty(path: 'suppliers' | 'clients', party: PartyInput): Promise<{ id: number; name: string }> {
  const existing = await listContacts(path);
  const label = path === 'suppliers' ? 'supplier' : 'client';

  if (party.kind === 'existing') {
    const match = existing.find((c) => c.id === party.id);
    if (!match) throw new SubmissionError(`That ${label} no longer exists in QuickFile — please choose again.`);
    return match;
  }

  const d = party.details;
  const clash = existing.find((c) => sameName(c.name, d.companyName));
  if (clash) {
    throw new SubmissionError(`A ${label} called "${clash.name}" already exists — choose it from the list instead of adding a new one.`);
  }

  if (path === 'suppliers') {
    const id = idOf(await qfPost('suppliers', {
      company_name: d.companyName,
      contact_first_name: orUndefined(d.firstName),
      contact_surname: orUndefined(d.surname),
      contact_email: orUndefined(d.email),
      contact_telephone: orUndefined(d.telephone),
      ...address(d),
    }));
    if (!id) throw new SubmissionError(`QuickFile did not return an ID for new supplier "${d.companyName}".`);
    return { id, name: d.companyName };
  }

  const id = idOf(await qfPost('clients', { company_name: d.companyName, ...address(d) }));
  if (!id) throw new SubmissionError(`QuickFile did not return an ID for new client "${d.companyName}".`);
  // Client contacts are a separate resource; QuickFile requires first name, surname and email.
  if (d.firstName && d.surname && d.email) {
    await qfPost(`clients/${id}/contacts`, {
      first_name: d.firstName,
      surname: d.surname,
      email: d.email,
      telephone1: orUndefined(d.telephone),
      is_default: true,
    }).catch((e) => console.error('[QuickFile] could not add client contact:', e));
  }
  return { id, name: d.companyName };
}

// ---------------------------------------------------------------------------
// Supporting evidence
// ---------------------------------------------------------------------------

export interface FileOutcome {
  name: string;
  /** 'attached' to the record, 'filed' in Document Management, or 'failed' */
  status: 'attached' | 'filed' | 'failed';
  error?: string;
}

async function uploadEvidence(
  files: File[],
  recordLabel: string,
  endpoint: 'documents/receipt' | 'documents/sales',
  attachForm: (file: File) => FormData,
): Promise<FileOutcome[]> {
  const outcomes: FileOutcome[] = [];
  // Sequential: QuickFile asks clients to avoid parallel bursts.
  for (const file of files) {
    try {
      await qfUpload(endpoint, attachForm(file));
      outcomes.push({ name: file.name, status: 'attached' });
      continue;
    } catch (e) {
      console.error(`[QuickFile] attach "${file.name}" to ${recordLabel} failed, filing instead:`, e);
    }
    try {
      const form = new FormData();
      form.set('file', file, `${recordLabel} - ${file.name}`);
      form.set('collection_name', EVIDENCE_COLLECTION);
      await qfUpload('documents/general', form);
      outcomes.push({ name: file.name, status: 'filed' });
    } catch (e) {
      outcomes.push({ name: file.name, status: 'failed', error: e instanceof Error ? e.message : String(e) });
    }
  }
  return outcomes;
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export interface Submitter {
  name: string;
  email: string;
}

export interface LineInput {
  nominalCode: number;
  description: string;
  amount: number;
}

export interface ExpenseInput {
  supplier: PartyInput;
  receiptDate: string;
  reference: string;
  description: string;
  lines: LineInput[];
  projectTag: string;
  /** Chapel bank account name the treasurer should pay from */
  payFromAccount: string;
  files: File[];
}

export interface InvoiceLineInput extends LineInput {
  quantity: number;
}

export interface InvoiceInput {
  client: PartyInput;
  issueDate: string;
  termDays: number;
  reference: string;
  description: string;
  notes: string;
  lines: InvoiceLineInput[];
  projectTag: string;
  files: File[];
}

export interface RecordLine {
  description: string;
  nominalCode: number;
  /** Filled in by the caller from its nominal lookups */
  nominalName?: string;
  /** Invoices only */
  quantity?: number;
  /** Invoices only */
  unitCost?: number;
  total: number;
}

/** The purchase or invoice as QuickFile stored it */
export interface SubmittedRecord {
  date: string;
  /** Purchases: receipt due date; invoices: payment terms in days */
  dueDate?: string;
  termDays?: number;
  reference: string;
  description: string;
  status: string;
  tags: string[];
  lines: RecordLine[];
  total: number;
}

export interface SubmissionResult {
  id: number;
  number: string;
  partyName: string;
  total: number;
  files: FileOutcome[];
  /** Null if reading the record back failed — it was still created */
  record: SubmittedRecord | null;
  viewUrl: string | null;
}

const str = (v: unknown) => (v == null ? '' : String(v));
const num = (v: unknown) => Number(v ?? 0);
const tagsOf = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

async function readBack<T>(path: string, map: (r: Record<string, unknown>) => T): Promise<T | null> {
  try {
    const raw = await qfGet<Record<string, unknown>>(path);
    return map((raw.data as Record<string, unknown> | undefined) ?? raw);
  } catch (e) {
    // Never throw: the record exists, and an error here would invite a resubmit.
    console.error(`[QuickFile] reading back ${path} failed:`, e);
    return null;
  }
}

const mapPurchase = (p: Record<string, unknown>): SubmittedRecord => ({
  date: str(p.receipt_date),
  dueDate: str(p.due_date) || undefined,
  reference: str(p.supplier_reference),
  description: str(p.description),
  status: str(p.status),
  tags: tagsOf(p.tags),
  lines: ((p.item_lines as Array<Record<string, unknown>>) ?? []).map((l) => ({
    description: str(l.description),
    nominalCode: num(l.nominal_code),
    total: num(l.line_total ?? l.sub_total),
  })),
  total: num(p.gross_total),
});

const readPurchase = (id: number) => readBack(`purchases/${id}`, mapPurchase);

/** A purchase as QuickFile stored it, with nominal names filled in (throws on failure). */
export async function getPurchase(id: number): Promise<{ number: string; supplierName: string; record: SubmittedRecord }> {
  const [raw, nominals] = await Promise.all([qfGet<Record<string, unknown>>(`purchases/${id}`), getNominals()]);
  const p = (raw.data as Record<string, unknown> | undefined) ?? raw;
  const names = new Map(nominals.map((n) => [n.code, n.name]));
  const record = mapPurchase(p);
  record.lines = record.lines.map((l) => ({ ...l, nominalName: names.get(l.nominalCode) }));
  return { number: str(p.receipt_number) || String(id), supplierName: str(p.supplier_name), record };
}

const readInvoice = (id: number) => readBack(`invoices/${id}`, (i): SubmittedRecord => ({
  date: str(i.issue_date),
  termDays: i.term_days == null ? undefined : num(i.term_days),
  reference: str(i.purchase_reference),
  description: str(i.description),
  status: str(i.status),
  tags: tagsOf(i.tags),
  lines: ((i.item_lines as Array<Record<string, unknown>>) ?? []).map((l) => ({
    description: str(l.description || l.item_name),
    nominalCode: num(l.nominal_code),
    quantity: num(l.qty),
    unitCost: num(l.unit_cost),
    total: num(l.line_total),
  })),
  total: num(i.gross_total),
}));

const round2 = (n: number) => Math.round(n * 100) / 100;
const field = (r: Record<string, unknown>, key: string) =>
  r[key] ?? (r.data as Record<string, unknown> | undefined)?.[key];

export async function submitExpense(input: ExpenseInput, by: Submitter): Promise<SubmissionResult> {
  const supplier = await resolveParty('suppliers', input.supplier);
  const total = round2(input.lines.reduce((s, l) => s + l.amount, 0));

  const purchase = await qfPost<Record<string, unknown>>('purchases', {
    supplier_id: supplier.id,
    receipt_date: input.receiptDate,
    currency: 'GBP',
    // QuickFile caps the purchase description at 35 characters, so who
    // submitted it (and how it should be paid) goes on the first line,
    // whose description has no practical limit.
    description: input.description.slice(0, 35),
    supplier_reference: orUndefined(input.reference.slice(0, 30)),
    item_lines: input.lines.map((l, i) => ({
      nominal_code: l.nominalCode,
      description: i === 0
        ? `${l.description} — submitted by ${by.name}; to be paid from ${input.payFromAccount}`
        : l.description,
      sub_total: l.amount,
      vat_rate: 0,
    })),
    tags: input.projectTag ? [input.projectTag] : undefined,
  });

  const id = idOf(purchase);
  const number = String(field(purchase, 'receipt_number') ?? id);
  const files = await uploadEvidence(input.files, `Purchase ${number}`, 'documents/receipt', (file) => {
    const form = new FormData();
    form.set('file', file, file.name);
    form.set('purchase_id', String(id));
    form.set('capture_date', input.receiptDate);
    form.set('receipt_name', `${supplier.name} ${input.receiptDate}`.slice(0, 100));
    return form;
  });
  return { id, number, partyName: supplier.name, total, files, record: await readPurchase(id), viewUrl: quickFileUrl('purchase', id) };
}

export async function submitInvoice(input: InvoiceInput, by: Submitter): Promise<SubmissionResult> {
  const client = await resolveParty('clients', input.client);
  const total = round2(input.lines.reduce((s, l) => s + l.amount * l.quantity, 0));

  const invoice = await qfPost<Record<string, unknown>>('invoices', {
    type: 'invoice',
    client_id: client.id,
    currency: 'GBP',
    issue_date: input.issueDate,
    term_days: input.termDays,
    // QuickFile limits the invoice description to 2–35 characters.
    description: input.description.slice(0, 35),
    purchase_reference: orUndefined(input.reference),
    notes: [input.notes, `Raised by ${by.name} via trustee portal`].filter(Boolean).join('\n'),
    item_lines: input.lines.map((l) => ({
      // item_name is limited to 25 characters.
      item_name: l.description.slice(0, 25),
      description: l.description,
      nominal_code: l.nominalCode,
      vat_rate: 0,
      unit_cost: l.amount,
      qty: l.quantity,
    })),
    tags: input.projectTag ? [input.projectTag] : undefined,
  });

  const id = idOf(invoice);
  const number = String(field(invoice, 'invoice_number') ?? id);
  const files = await uploadEvidence(input.files, `Invoice ${number}`, 'documents/sales', (file) => {
    const form = new FormData();
    form.set('file', file, file.name);
    form.set('invoice_id', String(id));
    form.set('notes', `Uploaded by ${by.name}`);
    return form;
  });
  return { id, number, partyName: client.name, total, files, record: await readInvoice(id), viewUrl: quickFileUrl('invoice', id) };
}
