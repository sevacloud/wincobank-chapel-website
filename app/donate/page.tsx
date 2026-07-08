/**
 * Donation Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /donate
 *
 * A donor picks a designation and amount, then is redirected to Stripe
 * Checkout. The secret key never touches the browser — all payment logic
 * lives in the Netlify Function at /.netlify/functions/create-checkout-session.
 */

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DESIGNATIONS } from '@/lib/donations';

type Designation = (typeof DESIGNATIONS)[number];

const SUGGESTED_AMOUNTS = [5, 10, 25, 50];

function DonateForm() {
  const searchParams = useSearchParams();
  const [designation, setDesignation] = useState<Designation>(DESIGNATIONS[0]);
  const [amount, setAmount] = useState('10');
  const [customMode, setCustomMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dismissedCancelled, setDismissedCancelled] = useState(false);

  // Derived from the URL — no effect, no cascading setState.
  const showCancelled = searchParams.get('cancelled') !== null && !dismissedCancelled;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setDismissedCancelled(true);

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      setError('Please enter a donation amount of at least £1.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designation, amount: numericAmount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unable to start donation.');

      // Redirect the browser to Stripe Checkout
      globalThis.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Make a Donation</h1>
      <p className="text-gray-600 mb-8">
        Your gift helps us maintain the chapel and support the local community.
        Choose what you&apos;d like to support below.
      </p>

      {showCancelled && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800" role="alert">
          Your donation was cancelled. No payment was taken.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Designation */}
        <div>
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
            What would you like to support?
          </label>
          <select
            id="designation"
            value={designation}
            onChange={e => setDesignation(e.target.value as Designation)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chapel-400 bg-white"
          >
            {DESIGNATIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Suggested amounts */}
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Amount (£)</span>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_AMOUNTS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => { setCustomMode(false); setAmount(String(a)); }}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  !customMode && amount === String(a)
                    ? 'bg-chapel-400 text-white border-chapel-400'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-chapel-400'
                }`}
              >
                £{a}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setCustomMode(true); setAmount('2.50'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                customMode
                  ? 'bg-chapel-400 text-white border-chapel-400'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-chapel-400'
              }`}
            >
              Other
            </button>
          </div>
          {customMode && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
              <input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chapel-400"
                autoFocus
                required
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-chapel-400 text-white py-3 rounded-md font-medium text-sm hover:bg-chapel-500 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Redirecting to payment…' : 'Donate Securely'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Payments are processed securely by Stripe. We never see or store your card details.
        </p>
      </form>
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-12 text-gray-400">Loading…</div>}>
      <DonateForm />
    </Suspense>
  );
}
