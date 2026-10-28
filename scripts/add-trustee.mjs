/**
 * Bootstrap / recovery: grant trustee portal access from the command line.
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Normally trustees are managed at /trustees/admin. Use this only to add the
 * first trustee, or if every trustee is locked out.
 *
 *   node --env-file=.env.local scripts/add-trustee.mjs <email> "<Full Name>"
 *
 * New accounts get a temporary password (printed once) that must be changed
 * at first sign-in. Existing accounts keep their password. Safe to re-run:
 * a trustee who has never signed in is issued a fresh temporary password.
 * Mirrors addTrustee() in lib/trustees/admin.ts.
 */

import { createClient } from '@supabase/supabase-js';
import { randomInt } from 'node:crypto';

const [email, name] = process.argv.slice(2);
if (!email || !name) {
  console.error('Usage: node --env-file=.env.local scripts/add-trustee.mjs <email> "<Full Name>"');
  process.exit(1);
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const temporaryPassword = () =>
  Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]).join('').match(/.{4}/g).join('-');

const stamp = { trustee: true, trustee_added_by: 'scripts/add-trustee.mjs', trustee_added_at: new Date().toISOString() };

let existing;
for (let page = 1; !existing; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  existing = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (data.users.length < 1000) break;
}

if (existing) {
  if (existing.app_metadata?.trustee === true && !existing.last_sign_in_at) {
    // Safe re-run: e.g. an earlier attempt created the account but the
    // response (and so the temporary password) was lost to a timeout.
    const password = temporaryPassword();
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: { ...existing.app_metadata, must_change_password: true },
    });
    if (error) throw error;
    console.log(`${email} is a trustee but has never signed in — issued a new temporary password.`);
    console.log(`Temporary password: ${password}`);
  } else if (existing.app_metadata?.trustee === true) {
    console.log(`${email} is already a trustee — nothing changed.`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { app_metadata: { ...existing.app_metadata, ...stamp } });
    if (error) throw error;
    console.log(`${email} already had an account; trustee access granted. They keep their existing password.`);
  }
} else {
  const password = temporaryPassword();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
    app_metadata: { ...stamp, must_change_password: true },
  });
  if (error) throw error;
  console.log(`Created trustee ${name} <${email}>`);
  console.log(`Temporary password: ${password}`);
  console.log('They must choose a new password at first sign-in (/trustees/login).');
}
