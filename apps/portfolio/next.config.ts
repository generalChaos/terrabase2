import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'www.terrabase2.com',
          },
        ],
        destination: 'https://portfolio.terrabase2.com',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.terrabase2.com',
          },
        ],
        destination: 'https://portfolio.terrabase2.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

