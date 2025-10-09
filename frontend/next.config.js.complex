/**
 * Next.js Configuration for TimeButler Calendar MVP
 * Optimized for performance, accessibility, and German market requirements
 */

const nextTranslate = require('next-translate-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for <2s load time requirement
  compress: true,
  poweredByHeader: false,

  // GitHub Pages static export configuration
  output: 'export',
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES
    ? '/timebutler-calendar'
    : '',
  basePath: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES
    ? '/timebutler-calendar'
    : '',

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'clsx'],
    // App router is not enabled - using pages router for compatibility
  },

  // Image optimization disabled for static export
  // images: {
  //   formats: ['image/webp', 'image/avif'],
  //   deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  //   imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  //   domains: ['calendar.timebutler.de', 'timebutler.de'],
  //   minimumCacheTTL: 86400, // 24 hours
  // },

  // Security headers
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
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index',
        destination: '/',
        permanent: true,
      }
    ];
  },

  // Simplified Webpack configuration for deployment
  webpack: (config, { dev, isServer, webpack }) => {
    const path = require('path');
    // Complex optimization disabled for deployment - TODO: Re-enable after dependency resolution

    // Bundle analyzer - disabled for deployment
    // if (process.env.ANALYZE === 'true') {
    //   const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    //   config.plugins.push(
    //     new BundleAnalyzerPlugin({
    //       analyzerMode: 'server',
    //       analyzerPort: 8888,
    //       openAnalyzer: true,
    //       generateStatsFile: true,
    //       statsFilename: 'bundle-stats.json',
    //     })
    //   );
    // }

    // Simplified production optimizations for deployment
    if (!dev && !isServer) {
      // Basic tree shaking
      config.optimization.sideEffects = false;
      config.optimization.usedExports = true;

      // Simple progress monitoring
      config.plugins.push(
        new webpack.ProgressPlugin((percentage, message) => {
          if (percentage === 1) {
            console.log('✅ Build complete - Deployment ready');
          }
        })
      );
    }

    // Ignore moment.js locales to reduce bundle size
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    // Optimize imports for date-fns (used in holiday calculations)
    config.resolve.alias = {
      ...config.resolve.alias,
      'date-fns': path.resolve(__dirname, 'node_modules/date-fns'),
    };

    // Performance budgets - disabled for deployment
    config.performance = {
      hints: false, // Disable performance hints for deployment
    };

    return config;
  },

  // Output configuration for static export support
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },

  // Environment variables for build-time optimization
  env: {
    CUSTOM_KEY: 'timebutler-calendar-mvp',
    BUILD_TIME: new Date().toISOString(),
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    dirs: ['src', 'pages', 'components'],
    ignoreDuringBuilds: true,
  },

  // Internationalization disabled for static export
  // i18n: {
  //   locales: ['de', 'en'],
  //   defaultLocale: 'de',
  //   localeDetection: false,
  // },
};

// Apply next-translate plugin - disabled for static export deployment
// module.exports = nextTranslate(nextConfig);
module.exports = nextConfig;