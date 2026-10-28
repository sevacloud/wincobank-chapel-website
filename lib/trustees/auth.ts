/**
 * Trustee authentication & authorisation
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Authentication: Supabase Auth email + password. Accounts are created by an
 * existing trustee at /trustees/admin — there is no public sign-up UI.
 *
 * Authorisation: app_metadata.trustee === true on the Supabase user. Having a
 * Supabase account is NOT enough. app_metadata is only writable with the
 * service-role key, so trustees are managed from /trustees/admin (see
 * lib/trustees/admin.ts) and nobody can grant themselves access.
 *
 * Every trustee page, route handler and server action must call
 * requireTrustee()/getTrustee() itself — the proxy only refreshes cookies.
 */

import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { displayName, isTrusteeUser } from './admin';

export interface Trustee {
  id: string;
  email: string;
  name: string;
  /** Signed in with a temporary password that hasn't been replaced yet */
  mustChangePassword: boolean;
}

export const TRUSTEE_LOGIN_PATH = '/trustees/login';
export const TRUSTEE_ACCOUNT_PATH = '/trustees/account';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // proxy.ts refreshes the session before rendering, so this is safe.
          }
        },
      },
    },
  );
}

/** The signed-in trustee, or null. Memoised per request. */
export const getTrustee = cache(async (): Promise<Trustee | null> => {
  const supabase = await createSupabaseServerClient();
  // getUser() validates the JWT with Supabase and returns live app_metadata,
  // so revoking access takes effect on the very next request.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !isTrusteeUser(user)) return null;

  return {
    id: user.id,
    email: user.email,
    name: displayName(user),
    mustChangePassword: user.app_metadata.must_change_password === true,
  };
});

/**
 * For pages and server actions: redirect to the login page if not a trustee,
 * and to the password page if they're still on a temporary password.
 */
export async function requireTrustee({ allowTemporaryPassword = false } = {}): Promise<Trustee> {
  const trustee = await getTrustee();
  if (!trustee) redirect(TRUSTEE_LOGIN_PATH);
  if (trustee.mustChangePassword && !allowTemporaryPassword) redirect(TRUSTEE_ACCOUNT_PATH);
  return trustee;
}
