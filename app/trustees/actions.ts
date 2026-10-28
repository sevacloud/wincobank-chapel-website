/**
 * Trustee auth server actions — sign in, sign out, change password
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 */

'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient, requireTrustee, TRUSTEE_ACCOUNT_PATH, TRUSTEE_LOGIN_PATH } from '@/lib/trustees/auth';
import { clearMustChangePassword, isTrusteeUser } from '@/lib/trustees/admin';

export interface FormState {
  error?: string;
  success?: string;
}

// One message for every failure so the form can't be used to probe which
// emails have accounts or are on the trustee list.
const LOGIN_FAILED = 'Incorrect email or password, or this account does not have trustee access.';

/** Only allow redirects back into the trustee area. */
function safeNext(next: FormDataEntryValue | null): string {
  const s = typeof next === 'string' ? next : '';
  return /^\/trustees(\/[\w\-/]*)?$/.test(s) && !s.startsWith(TRUSTEE_LOGIN_PATH) ? s : '/trustees';
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: LOGIN_FAILED };

  // A valid Supabase account that isn't a trustee gets no session here.
  if (!isTrusteeUser(data.user)) {
    await supabase.auth.signOut();
    return { error: LOGIN_FAILED };
  }

  if (data.user.app_metadata.must_change_password) redirect(TRUSTEE_ACCOUNT_PATH);
  redirect(safeNext(formData.get('next')));
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(TRUSTEE_LOGIN_PATH);
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const trustee = await requireTrustee({ allowTemporaryPassword: true });
  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (next.length < 12) return { error: 'New password must be at least 12 characters.' };
  if (next !== confirm) return { error: 'New passwords do not match.' };

  const supabase = await createSupabaseServerClient();
  // Re-verify the current password so an unattended signed-in browser can't be used to take over the account.
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: trustee.email, password: current });
  if (verifyError) return { error: 'Current password is incorrect.' };

  if (next === current) return { error: 'Choose a new password, not your current one.' };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: error.message };

  if (trustee.mustChangePassword) {
    await clearMustChangePassword(trustee.id);
    redirect('/trustees');
  }
  return { success: 'Password updated.' };
}
