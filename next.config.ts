import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes across the platform
        source: '/(.*)',
        headers: [
          {
            // Prevents attackers from embedding Special Sauce inside an invisible iframe (Clickjacking protection)
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Prevents browsers from MIME-sniffing a response away from the declared content-type
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Protects URL parameters and session paths when navigating to external links
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Enforces HTTPS connections for 2 years including subdomains
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Blocks unauthorized browser access to webcam, microphone, and geolocation APIs
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            // Blocks legacy cross-site scripting attacks in older browsers
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig