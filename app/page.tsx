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
            src="/images/chapel-exterior.jpg"
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
              src="/images/chapel-interior.jpg"
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

      {/* Donations */}
      <section className="bg-chapel-400 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Support Our Chapel</h2>
          <p className="text-white/90 leading-relaxed mb-6">
            As an independent chapel run by volunteers, we rely on the generosity of our
            community to keep the building open, maintained, and serving Wincobank. Whether
            it&apos;s the Trust, the Chapel Building, or the Chapel House restoration,
            every gift makes a real difference.
          </p>
          <Link
            href="/donate"
            className="inline-block bg-white text-chapel-500 px-8 py-3 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Make a Donation
          </Link>
          <Image
            src="/images/wincobank-chapel-sketch.jpg"
            alt="Sketch of Upper Wincobank Chapel"
            width={1350}
            height={1050}
            className="w-full max-w-md h-auto mx-auto mt-10 rounded-lg shadow-lg"
            sizes="(max-width: 448px) 100vw, 448px"
          />
        </div>
      </section>

      {/* Facebook Feed */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Latest from Facebook</h2>
          <p className="text-gray-500 text-center text-sm mb-4">
            Follow us for news, events and community updates.
            <br />
            If the feed isn&apos;t loading,{' '}
            <a
              href="https://www.facebook.com/UpperWincobankChapel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-chapel-400 hover:text-chapel-500 underline"
            >
              visit our Facebook page
            </a>{' '}
            for the latest updates.
          </p>
          <div className="flex justify-center">
            <iframe
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FUpperWincobankChapel&tabs=timeline&width=500&height=600&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false"
              width={500}
              height={600}
              className="border-none overflow-hidden max-w-full"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title="Wincobank Chapel Facebook feed"
            />
          </div>
        </div>
      </section>

      {/* Our Funders */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Funders</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We are deeply grateful to the trusts, foundations, and organisations whose
            generous support makes our work possible. Thank you for helping us care for the
            chapel and serve our community.
          </p>
          {/* Wide logo strip for larger screens */}
          <Image
            src="/images/wincobank-chapel-school-house-funders-logos-wide.jpg"
            alt="Funders of Wincobank Chapel: Veolia Environmental Trust, The Clothworkers Foundation, The J.G. Greaves Charitable Trusts, Northern Powerhouse, European Regional Development Fund, Key Fund, Sheffield City Council, Sheffield Town Trust, Sheffield Church Burgess Trust, Lottery Fund"
            width={1582}
            height={385}
            className="hidden sm:block w-full h-auto"
            sizes="896px"
          />
          {/* Thin logo stack for mobile screens */}
          <Image
            src="/images/wincobank-chapel-school-house-funders-logos-thin.jpg"
            alt="Funders of Wincobank Chapel: Veolia Environmental Trust, The Clothworkers Foundation, The J.G. Greaves Charitable Trusts, Northern Powerhouse, European Regional Development Fund, Key Fund, Sheffield City Council, Sheffield Town Trust, Sheffield Church Burgess Trust, Lottery Fund"
            width={503}
            height={1138}
            className="block sm:hidden w-full max-w-xs mx-auto h-auto"
            sizes="(max-width: 640px) 100vw, 320px"
          />
        </div>
      </section>
    </>
  );
}
