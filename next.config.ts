import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  transpilePackages: ['react-select-virtualized', 'react-virtualized'],
  // reactCompiler: true, // Disabled — experimental, causes hydration mismatches and broken form handlers
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    if (isDev) {
      // In development, proxy /api/* to the local backend so cookies work correctly
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:5001/api/:path*",
        },
      ];
    }
    // In production (Vercel), proxy to the deployed backend
    return [
      {
        source: "/api/:path*",
        destination: "https://praedico-backend.vercel.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;