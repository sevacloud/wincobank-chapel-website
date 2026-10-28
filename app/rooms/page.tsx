/**
 * Rooms / Booking Enquiry Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /rooms?room=<room-name-slug>
 *
 * Online booking isn't live yet, so this lists the bookable spaces from the
 * Supabase `rooms` table (active rooms only, via the public anon key and RLS)
 * and offers a booking-enquiry contact form. ?room=main-hall preselects a
 * space; old /rooms/<id>/book links redirect here with the id, which is
 * also accepted (see next.config.ts).
 *
 * If the rooms can't be loaded, the page still works — it just shows the form.
 */

import type { Metadata } from 'next';
import { BookingRepository, type Room } from '@/lib/repositories/booking-repository';
import ContactForm from '../components/ContactForm';

export const metadata: Metadata = {
  title: 'Book a Room',
  description: 'Hire a room at Wincobank Chapel for your event, meeting, or celebration.',
};

async function activeRooms(): Promise<Room[]> {
  try {
    return await new BookingRepository(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ).getActiveRooms();
  } catch (err) {
    console.error('Rooms page: could not load rooms —', err);
    return [];
  }
}

const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;

/** "Main Hall & Kitchen" → "main-hall-kitchen", used in ?room= links. */
function roomSlug(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default async function RoomsPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const [rooms, { room }] = await Promise.all([activeRooms(), searchParams]);
  // ?room= is a name slug; a room id is also accepted (old /rooms/<id>/book links redirect here with one).
  const selectedId = rooms.find((r) => roomSlug(r.name) === room || r.id === room)?.id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Room</h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        Our spaces are available for community groups, meetings, celebrations and events.
      </p>

      {/* Spans the full content column, matching the rooms + form grid below. */}
      <section aria-label="Booking notice" className="rounded-lg border border-chapel-200 bg-chapel-50 px-5 py-4 mb-10">
        <p className="text-chapel-800">
          <strong>Online booking is coming soon.</strong> If you&apos;d like to book a space, please contact
          us using the form below or call <a href="tel:07980143776" className="font-semibold underline">07980 143776</a>.
          A volunteer will get back to you to confirm availability.
        </p>
      </section>

      <div className={rooms.length ? 'grid gap-10 lg:grid-cols-[1fr_26rem]' : 'max-w-lg'}>
        {rooms.length > 0 && (
          <section aria-labelledby="spaces-heading">
            <h2 id="spaces-heading" className="text-xl font-semibold text-gray-900 mb-4">Our spaces</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {rooms.map((r) => (
                <li key={r.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  {r.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs come from the database and may be any host
                    <img src={r.image_url} alt="" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{r.name}</h3>
                    {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 mt-3">
                      <div><dt className="inline text-gray-500">Capacity: </dt><dd className="inline">up to {r.capacity}</dd></div>
                      {r.price_pence > 0 && (
                        <div><dt className="inline text-gray-500">Deposit: </dt><dd className="inline">{formatPrice(r.price_pence)}</dd></div>
                      )}
                    </dl>
                    <a href={`?room=${roomSlug(r.name)}#enquiry`} className="inline-block text-sm text-chapel-600 hover:underline mt-3">
                      Enquire about this space →
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="enquiry" aria-labelledby="enquiry-heading" className="scroll-mt-24">
          <h2 id="enquiry-heading" className="text-xl font-semibold text-gray-900 mb-4">Booking enquiry</h2>
          <ContactForm
            key={selectedId ?? ''}
            bookingEnquiry
            rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
            defaultRoomId={selectedId}
          />
        </section>
      </div>
    </div>
  );
}
