/**
 * Webpack Configuration for TimeButler Calendar MVP
 * Optimized for <200KB gzipped bundle target with bilingual support
 *
 * Performance Requirements:
 * - Bundle size: <200KB gzipped
 * - Load time: <2s on 3G
 * - Support: 25,000 concurrent users
 * - Bilingual: German (formal) & English (casual)
 */

const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// Environment detection
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const isAnalyze = process.env.ANALYZE === 'true';

// German market CDN configuration
const CDN_DOMAINS = {
  de: 'https://cdn-eu.timebutler.de',
  global: 'https://cdn.timebutler.de'
};

// Bundle size targets (in bytes)
const BUNDLE_TARGETS = {
  main: 150 * 1024, // 150KB main bundle
  vendor: 40 * 1024, // 40KB vendor chunk
  i18n: 10 * 1024,  // 10KB per language
  total: 200 * 1024 // 200KB total gzipped
};

/**
 * Advanced code splitting configuration
 */
const splitChunks = {
  chunks: 'all',
  minSize: 10000, // 10KB minimum chunk size
  maxSize: 40000, // 40KB maximum chunk size
  minChunks: 1,
  maxAsyncRequests: 30,
  maxInitialRequests: 20,
  enforceSizeThreshold: 50000,

  cacheGroups: {
    // React core libraries
    react: {
      test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
      name: 'react',
      chunks: 'all',
      priority: 40,
      reuseExistingChunk: true,
    },

    // Next.js framework
    nextjs: {
      test: /[\\/]node_modules[\\/]next[\\/]/,
      name: 'nextjs',
      chunks: 'all',
      priority: 35,
      reuseExistingChunk: true,
    },

    // Date handling libraries (critical for holiday calculations)
    dateLibs: {
      test: /[\\/]node_modules[\\/](date-fns|date-fns-tz)[\\/]/,
      name: 'date-libs',
      chunks: 'all',
      priority: 30,
      reuseExistingChunk: true,
    },

    // UI libraries
    ui: {
      test: /[\\/]node_modules[\\/](@headlessui|@heroicons|focus-trap-react|react-aria)[\\/]/,
      name: 'ui-libs',
      chunks: 'all',
      priority: 25,
      reuseExistingChunk: true,
    },

    // Internationalization
    i18n: {
      test: /[\\/]node_modules[\\/](next-translate|react-intl)[\\/]/,
      name: 'i18n',
      chunks: 'all',
      priority: 20,
      reuseExistingChunk: true,
    },

    // Utilities and small libraries
    utils: {
      test: /[\\/]node_modules[\\/](clsx|js-cookie)[\\/]/,
      name: 'utils',
      chunks: 'all',
      priority: 15,
      reuseExistingChunk: true,
    },

    // Common vendor libraries
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendor',
      chunks: 'all',
      priority: 10,
      reuseExistingChunk: true,
    },

    // Application common code
    common: {
      name: 'common',
      minChunks: 2,
      chunks: 'all',
      priority: 5,
      reuseExistingChunk: true,
    }
  }
};

/**
 * Tree shaking configuration for maximum dead code elimination
 */
const treeShakingRules = [
  // Aggressive tree shaking for date-fns
  {
    test: /[\\/]node_modules[\\/]date-fns[\\/]/,
    sideEffects: false,
  },

  // Tree shake unused Heroicons
  {
    test: /[\\/]node_modules[\\/]@heroicons[\\/]/,
    sideEffects: false,
  },

  // Tree shake lodash if used
  {
    test: /[\\/]node_modules[\\/]lodash[\\/]/,
    sideEffects: false,
  }
];

/**
 * Compression optimization for German market
 */
const compressionPlugins = [
  // Brotli compression (preferred by German CDNs)
  new CompressionPlugin({
    filename: '[path][base].br',
    algorithm: 'brotliCompress',
    test: /\.(js|css|html|svg|json)$/,
    compressionOptions: {
      level: 11, // Maximum compression
    },
    threshold: 8192, // Only compress files > 8KB
    minRatio: 0.8,
    deleteOriginalAssets: false,
  }),

  // Gzip fallback
  new CompressionPlugin({
    filename: '[path][base].gz',
    algorithm: 'gzip',
    test: /\.(js|css|html|svg|json)$/,
    compressionOptions: {
      level: 9, // Maximum compression
    },
    threshold: 8192,
    minRatio: 0.8,
    deleteOriginalAssets: false,
  })
];

/**
 * Production optimization configuration
 */
const optimization = {
  minimize: isProd,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        compress: {
          // Aggressive compression for <200KB target
          drop_console: isProd, // Remove console.logs in production
          drop_debugger: isProd,
          pure_funcs: isProd ? ['console.log', 'console.info'] : [],
          passes: 3, // Multiple passes for better compression
          unsafe_arrows: true,
          unsafe_methods: true,
          unsafe_proto: true,
          keep_fargs: false,
          keep_fnames: false,
        },
        mangle: {
          safari10: true,
          keep_fnames: false,
        },
        format: {
          comments: false,
          ascii_only: true, // Ensure German characters are handled properly
        },
        safari10: true,
      },
      extractComments: false,
      parallel: true,
    })
  ],

  splitChunks,

  // Advanced module concatenation
  concatenateModules: true,

  // Optimize module IDs for better caching
  moduleIds: 'deterministic',
  chunkIds: 'deterministic',

  // Remove empty chunks
  removeEmptyChunks: true,

  // Merge duplicate chunks
  mergeDuplicateChunks: true,

  // Flag dependency usage
  flagIncludedChunks: true,

  // Optimize side effects
  sideEffects: false,

  // Tree shaking
  usedExports: true,
  providedExports: true,
};

/**
 * Bilingual asset optimization
 */
const i18nOptimization = {
  // Language-specific chunk loading
  splitLanguageChunks: true,

  // Async loading of non-default language
  asyncLanguageLoading: true,

  // Minimize translation bundle size
  minifyTranslations: isProd,

  // CDN optimization for translations
  translationCDN: isProd ? CDN_DOMAINS.de : false,
};

/**
 * Performance budgets and monitoring
 */
const performanceBudgets = {
  maxAssetSize: BUNDLE_TARGETS.main,
  maxEntrypointSize: BUNDLE_TARGETS.total,
  hints: isProd ? 'error' : 'warning',

  // Asset size filters
  assetFilter: function(assetFilename) {
    // Ignore source maps and compression files from budget
    return !(/\.map$/.test(assetFilename)) &&
           !(/\.(br|gz)$/.test(assetFilename));
  }
};

/**
 * Main webpack configuration
 */
const webpackConfig = {
  mode: isProd ? 'production' : 'development',

  // Entry point optimization
  entry: {
    main: './src/pages/_app.tsx',
  },

  // Output configuration for CDN optimization
  output: {
    path: path.resolve(__dirname, '.next'),
    filename: isProd ? 'static/chunks/[name].[contenthash:8].js' : '[name].js',
    chunkFilename: isProd ? 'static/chunks/[name].[contenthash:8].js' : '[name].chunk.js',
    publicPath: isProd ? CDN_DOMAINS.de + '/_next/' : '/_next/',

    // German market optimization
    crossOriginLoading: 'anonymous',
    hashDigestLength: 8,
    clean: true,
  },

  // Module resolution optimization
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/pages': path.resolve(__dirname, 'src/pages'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
      '@/i18n': path.resolve(__dirname, 'src/i18n'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
    },

    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],

    // Prefer ES modules for better tree shaking
    mainFields: ['module', 'main'],

    // Optimize module resolution
    symlinks: false,
    cacheWithContext: false,
  },

  // Module rules for optimization
  module: {
    rules: [
      // TypeScript/JavaScript optimization
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['next/babel', {
                'preset-env': {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
                  },
                  modules: false, // Preserve ES modules for tree shaking
                  loose: true, // Faster compilation
                }
              }]
            ],
            plugins: [
              // Optimize bundle size
              ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }],

              // Import optimization
              ['babel-plugin-import', {
                libraryName: '@heroicons/react',
                libraryDirectory: '',
                camel2DashComponentName: false,
              }, 'heroicons'],

              // Date-fns optimization
              ['babel-plugin-date-fns', {
                useESModules: true
              }]
            ],
            cacheDirectory: true,
            cacheCompression: false,
          }
        }
      },

      // CSS optimization
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: false,
              importLoaders: 1,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'tailwindcss',
                  'autoprefixer',
                  ...(isProd ? [
                    ['cssnano', {
                      preset: ['advanced', {
                        discardComments: { removeAll: true },
                        reduceIdents: true,
                        mergeIdents: true,
                        zindex: true,
                      }]
                    }]
                  ] : [])
                ]
              }
            }
          }
        ]
      },

      // Image optimization
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp|avif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8KB inline threshold
          }
        },
        generator: {
          filename: 'static/images/[name].[contenthash:8][ext]'
        }
      },

      // Font optimization
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[name].[contenthash:8][ext]'
        }
      },

      ...treeShakingRules
    ]
  },

  optimization,

  // Performance configuration
  performance: performanceBudgets,

  // Plugins for optimization
  plugins: [
    // Define environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.BUNDLE_TARGET_SIZE': JSON.stringify(BUNDLE_TARGETS.total),
      'process.env.I18N_CDN': JSON.stringify(i18nOptimization.translationCDN),
    }),

    // Ignore moment.js locales (if used)
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),

    // Module concatenation
    new webpack.optimize.ModuleConcatenationPlugin(),

    // Compression plugins for production
    ...(isProd ? compressionPlugins : []),

    // Bundle analyzer for development
    ...(isAnalyze ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        analyzerHost: 'localhost',
        analyzerPort: 8888,
        openAnalyzer: true,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
        logLevel: 'info'
      })
    ] : []),

    // Progress plugin for build monitoring
    new webpack.ProgressPlugin((percentage, message, ...args) => {
      if (percentage === 1) {
        console.log('✅ Bundle optimization complete');
        console.log(`📊 Target: <${BUNDLE_TARGETS.total / 1024}KB gzipped`);
      }
    }),
  ],

  // Development server optimization
  devServer: {
    compress: true,
    hot: true,
    liveReload: true,
    open: false,
    port: 3000,

    // German market headers
    headers: {
      'Accept-Encoding': 'br, gzip',
      'Cache-Control': 'public, max-age=31536000',
    }
  },

  // Source maps for debugging
  devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',

  // Target modern browsers for German market
  target: ['web', 'es2020'],

  // Stats configuration
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: true,
    assets: true,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: true,
    errorDetails: true,
    warnings: true,
    publicPath: false,

    // Bundle size reporting
    performance: true,
    optimizationBailout: true,
  },

  // Cache configuration for faster builds
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
    cacheDirectory: path.resolve(__dirname, '.next/cache/webpack'),
  },

  // Experiments for future optimizations
  experiments: {
    topLevelAwait: true,
    futureDefaults: true,
  }
};

// Bilingual chunk optimization
if (isProd) {
  webpackConfig.optimization.splitChunks.cacheGroups.translations = {
    test: /[\\/](locales|translations|i18n)[\\/]/,
    name(module, chunks, cacheGroupKey) {
      // Create separate chunks for each language
      const chunkName = chunks.map(chunk => chunk.name).join('~');
      return `i18n-${chunkName}`;
    },
    chunks: 'all',
    priority: 50,
    enforce: true,
  };
}

// Export configuration with validation
module.exports = function(env, argv) {
  console.log('🚀 TimeButler Calendar Webpack Configuration');
  console.log(`📦 Mode: ${webpackConfig.mode}`);
  console.log(`🎯 Bundle target: <${BUNDLE_TARGETS.total / 1024}KB gzipped`);
  console.log(`🌍 Bilingual support: German (formal) + English (casual)`);
  console.log(`🇩🇪 German market CDN: ${CDN_DOMAINS.de}`);

  return webpackConfig;
};

// Performance monitoring helper
webpackConfig.bundleMonitor = {
  checkBundleSize: function(stats) {
    const assets = stats.compilation.assets;
    let totalSize = 0;

    Object.keys(assets).forEach(assetName => {
      if (assetName.endsWith('.js') && !assetName.includes('.map')) {
        totalSize += assets[assetName].size();
      }
    });

    const targetSize = BUNDLE_TARGETS.total;
    const percentage = (totalSize / targetSize) * 100;

    console.log(`📊 Bundle size: ${(totalSize / 1024).toFixed(2)}KB (${percentage.toFixed(1)}% of target)`);

    if (totalSize > targetSize) {
      console.warn(`⚠️  Bundle exceeds target size by ${((totalSize - targetSize) / 1024).toFixed(2)}KB`);
    } else {
      console.log(`✅ Bundle within target size (${((targetSize - totalSize) / 1024).toFixed(2)}KB under limit)`);
    }

    return {
      size: totalSize,
      target: targetSize,
      withinTarget: totalSize <= targetSize,
      percentage: percentage
    };
  }
};

// Export bundle targets for external monitoring
webpackConfig.bundleTargets = BUNDLE_TARGETS;