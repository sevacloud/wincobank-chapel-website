import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.15.135'],
  experimental: {
    serverActions: {
      // Trustee expense/invoice submissions carry receipts (capped at 4.5 MB
      // in app/trustees/evidence-rules.ts); allow headroom for form fields.
      bodySizeLimit: '5mb',
    },
  },
  async redirects() {
    return [
      // Online booking isn't live yet: send old booking links to the enquiry
      // form with the room preselected. Temporary, so it can be removed when
      // the /rooms/[roomId]/book flow is switched back on.
      { source: '/rooms/:roomId/book', destination: '/rooms?room=:roomId', permanent: false },
    ];
  },
  async headers() {
    // Trustee portal: never framed (clickjacking on admin actions), no MIME
    // sniffing, no referrer leaking portal URLs to other sites.
    const trusteeHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];
    return [
      { source: '/trustees/:path*', headers: trusteeHeaders },
      { source: '/trustees', headers: trusteeHeaders },
      { source: '/api/trustees/:path*', headers: trusteeHeaders },
    ];
  },
};

export default nextConfig;
