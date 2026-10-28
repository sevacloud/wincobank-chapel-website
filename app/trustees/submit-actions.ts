/**
 * Server actions: submit an expense (purchase) or raise a sales invoice
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Server actions are public HTTP endpoints, so each one re-checks the
 * trustee session and re-validates every field against live QuickFile
 * lookups (nominal codes, bank accounts, project tags, contacts) — nothing
 * from the browser is trusted.
 */

'use server';

import { requireTrustee } from '@/lib/trustees/auth';
import { isIsoDate } from '@/lib/quickfile/financial-year';
import {
  getFormOptions,
  submitExpense,
  submitInvoice,
  SubmissionError,
  type FormOptions,
  type PartyInput,
  type SubmissionResult,
} from '@/lib/quickfile/submissions';
import { QuickFileError } from '@/lib/quickfile/client';
import { ALLOWED_EXTENSIONS, MAX_FILES, MAX_TOTAL_BYTES } from './evidence-rules';

export interface SubmitState {
  error?: string;
  result?: SubmissionResult;
}

const MAX_LINES = 20;
const MAX_AMOUNT = 100_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ValidationError extends Error {}

const text = (fd: FormData, key: string, max = 200) => String(fd.get(key) ?? '').trim().slice(0, max);

function requireText(fd: FormData, key: string, label: string, { min = 1, max = 200 } = {}): string {
  const v = String(fd.get(key) ?? '').trim();
  if (v.length < min) throw new ValidationError(`${label} is required${min > 1 ? ` (at least ${min} characters)` : ''}.`);
  if (v.length > max) throw new ValidationError(`${label} must be ${max} characters or fewer.`);
  return v;
}

function requireDate(fd: FormData, key: string, label: string, { notFuture = false } = {}): string {
  const v = String(fd.get(key) ?? '');
  if (!isIsoDate(v)) throw new ValidationError(`${label} must be a valid date.`);
  if (notFuture && v > new Date().toISOString().slice(0, 10)) throw new ValidationError(`${label} can't be in the future.`);
  return v;
}

function parseMoney(raw: FormDataEntryValue | null, label: string): number {
  const s = String(raw ?? '').trim().replace(/^£/, '').replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new ValidationError(`${label} must be an amount in pounds, e.g. 12.50.`);
  const n = Number(s);
  if (n <= 0 || n > MAX_AMOUNT) throw new ValidationError(`${label} must be between £0.01 and £${MAX_AMOUNT.toLocaleString('en-GB')}.`);
  return n;
}

function parseParty(fd: FormData, existing: FormOptions['suppliers'], label: string): PartyInput {
  if (fd.get('party_mode') === 'new') {
    const email = text(fd, 'new_email', 120);
    if (email && !EMAIL.test(email)) throw new ValidationError(`New ${label} email address doesn't look right.`);
    return {
      kind: 'new',
      details: {
        companyName: requireText(fd, 'new_company', `New ${label} name`, { min: 2, max: 100 }),
        firstName: text(fd, 'new_first', 50),
        surname: text(fd, 'new_surname', 50),
        email,
        telephone: text(fd, 'new_phone', 30),
        addressLine1: text(fd, 'new_address1', 100),
        addressLine2: text(fd, 'new_address2', 100),
        town: text(fd, 'new_town', 60),
        postCode: text(fd, 'new_postcode', 10).toUpperCase(),
      },
    };
  }
  const id = Number(fd.get('party_id'));
  if (!existing.some((c) => c.id === id)) throw new ValidationError(`Choose a ${label}, or add a new one.`);
  return { kind: 'existing', id };
}

function parseLines(fd: FormData, allowedCodes: number[], withQuantity: boolean) {
  const descriptions = fd.getAll('line_description');
  const codes = fd.getAll('line_nominal');
  const amounts = fd.getAll('line_amount');
  const quantities = fd.getAll('line_qty');
  if (descriptions.length === 0) throw new ValidationError('Add at least one line.');
  if (descriptions.length > MAX_LINES) throw new ValidationError(`No more than ${MAX_LINES} lines per submission.`);

  return descriptions.map((d, i) => {
    const n = i + 1;
    const description = String(d).trim();
    if (description.length < 2 || description.length > 500) throw new ValidationError(`Line ${n}: description must be 2–500 characters.`);
    const nominalCode = Number(codes[i]);
    if (!allowedCodes.includes(nominalCode)) throw new ValidationError(`Line ${n}: choose a category.`);
    const amount = parseMoney(amounts[i], `Line ${n} amount`);
    let quantity = 1;
    if (withQuantity) {
      quantity = Number(quantities[i]);
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10_000) throw new ValidationError(`Line ${n}: quantity must be a positive number.`);
    }
    return { description, nominalCode, amount, quantity };
  });
}

function parseFiles(fd: FormData, { required }: { required: boolean }): File[] {
  const files = fd.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (required && files.length === 0) throw new ValidationError('Attach at least one receipt or supporting document.');
  if (files.length > MAX_FILES) throw new ValidationError(`Attach no more than ${MAX_FILES} files.`);
  const total = files.reduce((s, f) => s + f.size, 0);
  if (total > MAX_TOTAL_BYTES) throw new ValidationError(`Attachments total ${(total / 1048576).toFixed(1)} MB — the limit is ${MAX_TOTAL_BYTES / 1048576} MB.`);
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) throw new ValidationError(`"${f.name}" isn't an accepted file type.`);
  }
  return files;
}

function parseProjectTag(fd: FormData, tags: string[]): string {
  const tag = text(fd, 'project_tag', 100);
  if (tag && !tags.includes(tag)) throw new ValidationError('Choose a project from the list.');
  return tag;
}

function failure(e: unknown, what: string): SubmitState {
  if (e instanceof ValidationError || e instanceof SubmissionError) return { error: e.message };
  console.error(`${what} failed:`, e);
  if (e instanceof QuickFileError) return { error: `QuickFile rejected the ${what}: ${e.message}` };
  return { error: `Something went wrong submitting the ${what}. Nothing has been confirmed — please check QuickFile before trying again.` };
}

export async function submitExpenseAction(_prev: SubmitState, fd: FormData): Promise<SubmitState> {
  const trustee = await requireTrustee();
  try {
    const options = await getFormOptions();
    const paidFrom = String(fd.get('paid_from') ?? '');
    let paidFromNominal: number | null = null;
    if (paidFrom !== 'personal') {
      paidFromNominal = Number(paidFrom);
      if (!options.bankAccounts.some((a) => a.nominalCode === paidFromNominal)) throw new ValidationError('Choose how this was paid.');
    }

    const result = await submitExpense({
      supplier: parseParty(fd, options.suppliers, 'supplier'),
      receiptDate: requireDate(fd, 'date', 'Receipt date', { notFuture: true }),
      reference: text(fd, 'reference', 50),
      description: requireText(fd, 'description', 'Description', { min: 2, max: 150 }),
      lines: parseLines(fd, options.purchaseCodes.map((c) => c.code), false),
      projectTag: parseProjectTag(fd, options.projectTags),
      paidFromNominal,
      files: parseFiles(fd, { required: true }),
    }, trustee);
    return { result };
  } catch (e) {
    return failure(e, 'expense');
  }
}

export async function submitInvoiceAction(_prev: SubmitState, fd: FormData): Promise<SubmitState> {
  const trustee = await requireTrustee();
  try {
    const options = await getFormOptions();
    const termDays = Number(fd.get('term_days') ?? 30);
    if (!Number.isInteger(termDays) || termDays < 0 || termDays > 365) throw new ValidationError('Payment terms must be 0–365 days.');

    const result = await submitInvoice({
      client: parseParty(fd, options.clients, 'client'),
      issueDate: requireDate(fd, 'date', 'Invoice date'),
      termDays,
      reference: text(fd, 'reference', 50),
      // QuickFile caps invoice descriptions at 35 characters.
      description: requireText(fd, 'description', 'Description', { min: 2, max: 35 }),
      notes: text(fd, 'notes', 1000),
      lines: parseLines(fd, options.salesCodes.map((c) => c.code), true),
      projectTag: parseProjectTag(fd, options.projectTags),
      files: parseFiles(fd, { required: false }),
    }, trustee);
    return { result };
  } catch (e) {
    return failure(e, 'invoice');
  }
}
