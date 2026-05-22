/**
 * Facilities Page
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Route: /facilities
 * Migrated from legacy: facilities.html
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Facilities',
  description: 'Our facilities — Main Chapel seating 100, School Room, Upper Hall, kitchen, grounds and more.',
};

export default function FacilitiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Facilities</h1>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Main Chapel</h2>
          <p className="text-gray-600 leading-relaxed">
            Restored in 2005, thanks to a grant from English Heritage, the Chapel has retained
            traditional, polished oak pews with cushions and seats 100. Above is a simple but
            magnificent oak beamed roof vault. The chapel is carpeted with modern gas fired
            heating. Used regularly for Christian worship it is available for weddings, baptisms
            and funerals and is also suitable for meetings, concerts, lectures and training.
            A projection and screen are available.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">School Room</h2>
          <p className="text-gray-600 leading-relaxed">
            This friendly community space is the perfect size for seated groups up to 30.
            A modern fire exit and concrete ramp to the beautiful garden gives easy disabled
            access and the room is well equipped with electric sockets, gas fired central
            heating radiators. Modern stacking chairs and folding tables make it a flexible
            multi-purpose facility. The room is also suitable for children&apos;s parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Upper Hall</h2>
          <p className="text-gray-600 leading-relaxed">
            An easy staircase leads up to an interesting small hall in the roof space of the
            school room with oak beams and feature window. Also used as a youth room this
            space could be used for meetings and activities. Please note there is no disabled
            access to this floor.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Kitchen</h2>
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-sm mb-4 max-w-md">
            <Image
              src="/media/posts/4/chapelKitchenWeb-09-4.jpg"
              alt="The chapel kitchen"
              fill
              className="object-cover"
            />
          </div>
          <p className="text-gray-600 leading-relaxed">
            A recently refurbished kitchen is fully equipped with 3 sinks, a double gas hob,
            2 electric ovens, dishwasher and microwave, refrigerator and a full set of modern
            crockery.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Toilets</h2>
          <p className="text-gray-600 leading-relaxed">
            Modern facilities include an enabled unisex toilet with handrails and baby change
            facilities, fully air conditioned.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Grounds</h2>
          <p className="text-gray-600 leading-relaxed">
            An extensive garden area enclosed with railings provides leisure and play space.
            A well loved feature is the giant horse-chestnut tree which provides generous
            supplies of conkers every Autumn.
          </p>
        </section>

        <section className="bg-indigo-50 border border-indigo-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hire Our Spaces</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            A modest rent is charged to help us cover the cost of heating and maintenance.
            We are particularly keen to support activities of benefit to the local community.
          </p>
          <Link
            href="/rooms"
            className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            View Rooms &amp; Book Online
          </Link>
        </section>
      </div>
    </div>
  );
}
