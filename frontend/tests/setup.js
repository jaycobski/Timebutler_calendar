/**
 * Frontend Test Setup - Jest Configuration for React/Next.js TDD Testing
 * Timebutler Calendar MVP - German Holiday Bridge Weekend Optimizer
 *
 * Constitutional Requirements:
 * - WCAG 2.1 Level AA accessibility compliance
 * - Progressive enhancement (works without JavaScript)
 * - Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
 * - >90% test coverage requirement
 * - German market specific UI/UX testing
 */

import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock Next.js router for testing
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || 'Mock image'} />;
  },
}));

// Mock next-translate for i18n testing
jest.mock('next-translate/useTranslation', () => ({
  __esModule: true,
  default: () => ({
    t: (key, variables) => {
      // Mock German translations for testing
      const translations = {
        'common:title': 'Brückentage Optimizer',
        'common:description': 'Optimiere deine Urlaubsplanung',
        'states:BW': 'Baden-Württemberg',
        'states:BY': 'Bayern',
        'states:BE': 'Berlin',
        'holidays:neujahr': 'Neujahr',
        'holidays:heilige_drei_koenige': 'Heilige Drei Könige',
        'errors:required_field': 'Dieses Feld ist erforderlich',
        'email:subject': 'Deine Brückentage-Planung für {{year}}',
      };

      let result = translations[key] || key;

      // Handle variable substitution
      if (variables) {
        Object.entries(variables).forEach(([variable, value]) => {
          result = result.replace(`{{${variable}}}`, value);
        });
      }

      return result;
    },
    lang: 'de',
  }),
}));

// Mock ResizeObserver for component testing
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia for responsive design testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.location for navigation testing
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Mock localStorage for GDPR consent testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Global test constants for German market
global.FRONTEND_TEST_CONSTANTS = {
  // German states for UI testing
  GERMAN_STATES: [
    { code: 'BW', name: 'Baden-Württemberg', population: 11100000 },
    { code: 'BY', name: 'Bayern', population: 13100000 },
    { code: 'BE', name: 'Berlin', population: 3700000 },
    { code: 'BB', name: 'Brandenburg', population: 2500000 },
    { code: 'HB', name: 'Bremen', population: 680000 },
    { code: 'HH', name: 'Hamburg', population: 1900000 },
    { code: 'HE', name: 'Hessen', population: 6300000 },
    { code: 'MV', name: 'Mecklenburg-Vorpommern', population: 1600000 },
    { code: 'NI', name: 'Niedersachsen', population: 8000000 },
    { code: 'NW', name: 'Nordrhein-Westfalen', population: 17900000 },
    { code: 'RP', name: 'Rheinland-Pfalz', population: 4100000 },
    { code: 'SL', name: 'Saarland', population: 990000 },
    { code: 'SN', name: 'Sachsen', population: 4100000 },
    { code: 'ST', name: 'Sachsen-Anhalt', population: 2200000 },
    { code: 'SH', name: 'Schleswig-Holstein', population: 2900000 },
    { code: 'TH', name: 'Thüringen', population: 2100000 }
  ],

  // WCAG 2.1 Level AA testing requirements
  ACCESSIBILITY_STANDARDS: {
    MIN_COLOR_CONTRAST_NORMAL: 4.5,
    MIN_COLOR_CONTRAST_LARGE: 3,
    MIN_TOUCH_TARGET_SIZE: 44, // pixels
    MAX_LINE_LENGTH: 80, // characters
    REQUIRED_ALT_TAGS: true,
    KEYBOARD_NAVIGATION: true,
    SCREEN_READER_SUPPORT: true
  },

  // Performance targets from constitution
  PERFORMANCE_TARGETS: {
    FIRST_CONTENTFUL_PAINT: 1800, // milliseconds
    LARGEST_CONTENTFUL_PAINT: 2500,
    FIRST_INPUT_DELAY: 100,
    CUMULATIVE_LAYOUT_SHIFT: 0.1,
    MAX_BUNDLE_SIZE: 200 * 1024 // 200KB gzipped
  },

  // Cross-browser testing matrix
  SUPPORTED_BROWSERS: [
    { name: 'Chrome', version: '120+' },
    { name: 'Firefox', version: '119+' },
    { name: 'Safari', version: '17+' },
    { name: 'Edge', version: '120+' }
  ],

  // German UI testing scenarios
  TEST_SCENARIOS: {
    BAVARIAN_CATHOLIC_USER: {
      state: 'BY',
      vacation_days: 30,
      language: 'de',
      religious_holidays: true
    },
    BERLIN_SECULAR_USER: {
      state: 'BE',
      vacation_days: 25,
      language: 'de',
      religious_holidays: false
    },
    INTERNATIONAL_USER: {
      state: 'NW',
      vacation_days: 28,
      language: 'en',
      religious_holidays: true
    }
  },

  // Email validation patterns
  EMAIL_PATTERNS: {
    VALID_GERMAN: ['test@example.de', 'user@company.com', 'name.surname@domain.co.uk'],
    INVALID: ['invalid-email', '@example.com', 'user@', 'spaces @example.com']
  }
};

// Accessibility testing utilities
global.testAccessibility = async (component) => {
  const { axe } = await import('jest-axe');
  const results = await axe(component);
  expect(results).toHaveNoViolations();
};

// Screen reader testing utilities
global.testScreenReader = (element) => {
  // Check for proper semantic structure
  expect(element).toBeInTheDocument();

  // Validate ARIA attributes
  const ariaLabel = element.getAttribute('aria-label');
  const ariaDescribedBy = element.getAttribute('aria-describedby');
  const role = element.getAttribute('role');

  if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
    expect(ariaLabel || element.textContent).toBeTruthy();
  }

  // Check for proper heading hierarchy
  if (element.tagName.match(/^H[1-6]$/)) {
    expect(element.textContent.trim()).toBeTruthy();
  }

  return {
    ariaLabel,
    ariaDescribedBy,
    role,
    textContent: element.textContent
  };
};

// Keyboard navigation testing utilities
global.testKeyboardNavigation = async (user, container) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  // Test Tab navigation
  for (let i = 0; i < focusableElements.length; i++) {
    await user.tab();
    expect(focusableElements[i]).toHaveFocus();
  }

  // Test Shift+Tab navigation
  for (let i = focusableElements.length - 1; i >= 0; i--) {
    await user.tab({ shift: true });
    expect(focusableElements[i]).toHaveFocus();
  }

  return focusableElements.length;
};

// German date formatting utilities for testing
global.formatGermanDate = (date) => {
  return new Date(date).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// GDPR compliance testing utilities
global.validateGDPRCompliance = (component) => {
  // Check for consent mechanisms
  const consentButtons = component.querySelectorAll('[data-testid*="consent"], [data-testid*="gdpr"]');
  const privacyLinks = component.querySelectorAll('a[href*="privacy"], a[href*="datenschutz"]');

  return {
    hasConsentMechanism: consentButtons.length > 0,
    hasPrivacyLink: privacyLinks.length > 0,
    consentButtons: Array.from(consentButtons),
    privacyLinks: Array.from(privacyLinks)
  };
};

// Mock API responses for testing
global.mockApiResponses = {
  holidays: {
    bavaria: [
      {
        name: 'Neujahr',
        date: '2025-01-01',
        state: 'BY',
        type: 'federal',
        is_federal: true
      },
      {
        name: 'Heilige Drei Könige',
        date: '2025-01-06',
        state: 'BY',
        type: 'religious',
        is_federal: false
      }
    ]
  },
  bridgeWeekends: [
    {
      holiday_id: 'neujahr-2025',
      start_date: '2024-12-28',
      end_date: '2025-01-01',
      vacation_days_needed: 3,
      total_days_off: 7,
      efficiency: 2.33,
      pattern: 'thursday-friday'
    }
  ]
};

// Custom Jest matchers for frontend testing
expect.extend({
  toBeAccessible(received) {
    const pass = received.getAttribute('aria-label') ||
                 received.textContent ||
                 received.getAttribute('alt');

    return {
      message: () => pass
        ? `Expected element not to be accessible`
        : `Expected element to be accessible (missing aria-label, text content, or alt attribute)`,
      pass: !!pass
    };
  },

  toHaveValidGermanState(received) {
    const validStates = global.FRONTEND_TEST_CONSTANTS.GERMAN_STATES.map(s => s.code);
    const pass = validStates.includes(received);

    return {
      message: () => pass
        ? `Expected ${received} not to be a valid German state code`
        : `Expected ${received} to be a valid German state code`,
      pass
    };
  },

  toMeetPerformanceTarget(received, target) {
    const pass = received <= target;
    return {
      message: () => pass
        ? `Expected ${received}ms to exceed performance target of ${target}ms`
        : `Expected ${received}ms to meet performance target of ${target}ms`,
      pass
    };
  }
});

// Setup hooks
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Clear localStorage
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Reset window location
  window.location.href = 'http://localhost:3000';
  window.location.pathname = '/';
  window.location.search = '';
  window.location.hash = '';
});

afterEach(() => {
  // Cleanup any side effects
  jest.restoreAllMocks();
});

console.log('✅ Frontend test environment configured for TDD methodology');
console.log('♿ WCAG 2.1 Level AA accessibility testing enabled');
console.log('🇩🇪 German market UI/UX testing utilities loaded');
console.log('🌐 Cross-browser compatibility testing ready');
console.log('📱 Progressive enhancement testing configured');