/**
 * Trustee sign-in
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /trustees/login
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTrustee } from '@/lib/trustees/auth';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Trustee Sign In',
  robots: { index: false, follow: false },
};

export default async function TrusteeLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getTrustee()) redirect('/trustees');
  const { next } = await searchParams;

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Trustee Sign In</h1>
      <p className="text-gray-600 text-sm mb-8">
        Restricted to Wincobank Chapel trustees. Contact the chapel administrator if you need access.
      </p>
      <LoginForm next={next ?? ''} />
    </div>
  );
}
