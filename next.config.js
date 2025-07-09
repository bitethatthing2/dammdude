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
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tvnpgbjypnezoasbhbwx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Skip API routes from build to avoid NextJS 15 type issues
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Disable experimental features causing issues
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Better dev server configuration
  devIndicators: {
    position: 'bottom-right',
  },
  
  // Compression
  compress: true,
  
  // Generate static pages where possible
  // output: 'standalone', // Temporarily disabled for development
  
  async headers() {
    return [
      // Service Worker headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // Static assets caching
      {
        source: '/food-menu-images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Font caching
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Security headers
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/sw.js',
      },
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
      {
        source: '/offline.html',
        destination: '/offline.html',
      },
    ];
  },
  
  // Minimal webpack config to avoid issues
  webpack: (config, { isServer, dev, webpack }) => {
    // Only inject Firebase config into service worker in production
    if (!isServer && !dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'self.FIREBASE_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''),
          'self.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''),
          'self.FIREBASE_PROJECT_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''),
          'self.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''),
          'self.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''),
          'self.FIREBASE_APP_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''),
          'self.FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''),
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
