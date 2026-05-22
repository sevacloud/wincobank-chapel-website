/**
 * Heritage Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /heritage
 * Migrated from legacy: wincobank-chapel-a-gift-to-the-community.html
 */

import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Heritage',
  description: 'The heritage of Wincobank Chapel — a Heritage Lottery Fund project exploring our history since 1841.',
};

export default function HeritagePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Heritage</h1>

      <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-lg p-4 mb-8">
        <Image
          src="/media/posts/5/HLFHI_2747.jpg"
          alt="Heritage Lottery Fund logo"
          width={113}
          height={70}
          className="flex-shrink-0"
        />
        <p className="text-sm text-gray-700 font-medium">
          All Our Stories: A Heritage Lottery Fund project
        </p>
      </div>

      <div className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          We are looking back over time at how the work of the Chapel has touched many lives.
          We are catching up with children who grew up here, capturing and learning from their
          stories. We want to understand how the Chapel can best help the community it serves
          in the 21st Century.
        </p>

        <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-sm">
          <Image
            src="/media/posts/5/Chapel-Door-sepia-2.jpg"
            alt="An old picture of the Upper Wincobank Chapel"
            fill
            className="object-cover"
          />
        </div>

        <p>A grant from the Heritage Lottery Fund is enabling us to:</p>

        <ul className="list-disc pl-6 space-y-2">
          <li>
            Research the history of the chapel&apos;s founder Mary Anne Rawson and to understand
            her family&apos;s involvement in the international movement to abolish slavery and
            many other campaigns for social justice.
          </li>
          <li>
            Find out the best way to store and preserve our existing collection of old
            photographs and documents and organise it into an accessible Archive.
          </li>
          <li>
            Capture the stories of people who remember the activities which have taken place
            here and to preserve these for the next generation.
          </li>
        </ul>

        <div className="relative aspect-[4/3] max-w-xs rounded-lg overflow-hidden shadow-sm">
          <Image
            src="/media/posts/5/2013.03.23_Young-Researchers-_UWUC_RetroDay2_52KB_0149.jpg"
            alt="A Young Researcher at the chapel"
            fill
            className="object-cover"
          />
        </div>

        <p>
          We have uploaded interesting images and information to our{' '}
          <a
            href="https://upperwincobankchapel.wordpress.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-chapel-400 hover:text-chapel-600 underline"
          >
            heritage blog
          </a>.
        </p>
      </div>
    </div>
  );
}
