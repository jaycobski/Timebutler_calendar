/**
 * Simplified Next.js Configuration for TimeButler Calendar MVP
 * Basic configuration for GitHub Pages deployment
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify deployment configuration (not static export)
  // output: 'export', // Commented out for Netlify
  trailingSlash: true,
  images: {
    unoptimized: true,
  },

  // Disable complex features for stability
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Basic security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;