/**
 * Netlify Function: create-checkout-session
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Creates a Stripe Checkout Session for a one-off donation.
 *
 * Request (POST JSON):
 *   { "designation": "Trust" | "Chapel House" | "Chapel Bank", "amount": number }
 *   - amount is in POUNDS (e.g. 10 = £10.00), minimum £1
 *
 * Response (JSON):
 *   { "url": "https://checkout.stripe.com/..." }
 *
 * Security: STRIPE_SECRET_KEY is read from the environment only — never
 * exposed to the frontend.
 */

const Stripe = require('stripe');
const { DESIGNATIONS, DESIGNATION_LABELS } = require('../../lib/donations');

const VALID_DESIGNATIONS = DESIGNATIONS;

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return json(500, { error: 'Payment processing is not configured.' });
  }

  // Parse and validate body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const { designation, amount } = body;

  // ── Validate designation ──────────────────────────────────────────────
  if (!VALID_DESIGNATIONS.includes(designation)) {
    return json(400, {
      error: `Invalid designation. Must be one of: ${VALID_DESIGNATIONS.join(', ')}.`,
    });
  }

  // ── Validate amount (in pounds) ───────────────────────────────────────
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 1) {
    return json(400, { error: 'Please enter a donation amount of at least £1.' });
  }

  // Convert pounds → pence (integer) for Stripe
  const amountPence = Math.round(numericAmount * 100);

  // Determine the site base URL for redirects
  const siteUrl =
    process.env.STRIPE_REDIRECT_URL ||
    process.env.URL || // Netlify provides URL automatically
    'https://wincobankchapel.org';

  try {
    const stripe = Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: amountPence,
            product_data: {
              name: 'Wincobank Chapel Donation',
              description: DESIGNATION_LABELS[designation] || designation,
            },
          },
        },
      ],
      metadata: { designation },
      success_url: `${siteUrl}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/donate?cancelled=1`,
    });

    return json(200, { url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    return json(500, { error: 'Unable to start the donation. Please try again.' });
  }
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
