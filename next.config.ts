import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Proxy destination for /api/* rewrites.
// Set NEXT_BACKEND_URL in .env.local (dev) or Vercel env vars (prod).
const backendUrl = process.env.NEXT_BACKEND_URL ||
  (isDev ? 'http://localhost:5001' : 'https://investing-lab-ai-backend.vercel.app/');

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
    // backendUrl is derived from NEXT_BACKEND_URL env var (see top of file)
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;