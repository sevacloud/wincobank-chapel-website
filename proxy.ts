/**
 * Proxy (formerly Middleware) — Supabase session refresh for trustee routes
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Supabase access tokens last an hour and refresh tokens rotate on use.
 * Server Components can't write cookies, so without this a refreshed token
 * would be dropped and the next request would replay a spent refresh token.
 * This runs only on /trustees and /api/trustees and does nothing except
 * refresh auth cookies — authorisation is enforced by requireTrustee() in
 * each page, route handler and server action.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Triggers a token refresh when needed; the result itself is not used here.
  await supabase.auth.getUser();

  // Financial data must never be cached by browsers or CDNs.
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: ['/trustees/:path*', '/api/trustees/:path*'],
};
