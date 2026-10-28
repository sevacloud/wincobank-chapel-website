/**
 * Contact Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /contact
 * Migrated from legacy: contact-us.html
 *
 * The form itself lives in app/components/ContactForm.tsx (shared with /rooms).
 */

import type { Metadata } from 'next';
import ContactForm from '../components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Wincobank Chapel.',
};

export default function ContactPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
      <p className="text-gray-600 mb-8">
        For enquiries or further information, to get back in touch with old friends or to
        arrange to look around the chapel, please leave a message below. A volunteer will
        respond as soon as possible.
      </p>
      <ContactForm />
    </div>
  );
}
