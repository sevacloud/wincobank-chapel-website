/**
 * News Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /news
 * Migrated from legacy: thanks-to-our-funders.html
 *
 * Currently static content. In future this could pull from a CMS or
 * Supabase table for dynamic news posts.
 */

import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'News',
  description: 'Latest news from Wincobank Chapel — grants, renovations, and community updates.',
};

export default function NewsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">News</h1>

      {/* News article */}
      <article className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="relative aspect-[16/9]">
          <Image
            src="/media/posts/8/20200311_095522.jpg"
            alt="The Old School House"
            fill
            className="object-cover"
          />
        </div>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">The Old School House</h2>
          <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
            <p>
              We are delighted to have been awarded a significant grant from Veolia
              Environmental Trust of £68,000 towards the renovation of the Old School House
              so that it can be used for community purposes in future.
            </p>
            <p>
              Thanks also to Sheffield City Council for making a third party contribution of
              £6,800. Further grants of £3,000 from Sheffield Town Trust and £4,000 from JG
              Graves Charitable Trust will enable us to install accessible toilet facilities
              and an access ramp and hand rails.
            </p>
            <p>
              The Clothmakers Foundation have granted £10,000 for the complete rewiring of
              the building.
            </p>
            <p>
              We are also extremely grateful for the Covid Support Grant of £2,782 that was
              made available through the South Yorkshire Community Foundation. This helped
              cover running and maintenance costs through the Covid lockdowns.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
