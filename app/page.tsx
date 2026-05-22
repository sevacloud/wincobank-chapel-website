/**
 * Home Page — Wincobank Chapel
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Landing page with hero, welcome message, and quick links.
 */

import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/media/posts/1/Front-of-Chapel-Colour.jpg"
            alt="Front view of Upper Wincobank Undenominational Chapel"
            fill
            className="object-cover opacity-40"
            priority
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Upper Wincobank Chapel
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-8">
            An independent chapel built in 1841, open to all. A community space in the
            heart of Wincobank, Sheffield.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/rooms"
              className="bg-chapel-400 text-white px-6 py-3 rounded-md font-medium hover:bg-chapel-500 transition-colors"
            >
              Book a Room
            </Link>
            <Link
              href="/activities"
              className="bg-white/10 backdrop-blur text-white border border-white/30 px-6 py-3 rounded-md font-medium hover:bg-white/20 transition-colors"
            >
              What&apos;s On
            </Link>
          </div>
        </div>
      </section>

      {/* Welcome */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              This is an independent chapel, built in 1841. The chapel does not belong to any
              denomination and all are welcome. Every Sunday there is a very simple Christian
              service at 11am with a Bible reading, discussion and singing.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Wherever you live, whatever your faith, or if you have none, you are warmly
              invited to join in any of our community activities or to come on a Sunday —
              all are welcome including children.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We are always open on <strong>Tuesdays 10am–1pm</strong> and{' '}
              <strong>Sundays 10:30am–12:30pm</strong>.
            </p>
          </div>
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/media/posts/1/Chapel-inside-colour.jpg"
              alt="Inside Upper Wincobank Chapel"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Explore</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: '/activities', label: 'Activities', desc: 'Weekly events and classes' },
              { href: '/facilities', label: 'Facilities', desc: 'Chapel, school room, kitchen' },
              { href: '/rooms', label: 'Book a Room', desc: 'Hire our spaces' },
              { href: '/heritage', label: 'Heritage', desc: 'Our history since 1841' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
