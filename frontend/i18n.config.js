/**
 * i18n Configuration for TimeButler Calendar MVP
 * Optimized for <200KB bundle with efficient bilingual splitting
 */

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  // Supported locales
  locales: ['de', 'en'],
  defaultLocale: 'de', // German is primary for the German market

  // Pages configuration for optimal splitting
  pages: {
    // Main application pages
    '*': [
      'common',      // Shared UI elements
      'navigation',  // Menu and navigation
      'forms',       // Form labels and validation
      'errors',      // Error messages
    ],

    // Home page specific
    '/': [
      'home',        // Landing page content
      'hero',        // Hero section
      'features',    // Feature descriptions
    ],

    // Holiday selection page
    '/holidays': [
      'holidays',    // Holiday names and descriptions
      'states',      // German state names
      'months',      // Month names
    ],

    // Bridge weekend calculator
    '/bridge-weekends': [
      'calculator',  // Calculator interface
      'results',     // Results display
      'tooltips',    // Help tooltips
    ],

    // Vacation planner
    '/vacation-plan': [
      'planner',     // Planning interface
      'calendar',    // Calendar component
      'email',       // Email delivery
    ],

    // Export and download
    '/export': [
      'export',      // Export options
      'download',    // Download interface
      'sharing',     // Sharing options
    ],

    // Legal and compliance pages
    '/privacy': ['legal'],
    '/terms': ['legal'],
    '/imprint': ['legal'],
  },

  // Interpolation options for German grammar
  interpolation: {
    escapeValue: false, // React already does escaping
    formatSeparator: ',',

    // Custom formatters for German text
    format: function(value, format, lng) {
      // German number formatting
      if (format === 'number' && lng === 'de') {
        return new Intl.NumberFormat('de-DE').format(value);
      }

      // German date formatting
      if (format === 'date' && lng === 'de') {
        return new Intl.DateTimeFormat('de-DE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(new Date(value));
      }

      // German currency (if needed)
      if (format === 'currency' && lng === 'de') {
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      }

      return value;
    }
  },

  // Loading strategy for optimal performance
  loadStrategy: 'async', // Async loading for better performance

  // Namespace configuration for code splitting
  ns: [
    'common',      // Always loaded
    'navigation',  // Always loaded
    'home',        // Lazy loaded per page
    'holidays',    // Lazy loaded per page
    'calculator',  // Lazy loaded per page
    'planner',     // Lazy loaded per page
    'export',      // Lazy loaded per page
    'legal',       // Lazy loaded per page
    'forms',       // Lazy loaded when needed
    'errors',      // Lazy loaded when needed
    'tooltips',    // Lazy loaded when needed
  ],

  // Default namespace
  defaultNS: 'common',

  // Fallback configuration
  fallbackLng: {
    'de-DE': ['de'],
    'de-AT': ['de'], // Austrian German fallback
    'de-CH': ['de'], // Swiss German fallback
    'en-US': ['en'],
    'en-GB': ['en'],
    'default': ['de'] // Default to German for German market
  },

  // Debug mode (disabled in production)
  debug: !isProd,

  // React-specific options
  react: {
    // Wait for all namespaces to load before rendering
    wait: false,

    // Bind i18n instance to component
    bindI18n: 'languageChanged',
    bindI18nStore: 'added removed',

    // Use Suspense for better loading UX
    useSuspense: true,

    // Namespace separator
    nsSeparator: ':',

    // Key separator
    keySeparator: '.',

    // Interpolation options
    interpolation: {
      escapeValue: false,
    },

    // Trans component defaults
    trans: {
      i18nKey: '', // Default key
      count: undefined,
      defaults: '',
      values: {},
      components: [],
    }
  },

  // Backend configuration for loading translations
  backend: {
    // Load from public folder
    loadPath: '/locales/{{lng}}/{{ns}}.json',

    // Allow cross-origin requests
    crossDomain: true,

    // Request timeout
    requestOptions: {
      cache: isProd ? 'default' : 'no-cache',
    },

    // Custom loading function for optimization
    request: function(options, url, payload, callback) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Accept', 'application/json');

        // Set cache headers for production
        if (isProd) {
          xhr.setRequestHeader('Cache-Control', 'public, max-age=31536000');
        }

        xhr.onload = function() {
          const status = xhr.status;
          const data = xhr.responseText;

          if (status >= 200 && status < 300) {
            callback(null, {
              status: status,
              data: data
            });
          } else {
            callback(new Error(`HTTP ${status}: ${xhr.statusText}`), null);
          }
        };

        xhr.onerror = function() {
          callback(new Error('Network error'), null);
        };

        xhr.send();
      } catch (e) {
        callback(e, null);
      }
    }
  },

  // Detection options for automatic language detection
  detection: {
    // Order of detection methods
    order: [
      'querystring',  // ?lng=de
      'cookie',       // Language cookie
      'localStorage', // Browser storage
      'navigator',    // Browser setting
      'htmlTag',      // HTML lang attribute
    ],

    // Lookup options
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    lookupFromPathIndex: 0,
    lookupFromSubdomainIndex: 0,

    // Cache options
    caches: ['localStorage', 'cookie'],
    excludeCacheFor: ['cimode'], // Don't cache in development

    // Cookie options
    cookieMinutes: 10080, // 1 week
    cookieDomain: isProd ? '.timebutler.de' : 'localhost',
    cookieOptions: {
      path: '/',
      sameSite: 'strict',
      secure: isProd
    }
  },

  // Custom resource loading for bundle optimization
  resources: {
    de: {
      // Core namespaces loaded immediately
      common: require('./public/locales/de/common.json'),
      navigation: require('./public/locales/de/navigation.json'),
    },
    en: {
      // Core namespaces loaded immediately
      common: require('./public/locales/en/common.json'),
      navigation: require('./public/locales/en/navigation.json'),
    }
  },

  // Production optimizations
  ...(isProd && {
    // Disable unnecessary features in production
    saveMissing: false,
    updateMissing: false,
    missingKeyHandler: false,

    // Optimize bundle size
    cleanCode: true,
    parseMissingKeyHandler: false,

    // Cache configuration
    cache: {
      enabled: true,
      prefix: 'timebutler_i18n',
      expirationTime: 7 * 24 * 60 * 60 * 1000, // 1 week
      versions: {
        de: '1.0.0',
        en: '1.0.0'
      }
    }
  }),

  // Development helpers
  ...(!isProd && {
    saveMissing: true,
    updateMissing: true,
    missingKeyHandler: function(lng, ns, key, fallbackValue) {
      console.warn(`Missing translation: ${lng}.${ns}.${key}`);
    }
  })
};

// Log configuration in production
if (isProd) {
  console.log('🌍 i18n optimized for <200KB bundle target');
  console.log('🇩🇪 German primary, English secondary');
  console.log('📦 Namespace-based code splitting enabled');
}