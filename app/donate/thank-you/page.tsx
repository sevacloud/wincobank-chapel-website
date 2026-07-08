/**
 * Donation Thank-You Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /donate/thank-you
 * Stripe redirects here after a successful payment.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Thank You',
  description: 'Thank you for your donation to Wincobank Chapel.',
};

export default function ThankYouPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4" aria-hidden>🙏</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
      <p className="text-gray-600 mb-6">
        Your donation has been received. We&apos;re very grateful for your generosity —
        it helps us keep the chapel open and serving the community.
      </p>
      <Link
        href="/"
        className="inline-block bg-chapel-400 text-white px-6 py-3 rounded-md font-medium text-sm hover:bg-chapel-500 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
