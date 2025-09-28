/**
 * PostCSS Configuration for TimeButler Calendar MVP
 * Optimized for minimal CSS bundle size and German market CDN
 */

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: [
    // Tailwind CSS processing
    'tailwindcss',

    // Autoprefixer for German market browser support
    ['autoprefixer', {
      overrideBrowserslist: [
        '> 1% in DE', // Focus on German market
        'last 2 versions',
        'not dead',
        'not ie <= 11',
        'Firefox ESR'
      ],
      grid: 'autoplace',
      flexbox: 'no-2009'
    }],

    // Production optimizations
    ...(isProd ? [
      // Advanced CSS optimization
      ['cssnano', {
        preset: ['advanced', {
          // Aggressive optimizations for <200KB target
          discardComments: {
            removeAll: true
          },

          // Merge and optimize rules
          mergeRules: true,
          mergeLonghand: true,
          mergeIdents: true,

          // Optimize selectors
          discardDuplicates: true,
          discardEmpty: true,
          discardOverridden: true,

          // Minimize values
          normalizeWhitespace: true,
          normalizeString: true,
          normalizeUrl: true,
          normalizeUnicode: true,

          // Optimize colors for German branding
          colormin: {
            // Preserve German brand colors
            legacy: false
          },

          // Convert values to shorter equivalents
          convertValues: {
            length: true,
            angle: true,
            time: true
          },

          // Optimize calc() expressions
          calc: true,

          // Reduce font weights
          reduceIdents: {
            keyframes: false, // Keep animation names readable
            counterStyle: false
          },

          // Z-index optimization
          zindex: true,

          // Optimize transforms
          reduceTransforms: true,

          // Safe optimizations only
          safe: true
        }]
      }],

      // Remove unused CSS (PurgeCSS integration)
      ['@fullhuman/postcss-purgecss', {
        content: [
          './src/**/*.{js,jsx,ts,tsx}',
          './pages/**/*.{js,jsx,ts,tsx}',
          './components/**/*.{js,jsx,ts,tsx}',
          './public/**/*.html'
        ],

        // Safelist for dynamic classes and German translations
        safelist: [
          // Language-specific classes
          /^(de|en)-/,

          // State classes
          /^(hover|focus|active|disabled|checked):/,

          // Animation classes
          /^animate-/,

          // Dynamic utility classes
          /^(text|bg|border)-(red|green|blue|yellow|gray|indigo)-(100|200|300|400|500|600|700|800|900)$/,

          // Responsive breakpoint classes
          /^(sm|md|lg|xl|2xl):/,

          // Accessibility classes
          /^sr-only$/,
          /^focus-visible$/,

          // React component classes
          /^react-/,

          // HeadlessUI classes
          /^headlessui-/
        ],

        // Extract dynamic class patterns
        extractors: [
          {
            extensions: ['js', 'jsx', 'ts', 'tsx'],
            extractor: (content) => {
              // Extract Tailwind classes
              const tailwindMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];

              // Extract clsx/className patterns
              const classNameMatches = content.match(/className\s*=\s*["`']([^"`']*)["`']/g) || [];
              const clsxMatches = content.match(/clsx\s*\(\s*["`']([^"`']*)["`']/g) || [];

              return [...tailwindMatches, ...classNameMatches, ...clsxMatches];
            }
          }
        ],

        // Options for better optimization
        defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],

        // German market specific whitelist patterns
        whitelistPatterns: [
          /^lang-(de|en)$/,
          /^dir-(ltr|rtl)$/
        ]
      }]
    ] : []),

    // Critical CSS inlining for performance
    ...(isProd ? [
      ['postcss-critical-css', {
        preserve: false,
        minify: true
      }]
    ] : []),

    // CSS modules support (if needed)
    ['postcss-modules', {
      generateScopedName: isProd
        ? '[hash:base64:5]'
        : '[name]__[local]___[hash:base64:5]',

      // Export class names for TypeScript
      getJSON: function(cssFileName, json, outputFileName) {
        // Write CSS modules TypeScript definitions
        if (isProd) {
          const fs = require('fs');
          const path = require('path');

          const tsPath = cssFileName.replace(/\.css$/, '.css.d.ts');
          const classNames = Object.keys(json);

          const tsContent = `// Auto-generated CSS module definitions
declare const styles: {
${classNames.map(name => `  readonly "${name}": string;`).join('\n')}
};
export default styles;
`;

          fs.writeFileSync(tsPath, tsContent);
        }
      }
    }],

    // PostCSS plugins for modern CSS features
    'postcss-nested',
    'postcss-custom-properties',
    'postcss-custom-media',

    // Import resolution
    ['postcss-import', {
      path: ['src/styles', 'node_modules']
    }],

    // URL processing for CDN optimization
    ...(isProd ? [
      ['postcss-url', {
        url: (asset) => {
          // Optimize for German CDN
          if (asset.relativePath.includes('fonts/')) {
            return `https://cdn-eu.timebutler.de/fonts/${asset.basename}`;
          }

          if (asset.relativePath.includes('images/')) {
            return `https://cdn-eu.timebutler.de/images/${asset.basename}`;
          }

          return asset.url;
        }
      }]
    ] : []),

    // CSS grid support for legacy browsers
    'postcss-flexbugs-fixes',

    // Optimize custom properties
    'postcss-custom-properties',

    // Add browser-specific prefixes for German market
    ['postcss-preset-env', {
      stage: 3,
      browsers: [
        '> 1% in DE',
        'last 2 versions',
        'not dead'
      ],
      autoprefixer: false, // Already handled above
      features: {
        'custom-properties': false, // Preserve CSS variables
        'nesting-rules': true
      }
    }]
  ],

  // Source map configuration
  map: isProd ? false : {
    inline: false,
    annotation: true
  },

  // Parser and stringifier options
  parser: 'postcss-scss',

  // Processing options
  from: undefined,
  to: undefined
};

// Bundle size monitoring for CSS
if (isProd) {
  console.log('🎨 PostCSS configured for minimal CSS bundle');
  console.log('🇩🇪 German market browser optimization enabled');
  console.log('🗜️  Advanced CSS minification active');
}