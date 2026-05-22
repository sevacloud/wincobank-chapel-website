/**
 * Activities Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /activities
 * Migrated from legacy: whats-going-on-at-wincobank-chapel.html
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activities',
  description: 'Weekly activities and events at Wincobank Chapel — services, exercise classes, toddler groups and more.',
};

export default function ActivitiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        What&apos;s Going On at Wincobank Chapel
      </h1>

      <div className="space-y-6">
        <div className="bg-chapel-50 border border-chapel-100 rounded-lg p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Sunday Service</h2>
          <p className="text-sm text-chapel-500 font-medium mb-2">11am – 12 noon</p>
          <p className="text-gray-600 text-sm">
            A simple Christian Service of Bible readings, hymns, discussion and prayer in the
            chapel and on Zoom — text 07980 143776 for the link.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Fit &amp; Fun</h2>
          <p className="text-sm text-chapel-500 font-medium mb-2">Tuesdays 9:45 – 10:45am</p>
          <p className="text-gray-600 text-sm">
            Chair-based exercise class for the over 50s followed by a cup of coffee or tea. £2.50.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Toddler Group</h2>
          <p className="text-sm text-chapel-500 font-medium mb-2">Wednesdays 10am – 12 noon</p>
          <p className="text-gray-600 text-sm">
            With parent or carer. Play, Craft, Story &amp; Song. Outdoors where possible.
            £1.50 and 50p for each extra child. Regular members — please check with Gill
            that the session is running.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Mindful Exercise</h2>
          <p className="text-sm text-chapel-500 font-medium mb-2">Thursdays 11am – 12 noon</p>
          <p className="text-gray-600 text-sm">
            Gentle exercise and relaxation followed by coffee or tea. £2.50.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Heritage Tours</h2>
          <p className="text-sm text-chapel-500 font-medium mb-2">By arrangement</p>
          <p className="text-gray-600 text-sm">
            Tours of the Chapel and nearby Iron Age hill fort. Please phone 07980 143776
            for further details.
          </p>
        </div>
      </div>
    </div>
  );
}
