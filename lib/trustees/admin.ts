/**
 * Trustee account management (Supabase Auth admin API)
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Trustee access is recorded on each Supabase user's app_metadata:
 *   { trustee: true, must_change_password?: true, trustee_added_by, trustee_added_at }
 * app_metadata can only be written with the service-role key (never by the
 * user themselves), so it is safe to authorise on. No extra tables needed.
 *
 * New trustees get a one-time temporary password, shown once to the trustee
 * who added them, and must choose their own password on first sign-in.
 */

import 'server-only';
import { createClient, type User } from '@supabase/supabase-js';

export interface TrusteeRecord {
  id: string;
  email: string;
  name: string;
  addedBy: string | null;
  addedAt: string | null;
  lastSignIn: string | null;
  mustChangePassword: boolean;
}

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isTrusteeUser(user: Pick<User, 'app_metadata'> | null | undefined): boolean {
  return user?.app_metadata?.trustee === true;
}

export function displayName(user: Pick<User, 'email' | 'user_metadata'>): string {
  const meta = user.user_metadata ?? {};
  return String(meta.full_name ?? meta.name ?? '').trim() || user.email || '';
}

function toRecord(u: User): TrusteeRecord {
  return {
    id: u.id,
    email: u.email ?? '',
    name: displayName(u),
    addedBy: (u.app_metadata.trustee_added_by as string) ?? null,
    addedAt: (u.app_metadata.trustee_added_at as string) ?? null,
    lastSignIn: u.last_sign_in_at ?? null,
    mustChangePassword: u.app_metadata.must_change_password === true,
  };
}

async function allUsers(): Promise<User[]> {
  const admin = adminClient();
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Could not list accounts: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

async function findByEmail(email: string): Promise<User | undefined> {
  const target = email.toLowerCase();
  return (await allUsers()).find((u) => u.email?.toLowerCase() === target);
}

async function getUser(id: string): Promise<User> {
  const { data, error } = await adminClient().auth.admin.getUserById(id);
  if (error || !data.user) throw new Error('Account not found.');
  return data.user;
}

/** Merge into app_metadata (sent whole so no existing keys are lost). */
async function setAppMetadata(user: User, patch: Record<string, unknown>, extra: { password?: string } = {}) {
  const { error } = await adminClient().auth.admin.updateUserById(user.id, {
    ...extra,
    app_metadata: { ...user.app_metadata, ...patch },
  });
  if (error) throw new Error(error.message);
}

export async function listTrustees(): Promise<TrusteeRecord[]> {
  return (await allUsers())
    .filter(isTrusteeUser)
    .map(toRecord)
    .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
}

/** Readable one-time password: 4 groups of 4 from an unambiguous alphabet (~80 bits). */
export function temporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const out: string[] = [];
  const buf = new Uint8Array(1);
  while (out.length < 16) {
    crypto.getRandomValues(buf);
    // Rejection sampling avoids modulo bias.
    if (buf[0] < 256 - (256 % alphabet.length)) out.push(alphabet[buf[0] % alphabet.length]);
  }
  return out.join('').match(/.{4}/g)!.join('-');
}

export interface AddTrusteeResult {
  record: TrusteeRecord;
  /** Present when a new account was created; shown once, never stored by us. */
  temporaryPassword: string | null;
}

/**
 * Grant trustee access. Creates the account if the email is new; if it
 * already exists (e.g. a booking admin), grants access and keeps their password.
 */
export async function addTrustee(input: { name: string; email: string }, addedBy: string): Promise<AddTrusteeResult> {
  const stamp = { trustee: true, trustee_added_by: addedBy, trustee_added_at: new Date().toISOString() };
  const existing = await findByEmail(input.email);

  if (existing) {
    if (isTrusteeUser(existing)) throw new Error(`${input.email} is already a trustee.`);
    await setAppMetadata(existing, stamp);
    return { record: toRecord(await getUser(existing.id)), temporaryPassword: null };
  }

  const password = temporaryPassword();
  const { data, error } = await adminClient().auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: input.name },
    app_metadata: { ...stamp, must_change_password: true },
  });
  if (error || !data.user) throw new Error(`Could not create account: ${error?.message ?? 'unknown error'}`);
  return { record: toRecord(data.user), temporaryPassword: password };
}

/** Issue a new temporary password and require a change at next sign-in. */
export async function resetTrusteePassword(id: string): Promise<string> {
  const user = await getUser(id);
  if (!isTrusteeUser(user)) throw new Error('That account is not a trustee.');
  const password = temporaryPassword();
  await setAppMetadata(user, { must_change_password: true }, { password });
  return password;
}

/**
 * Revoke trustee access. The Supabase account itself is kept (it may own
 * bookings). Takes effect on their next request: getUser() reads live metadata.
 */
export async function removeTrustee(id: string): Promise<void> {
  const user = await getUser(id);
  await setAppMetadata(user, { trustee: false, must_change_password: false, trustee_removed_at: new Date().toISOString() });
}

export async function clearMustChangePassword(id: string): Promise<void> {
  const user = await getUser(id);
  if (user.app_metadata.must_change_password) await setAppMetadata(user, { must_change_password: false });
}
