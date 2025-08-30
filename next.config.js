/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'recharts'],
  },
  turbopack: {
    rules: {
      '*.svg': ['@svgr/webpack', 'asset'],
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig