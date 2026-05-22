/**
 * Mary Anne Rawson Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /mary-anne-rawson
 * Migrated from legacy: mary-anne-rawson.html
 */

import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Mary Anne Rawson',
  description: 'Mary Anne Rawson — founder of Wincobank Chapel, anti-slavery campaigner, and champion of social justice.',
};

export default function MaryAnneRawsonPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mary Anne Rawson</h1>

      <div className="md:float-right md:ml-6 md:mb-4 mb-6">
        <Image
          src="/media/posts/7/Mary-Anne-Rawson58kb.jpg"
          alt="Mary Anne Rawson"
          width={252}
          height={336}
          className="rounded-lg shadow-sm"
        />
      </div>

      <div className="space-y-4 text-gray-600 leading-relaxed">
        <p>
          Upper Wincobank Chapel is a testament to the dedication of Mary Anne Rawson of
          Wincobank Hall. Like her parents Joseph and Elizabeth Read she was an ardent
          campaigner, committed to improving conditions for the poor and disadvantaged
          around the world. She was a determined campaigner for many humanitarian causes
          including the universal abolition of slavery. She was at the first meeting, in
          1840, of the organisation known today as Anti-Slavery International.
        </p>

        <p>
          This indomitable lady raised the funding, and sold her silverware, to provide a
          school for the children of local workers which opened in 1841. Several years later
          they raised enough funds by public subscription to build a neighbouring house that
          &ldquo;would attract a good School Master&rdquo;. In 1852 Mary Anne Rawson
          established a Charitable Trust to ensure that the buildings would pass into the
          hands of the community so that the missionary and educational work could continue.
        </p>

        <div className="clear-both relative aspect-[4/3] rounded-lg overflow-hidden shadow-sm my-6">
          <Image
            src="/media/posts/7/Anti-Slavery-Society-Convention-1840.jpg"
            alt="Anti-Slavery Society Convention 1840 — Credit: National Portrait Gallery London"
            fill
            className="object-cover"
          />
          <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-1">
            Anti-Slavery Society Convention, 1840 — Credit: National Portrait Gallery, London
          </p>
        </div>

        <p>
          Thanks to the commitment of volunteers the chapel has stayed open to this present
          day. The present trustees are all members of the local community. Over the years
          thousands of children, young people and adults have taken part in a host of
          different activities. Many still remember the joyous times at the Sunday school,
          youth clubs and in the concert hall.
        </p>

        <p>
          Further information can be found on our{' '}
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
