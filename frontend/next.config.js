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

  // Image optimization for performance
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['calendar.timebutler.de', 'timebutler.de'],
    minimumCacheTTL: 86400, // 24 hours
  },

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

  // Advanced Webpack optimization for <200KB bundle target
  webpack: (config, { dev, isServer, webpack }) => {
    const path = require('path');
    // const TerserPlugin = require('terser-webpack-plugin'); // TODO: Install dependency
    // const CompressionPlugin = require('compression-webpack-plugin');

    // Bundle analyzer for production builds
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
          generateStatsFile: true,
          statsFilename: 'bundle-stats.json',
        })
      );
    }

    // Production optimizations for <200KB target
    if (!dev && !isServer) {
      // Advanced code splitting for optimal loading
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 10000,
        maxSize: 40000,
        cacheGroups: {
          // React libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 40,
            enforce: true,
          },
          // Date handling (critical for holiday calculations)
          dateLibs: {
            test: /[\\/]node_modules[\\/](date-fns|date-fns-tz)[\\/]/,
            name: 'date-libs',
            chunks: 'all',
            priority: 35,
            enforce: true,
          },
          // UI components
          ui: {
            test: /[\\/]node_modules[\\/](@headlessui|@heroicons|react-aria)[\\/]/,
            name: 'ui-libs',
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          // Internationalization
          i18n: {
            test: /[\\/]node_modules[\\/](next-translate)[\\/]/,
            name: 'i18n',
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          // Utilities
          utils: {
            test: /[\\/]node_modules[\\/](clsx|js-cookie)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          // Default vendor chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 10,
          },
        },
      };

      // Enhanced minimization - TODO: Re-enable when terser-webpack-plugin is installed
      // config.optimization.minimizer = [
      //   new TerserPlugin({
      //     terserOptions: {
      //       compress: {
      //         drop_console: true,
      //         drop_debugger: true,
      //         passes: 3,
      //         unsafe_arrows: true,
      //         unsafe_methods: true,
      //         keep_fargs: false,
      //       },
      //       mangle: {
      //         safari10: true,
      //         keep_fnames: false,
      //       },
      //       format: {
      //         comments: false,
      //         ascii_only: true, // Handle German characters properly
      //       },
      //     },
      //     extractComments: false,
      //     parallel: true,
      //   }),
      // ];

      // Aggressive tree shaking
      config.optimization.sideEffects = false;
      config.optimization.usedExports = true;
      config.optimization.providedExports = true;

      // Module concatenation
      config.optimization.concatenateModules = true;

      // Compression plugins - TODO: Install compression-webpack-plugin
      // config.plugins.push(
      //   // Brotli compression (preferred by German CDNs)
      //   new CompressionPlugin({
      //     filename: '[path][base].br',
      //     algorithm: 'brotliCompress',
      //     test: /\.(js|css|html|svg)$/,
      //     compressionOptions: { level: 11 },
      //     threshold: 8192,
      //     minRatio: 0.8,
      //   }),
      //   // Gzip fallback
      //   new CompressionPlugin({
      //     filename: '[path][base].gz',
      //     algorithm: 'gzip',
      //     test: /\.(js|css|html|svg)$/,
      //     compressionOptions: { level: 9 },
      //     threshold: 8192,
      //     minRatio: 0.8,
      //   })
      // );

      // Bundle size monitoring
      config.plugins.push(
        new webpack.ProgressPlugin((percentage, message) => {
          if (percentage === 1) {
            console.log('✅ Bundle optimization complete - Target: <200KB gzipped');
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

    // Performance budgets
    config.performance = {
      maxAssetSize: 150000, // 150KB max per asset
      maxEntrypointSize: 200000, // 200KB max entry point
      hints: 'error',
    };

    return config;
  },

  // Output configuration for static export support
  output: 'standalone',
  trailingSlash: false,

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

  // Internationalization will be handled by next-translate
  i18n: {
    locales: ['de', 'en'],
    defaultLocale: 'de',
    localeDetection: false,
  },
};

// Apply next-translate plugin
module.exports = nextTranslate(nextConfig);