import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/images/**',
      },
      {

        protocol: 'https',
        hostname: 'csjzzhibbavtelupqugc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/images/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/images/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        port: '',
        pathname: '/storage/v1/object/public/images/**',
      },
    ],
  },
}

export default nextConfig
