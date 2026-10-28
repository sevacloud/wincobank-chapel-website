/**
 * Server actions: manage trustee accounts from the portal
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Any trustee may add, reset or remove trustees. Guard rails:
 * - you can't remove or reset yourself (use Change Password instead)
 * - the last remaining trustee can't be removed, so the portal can't be locked out
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireTrustee } from '@/lib/trustees/auth';
import { addTrustee, listTrustees, removeTrustee, resetTrusteePassword } from '@/lib/trustees/admin';

export interface AdminState {
  error?: string;
  /** Shown once so it can be passed to the new trustee */
  credentials?: { name: string; email: string; temporaryPassword: string | null };
  message?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_PATH = '/trustees/admin';

const fail = (e: unknown): AdminState => ({ error: e instanceof Error ? e.message : 'Something went wrong.' });

export async function addTrusteeAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const me = await requireTrustee();
  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  if (name.length < 2 || name.length > 100) return { error: 'Enter their full name.' };
  if (!EMAIL.test(email) || email.length > 120) return { error: 'Enter a valid email address.' };

  try {
    const { record, temporaryPassword } = await addTrustee({ name, email }, me.email);
    revalidatePath(ADMIN_PATH);
    return { credentials: { name: record.name, email: record.email, temporaryPassword } };
  } catch (e) {
    return fail(e);
  }
}

export async function resetPasswordAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const me = await requireTrustee();
  const id = String(fd.get('id') ?? '');
  if (id === me.id) return { error: 'Use Change Password to change your own password.' };

  try {
    const target = (await listTrustees()).find((t) => t.id === id);
    if (!target) return { error: 'Trustee not found.' };
    const temporaryPassword = await resetTrusteePassword(id);
    revalidatePath(ADMIN_PATH);
    return { credentials: { name: target.name, email: target.email, temporaryPassword } };
  } catch (e) {
    return fail(e);
  }
}

export async function removeTrusteeAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const me = await requireTrustee();
  const id = String(fd.get('id') ?? '');
  if (id === me.id) return { error: "You can't remove yourself — ask another trustee." };

  try {
    const trustees = await listTrustees();
    const target = trustees.find((t) => t.id === id);
    if (!target) return { error: 'Trustee not found.' };
    if (trustees.length <= 1) return { error: "The last trustee can't be removed." };
    await removeTrustee(id);
    revalidatePath(ADMIN_PATH);
    return { message: `${target.name}'s trustee access has been removed.` };
  } catch (e) {
    return fail(e);
  }
}
