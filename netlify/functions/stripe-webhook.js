/**
 * Netlify Function: stripe-webhook
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Receives Stripe webhook events and verifies their signature.
 *
 * On `checkout.session.completed` it logs the donation designation, amount,
 * and donor email. This is the hook point to later persist the record to a
 * Google Sheet, database, or send a thank-you email.
 *
 * IMPORTANT: Stripe signature verification requires the RAW request body.
 * Netlify passes the body as a string (base64-encoded when isBase64Encoded
 * is true), so we reconstruct the raw bytes before calling constructEvent.
 *
 * Per Stripe's guidance, we return 200 quickly. We only return a 400 when the
 * signature itself fails verification (so Stripe knows to stop retrying a
 * genuinely invalid request).
 */

const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    console.error('Stripe keys are not configured (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET)');
    // Return 200 so Stripe does not retry indefinitely against a misconfigured env.
    return { statusCode: 200, body: 'ok' };
  }

  const stripe = Stripe(secretKey);
  const signature = event.headers['stripe-signature'];

  // Reconstruct the raw body exactly as Stripe sent it
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    // 400 tells Stripe the payload/signature was invalid.
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` };
  }

  // Handle the event
  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      const designation = session.metadata?.designation ?? 'Unknown';
      const amountPence = session.amount_total ?? 0;
      const donorEmail =
        session.customer_details?.email ?? session.customer_email ?? 'unknown';

      console.log('Donation completed:', {
        designation,
        amount: `£${(amountPence / 100).toFixed(2)}`,
        donorEmail,
        sessionId: session.id,
      });

      // TODO: persist to Google Sheet / database, send thank-you email, etc.
    } else {
      console.log(`Unhandled Stripe event type: ${stripeEvent.type}`);
    }
  } catch (err) {
    // Log but still return 200 — the event was validly signed; we don't want
    // Stripe retrying because our downstream handling had a transient error.
    console.error('Error handling Stripe event:', err);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
