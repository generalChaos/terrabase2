import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    domains: [
      'localhost', 
      '127.0.0.1', 
      'csjzzhibbavtelupqugc.supabase.co',
      '*.supabase.co', 
      '*.supabase.in'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'csjzzhibbavtelupqugc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/images/**',
      },
    ],
  },
}

export default nextConfig
