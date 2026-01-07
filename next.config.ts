import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Enable SharedArrayBuffer for FFmpeg.wasm (required for full-featured video export)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
};
export default nextConfig;
