/**
 * next-translate Configuration
 * Bilingual support for German (formal) and English (casual)
 */

module.exports = {
  locales: ['de', 'en'],
  defaultLocale: 'de',

  pages: {
    '*': ['common', 'app', 'navigation', 'accessibility', 'branding', 'footer'],
    '/': ['landing', 'states', 'holidays', 'vacation', 'bridgeWeekends', 'form', 'tips'],
    '/planner': ['vacation-planner', 'states', 'holidays', 'bridgeWeekends', 'form', 'email', 'gdpr'],
    '/calendar': ['calendar', 'holidays', 'states'],
    '/about': ['about', 'timeTracking', 'branding'],
    '/privacy': ['gdpr', 'legal'],
    '/imprint': ['legal', 'footer'],
  },

  loadLocaleFrom: (lang, ns) => {
    // Support both new structure in i18n/ and fallback to src/i18n/
    try {
      return import(`./src/i18n/${lang}.json`).then((m) => {
        // Extract the namespace from the large JSON file
        const data = m.default || m;

        // Map namespaces to sections in our JSON structure
        const nsMapping = {
          'common': ['common', 'loading', 'errors', 'success'],
          'app': ['app'],
          'navigation': ['navigation'],
          'accessibility': ['accessibility'],
          'branding': ['branding', 'timeTracking'],
          'footer': ['footer', 'legal'],
          'landing': ['app', 'branding', 'tips'],
          'states': ['states'],
          'holidays': ['holidays'],
          'vacation': ['vacation'],
          'bridgeWeekends': ['bridgeWeekends'],
          'form': ['form'],
          'tips': ['tips'],
          'vacation-planner': ['vacation', 'bridgeWeekends', 'calendar'],
          'calendar': ['calendar'],
          'email': ['email'],
          'gdpr': ['gdpr'],
          'about': ['branding', 'timeTracking'],
          'legal': ['legal', 'gdpr']
        };

        // Extract relevant sections for this namespace
        const sections = nsMapping[ns] || [ns];
        let result = {};

        sections.forEach(section => {
          if (data[section]) {
            result = { ...result, ...data[section] };
          }
        });

        // If no mapping found, try to get the section directly
        if (Object.keys(result).length === 0 && data[ns]) {
          result = data[ns];
        }

        return result;
      });
    } catch (error) {
      console.warn(`Could not load translations for ${lang}/${ns}:`, error);
      return Promise.resolve({});
    }
  },

  // Interpolation settings
  interpolation: {
    prefix: '{',
    suffix: '}',
    escapeValue: false,
  },

  // Key separator for nested translations
  keySeparator: '.',
  nsSeparator: ':',

  // Default namespace
  defaultNS: 'common',

  // Logging
  logger: process.env.NODE_ENV === 'development',
};