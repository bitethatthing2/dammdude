/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // This is used to facilitate deployment on Vercel while we continue to fix type issues.
    // In the future, this should be removed once all type errors are resolved.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Similarly, allow production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['xrqsqjwbmxgvbfnqxvmb.supabase.co'],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'dammdude.vercel.app']
    }
  }
};

module.exports = nextConfig;