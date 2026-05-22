/**
 * Site Footer
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Contact details, directions, and copyright.
 */

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Contact */}
        <div>
          <h3 className="text-white font-semibold mb-3">Get in Touch</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                ✉️ Contact Us
              </Link>
            </li>
            <li>📞 07980 143776</li>
            <li>📍 132 Wincobank Avenue, S5 6BB</li>
          </ul>
        </div>

        {/* Directions */}
        <div>
          <h3 className="text-white font-semibold mb-3">Directions</h3>
          <p className="text-sm leading-relaxed">
            From M1 J34, follow A6109 to Sheffield. After ½ mile turn right at Jenkin Road.
            Continue to the top and over the brow of the hill. Fork left onto Wincobank Avenue.
            The chapel is 50 yards on the left, set back from the road.
          </p>
          <p className="text-sm mt-2">
            <strong className="text-gray-200">Buses:</strong> 95 and 95a stop outside the chapel.
          </p>
        </div>

        {/* Opening */}
        <div>
          <h3 className="text-white font-semibold mb-3">Opening Times</h3>
          <ul className="space-y-1 text-sm">
            <li><strong className="text-gray-200">Sundays:</strong> 10:30am – 12:30pm</li>
            <li><strong className="text-gray-200">Tuesdays:</strong> 10am – 1pm</li>
          </ul>
          <div className="mt-4 flex gap-3">
            <a
              href="https://www.facebook.com/search/top?q=upper%20wincobank%20chapel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-white transition-colors"
            >
              Facebook →
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Upper Wincobank Undenominational Chapel. All rights reserved.
      </div>
    </footer>
  );
}
