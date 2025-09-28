/**
 * Tailwind CSS Configuration for TimeButler Calendar MVP
 * Optimized for <200KB bundle target with German market branding
 */

const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Content paths for PurgeCSS optimization
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html'
  ],

  // Dark mode configuration (toggle-based for user preference)
  darkMode: 'class',

  theme: {
    // Extend default theme with German market optimization
    extend: {
      // TimeButler brand colors (German corporate identity)
      colors: {
        // Primary brand colors
        timebutler: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Primary brand blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },

        // German flag-inspired accents (subtle usage)
        german: {
          black: '#000000',
          red: '#dd0000',
          gold: '#ffce00',
        },

        // Accessible color palette
        gray: colors.slate,
        red: colors.red,
        yellow: colors.amber,
        green: colors.emerald,
        blue: colors.blue,
        indigo: colors.indigo,
        purple: colors.violet,
        pink: colors.pink,
      },

      // Typography optimized for German text
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },

      // Spacing scale optimized for German UI patterns
      spacing: {
        18: '4.5rem',
        88: '22rem',
        98: '24.5rem',
      },

      // German market responsive breakpoints
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },

      // Animation optimized for performance
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },

      // Box shadows for depth (minimal for performance)
      boxShadow: {
        'timebutler': '0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06)',
        'timebutler-lg': '0 10px 15px -3px rgba(14, 165, 233, 0.1), 0 4px 6px -2px rgba(14, 165, 233, 0.05)',
      },

      // Border radius for German design preferences
      borderRadius: {
        '4xl': '2rem',
      },

      // Z-index scale
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },
    },

    // Override default values to reduce bundle size
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1rem', { lineHeight: '1.5rem' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
    },

    // Optimized spacing scale
    spacing: {
      px: '1px',
      0: '0',
      0.5: '0.125rem',
      1: '0.25rem',
      1.5: '0.375rem',
      2: '0.5rem',
      2.5: '0.625rem',
      3: '0.75rem',
      3.5: '0.875rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      11: '2.75rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem',
    },
  },

  // Plugins (minimal set for performance)
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', // Use class-based strategy to reduce CSS
    }),

    require('@tailwindcss/typography')({
      className: 'prose', // Single class name
    }),

    // Custom plugin for German-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // German text formatting
        '.text-formal': {
          fontWeight: '400',
          letterSpacing: '0.015em',
        },

        // TimeButler brand utilities
        '.brand-gradient': {
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        },

        // Accessibility utilities
        '.focus-ring': {
          outline: '2px solid transparent',
          outlineOffset: '2px',
          '&:focus': {
            outline: '2px solid #0ea5e9',
            outlineOffset: '2px',
          },
        },

        // Performance-optimized transitions
        '.transition-fast': {
          transitionProperty: 'color, background-color, border-color',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDuration: '150ms',
        },
      };

      addUtilities(newUtilities);
    },
  ],

  // Bundle size optimization
  corePlugins: {
    // Disable unused core plugins to reduce bundle size
    container: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
    scrollSnapType: false,
    scrollSnapAlign: false,
    scrollSnapStop: false,
    borderOpacity: false,
    textOpacity: false,
    backgroundOpacity: false,
    divideOpacity: false,
    placeholderOpacity: false,
    ringOpacity: false,
  },

  // JIT mode for optimal compilation
  mode: 'jit',

  // Prefix for CSS classes (optional, for namespace isolation)
  // prefix: 'tb-',

  // Important modifier
  important: false,

  // Separator for responsive and state variants
  separator: ':',

  // Safelist for dynamic classes (minimal for bundle optimization)
  safelist: [
    // Language-specific classes
    'lang-de',
    'lang-en',

    // State classes that might be applied dynamically
    'bg-red-500',
    'bg-green-500',
    'bg-yellow-500',
    'text-red-600',
    'text-green-600',
    'text-yellow-600',

    // Animation classes
    'animate-pulse',
    'animate-spin',

    // Focus states for accessibility
    'focus:ring-2',
    'focus:ring-timebutler-500',
  ],

  // Blocklist for classes that should never be generated
  blocklist: [
    // Large spacing utilities we don't need
    'p-96',
    'm-96',
    'w-96',
    'h-96',

    // Unnecessary color variants
    'bg-rose-',
    'bg-fuchsia-',
    'bg-cyan-',
    'bg-lime-',
    'bg-orange-',
  ],
};

// Environment-specific optimizations
if (process.env.NODE_ENV === 'production') {
  console.log('🎨 Tailwind optimized for <200KB bundle target');
  console.log('🇩🇪 German market branding applied');
  console.log('🗜️  JIT compilation enabled for minimal CSS');
}