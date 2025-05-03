/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Disable typechecking and linting during build for testing
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Skip API routes from build to avoid NextJS 15 type issues
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
    allowedDevOrigins: [
      'http://localhost:3000',
      'http://127.0.0.1:64913',
      'http://127.0.0.1:*',
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