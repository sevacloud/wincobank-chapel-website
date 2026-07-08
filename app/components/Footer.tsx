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
            <li>
              <Link href="/donate" className="hover:text-white transition-colors">
                💚 Make a Donation
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
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
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
