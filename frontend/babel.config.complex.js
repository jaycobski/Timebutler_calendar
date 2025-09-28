/**
 * Babel Configuration for TimeButler Calendar MVP
 * Optimized for <200KB bundle target with bilingual support
 */

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  presets: [
    [
      'next/babel',
      {
        'preset-env': {
          // Target modern browsers for German market
          targets: {
            browsers: [
              '> 1% in DE', // Focus on German market browser usage
              'last 2 versions',
              'not dead',
              'not ie <= 11'
            ]
          },
          modules: false, // Preserve ES modules for tree shaking
          loose: true, // Faster compilation
          bugfixes: true,
          shippedProposals: true,

          // Only include necessary polyfills
          useBuiltIns: 'usage',
          corejs: {
            version: '3.32',
            proposals: true
          },

          // Exclude transformations that modern browsers support
          exclude: [
            'transform-async-to-generator',
            'transform-regenerator'
          ]
        }
      }
    ]
  ],

  plugins: [
    // Production optimizations
    ...(isProd ? [
      // Remove console.log statements in production (keep errors/warnings)
      ['babel-plugin-transform-remove-console', {
        exclude: ['error', 'warn', 'info']
      }],

      // Optimize dead code elimination
      ['babel-plugin-transform-remove-debugger'],

      // Remove development-only PropTypes
      ['babel-plugin-transform-react-remove-prop-types', {
        mode: 'remove',
        removeImport: true,
        additionalLibraries: ['react-immutable-proptypes']
      }]
    ] : []),

    // Import optimizations for smaller bundles
    ['babel-plugin-import', {
      libraryName: '@heroicons/react',
      libraryDirectory: 'outline', // Default to outline icons
      camel2DashComponentName: false,
      transformToDefaultImport: false
    }, 'heroicons-outline'],

    ['babel-plugin-import', {
      libraryName: '@heroicons/react/solid',
      libraryDirectory: 'solid',
      camel2DashComponentName: false,
      transformToDefaultImport: false
    }, 'heroicons-solid'],

    // Optimize date-fns imports (critical for holiday calculations)
    ['babel-plugin-date-fns', {
      useESModules: true
    }],

    // Optimize clsx imports
    ['babel-plugin-import', {
      libraryName: 'clsx',
      libraryDirectory: '',
      camel2DashComponentName: false
    }, 'clsx'],

    // React optimizations
    ['babel-plugin-transform-react-constant-elements'],
    ['babel-plugin-transform-react-inline-elements'],

    // Runtime optimizations
    ...(isProd ? [
      ['babel-plugin-transform-runtime', {
        corejs: false,
        helpers: true,
        regenerator: false,
        useESModules: true,
        absoluteRuntime: false,
        version: '^7.22.0'
      }]
    ] : []),

    // Internationalization optimizations
    ['babel-plugin-react-intl', {
      messagesDir: './src/i18n/messages',
      enforceDescriptions: false,
      extractSourceLocation: !isProd,
      removeDefaultMessage: isProd
    }]
  ],

  // Environment-specific configurations
  env: {
    development: {
      plugins: [
        // Development helpers
        ['babel-plugin-react-refresh']
      ]
    },

    production: {
      plugins: [
        // Additional production optimizations
        ['babel-plugin-transform-react-pure-annotations'],
        ['babel-plugin-minify-dead-code-elimination'],
        ['babel-plugin-minify-constant-folding']
      ]
    },

    test: {
      presets: [
        ['next/babel', {
          'preset-env': {
            targets: { node: 'current' }
          }
        }]
      ]
    }
  },

  // Optimization settings
  compact: isProd,
  minified: isProd,
  comments: !isProd,

  // Source map support
  sourceMaps: true,
  inputSourceMap: true,

  // Caching for faster builds
  cacheDirectory: true,
  cacheCompression: false,

  // Parser options for modern JavaScript
  parserOpts: {
    strictMode: true,
    allowImportExportEverywhere: false,
    allowReturnOutsideFunction: false,
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      'dynamicImport',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'functionBind',
      'nullishCoalescingOperator',
      'objectRestSpread',
      'optionalChaining',
      'topLevelAwait'
    ]
  },

  // Generator options
  generatorOpts: {
    compact: isProd,
    minified: isProd,
    concise: isProd,
    retainLines: !isProd,
    shouldPrintComment: isProd ? () => false : undefined
  }
};

// Bundle size monitoring
if (isProd) {
  console.log('🎯 Babel configured for <200KB bundle target');
  console.log('🇩🇪 German market browser optimization enabled');
  console.log('🌍 Bilingual support: German (formal) + English (casual)');
}