/** @type {import('next').NextConfig} */
const { securityHeaders } = require('./src/lib/security-headers.js')

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    // Disable security headers in development
    if (process.env.NODE_ENV === 'development') {
      return []
    }
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'recharts'],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: '/broken',
        destination: '/upload',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig