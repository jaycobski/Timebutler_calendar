// Global type definitions for Timebutler Calendar MVP
// Constitutional performance and German market requirements

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_APP_NAME: string;
      NEXT_PUBLIC_DEFAULT_LOCALE: 'de' | 'en';
      NEXT_PUBLIC_SUPPORTED_LOCALES: string;
    }
  }

  // German Holiday System Types
  type GermanState =
    | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
    | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

  type Locale = 'de' | 'en';

  // Performance monitoring types for constitutional requirements
  interface PerformanceMetrics {
    loadTime: number; // Must be <2s on 3G
    bundleSize: number; // Must be <200KB gzipped
    interactionTime: number; // Must be <100ms
  }

  // Bridge Weekend Efficiency Calculation
  interface BridgeWeekendEfficiency {
    totalDaysOff: number;
    vacationDaysRequired: number;
    efficiency: number; // totalDaysOff / vacationDaysRequired
  }

  // German Timezone Support (CET/CEST transitions)
  type GermanTimeZone = 'Europe/Berlin';

  // Accessibility compliance for WCAG 2.1 Level AA
  interface A11yCompliance {
    screenReaderSupport: boolean;
    keyboardNavigation: boolean;
    colorContrast: boolean;
    focusManagement: boolean;
  }
}

export {};