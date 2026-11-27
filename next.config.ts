import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "specialsauce.io",
      },
      {
        protocol: "https",
        hostname: "www.specialsauce.io",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/signup/candidate", destination: "/signup/professional", permanent: true }, // DO NOT serve legacy signup path
      { source: "/talent-shield", destination: "/hiring-bridge", permanent: true },
      { source: "/shield/:token", destination: "/hiring-bridge/:token", permanent: true },
      { source: "/workflows", destination: "/how-it-works", permanent: true },
      { source: "/inbound-shield", destination: "/how-it-works?tab=professional", permanent: true },
      { source: "/dashboard/talent-shield", destination: "/dashboard/hiring-bridge", permanent: true },
      { source: "/dashboard/employer/talent-shield", destination: "/dashboard/hiring-bridge", permanent: true },
      { source: "/dashboard/employer/shield", destination: "/dashboard/employer/hiring-bridge", permanent: true },
      { source: "/dashboard/workflows", destination: "/dashboard/how-it-works", permanent: true },
      { source: "/dashboard/inbound-shield", destination: "/dashboard/how-it-works", permanent: true },
      { source: "/dashboard/shield", destination: "/dashboard", permanent: true },
      { source: "/dashboard/employer", destination: "/dashboard", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com https://billing.stripe.com; object-src 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
