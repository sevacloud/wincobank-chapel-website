/**
 * Wisdom Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /wisdom
 * Migrated from legacy: words-shared-on-sunday-3-may-2020-by-rev-inderjit-bhogal.html
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wisdom',
  description: 'Words of wisdom shared at Wincobank Chapel — reflections and teachings.',
};

export default function WisdomPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Wisdom</h1>

      <article className="mt-8">
        <header className="mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Wisdom for Anxious Days: Seek First the Kingdom of God
          </h2>
          <p className="text-sm text-gray-500">
            by Rev Inderjit Bhogal — shared during Zoom morning worship, May 2020
          </p>
          <p className="text-xs text-gray-400 mt-1">Matthew 6:25-34</p>
        </header>

        <div className="space-y-4 text-gray-600 leading-relaxed">
          <blockquote className="border-l-4 border-chapel-200 pl-4 italic text-gray-700">
            &ldquo;So do not worry about tomorrow, for tomorrow will bring worries of its own.
            Today&apos;s trouble is enough for today.&rdquo; (Matthew 6:34)
          </blockquote>

          <p>
            These words are part of what is termed Jesus&apos; Sermon on the Mount. Imagine
            Jesus sharing reflections with people as he sat on a hillside. Many were there
            with their anxieties. They were living in times of Roman occupation and oppression.
            They were living in fear, worried about their future, and looking for wisdom.
          </p>

          <p>
            We could imagine we are sitting with Jesus on Wincobank Hill with our anxieties.
          </p>

          <p>
            The wisdom is: do not be overly anxious about the future, live in the present by
            clear values. There are three pieces of wisdom that precede the words in verse 34:
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6">1. &ldquo;Look at the Birds&rdquo;</h3>
          <p>
            You don&apos;t have to travel far for this. Just look out of the window. Listen to
            the bird song. They work and play, and are melodious.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6">2. &ldquo;Consider the Lilies&rdquo;</h3>
          <p>
            I like the word &ldquo;consider&rdquo;. It suggests pay close attention, study, be
            inquisitive, explore, appreciate. There is immense beauty in lilies, visitors to
            them like bees and butterflies, and wider nature.
          </p>
          <p>
            Spend some time with birds and plants. Time with nature offers nurture, nourishment,
            rest, refreshment and time to reflect. Getting close to soil can be healing.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6">
            3. &ldquo;Seek first the Kingdom of God&rdquo;
          </h3>
          <p>
            Direct your life by this rule. By rule I do not mean instruction, but way of life.
            Jesus is encouraging his followers to put their lives and anxieties into the wider
            context of the wellbeing God desires for all people.
          </p>

          <p className="mt-6 font-medium text-gray-800">
            Make the most of each day. Live one day at a time. Appreciate good things around
            you. Seek the Kingdom and righteousness of God, &ldquo;and all these things will
            be given to you as well&rdquo;.
          </p>
        </div>
      </article>
    </div>
  );
}
