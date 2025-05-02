/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Move allowedDevOrigins inside experimental as per Next.js docs
    allowedDevOrigins: [
      'http://localhost:3000',
      'http://127.0.0.1:64913', // Specific port for the browser preview
      'http://127.0.0.1:*',     // Wildcard for any port on 127.0.0.1
    ],
  },
  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        destination: '/firebase-messaging-sw.js',     
      },
      // Ensure favicon.ico is always served correctly
      {
        source: '/favicon.ico',
        destination: '/favicon.ico',
      },
      {
        source: '/icons/favicon.ico',
        destination: '/favicon.ico',
      },
    ];
  },
};

module.exports = nextConfig;
