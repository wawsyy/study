import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds to avoid configuration issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is done separately, allow build to continue with type errors
    ignoreBuildErrors: false,
  },
  headers() {
    // FHEVM may work without COOP, but Base Account SDK requires COOP to not be 'same-origin'
    // Try removing COOP header and keeping only COEP, or removing both if needed
    // Note: COEP can cause issues with some third-party services (like Coinbase)
    return Promise.resolve([
      {
        source: '/',
        headers: [
          // Removed COOP to allow Base Account SDK to work
          // COEP is set conditionally - may need to remove if causing issues
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]);
  },
  images: {
    unoptimized: true, // Disable image optimization to avoid issues
  },
};

export default nextConfig;

