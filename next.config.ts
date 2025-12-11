import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
      {
        source: '/realtime',
        destination: 'http://localhost:5001/realtime',
      },
    ];
  },
};
export default nextConfig;
