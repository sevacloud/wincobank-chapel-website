/**
 * Donation designations — single source of truth
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Shared between the frontend donation page (app/donate/page.tsx) and the
 * Netlify Function (netlify/functions/create-checkout-session.js).
 *
 * Written as CommonJS so the Netlify Function can `require` it, while Next.js
 * can `import` it. The JSDoc @type annotation preserves the literal union
 * type on the TypeScript side.
 */

/** @type {readonly ['The Trust', 'The Chapel Building', 'The Chapel House']} */
const DESIGNATIONS = ['The Trust', 'The Chapel Building', 'The Chapel House'];

/** @type {Readonly<Record<'The Trust' | 'The Chapel Building' | 'The Chapel House', string>>} */
const DESIGNATION_LABELS = {
  'The Trust': 'Donation to the Trust',
  'The Chapel Building': 'Donation to the Chapel Building',
  'The Chapel House': 'Donation to the Chapel House restoration',
};

module.exports = { DESIGNATIONS, DESIGNATION_LABELS };
