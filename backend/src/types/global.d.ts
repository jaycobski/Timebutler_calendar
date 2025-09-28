// Global type definitions for Timebutler Calendar Backend
// Constitutional performance and German market requirements

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      DATABASE_URL: string;
      REDIS_URL: string;
      RESEND_API_KEY: string;
      GERMAN_HOLIDAY_API_KEY: string;
      DEFAULT_LOCALE: 'de' | 'en';
      SUPPORTED_LOCALES: string;
      EMAIL_FROM: string;
      EMAIL_REPLY_TO: string;
      CORS_ORIGINS: string;
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;
    }
  }

  // German Federal State System
  type GermanState =
    | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
    | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

  type Locale = 'de' | 'en';

  // Holiday Type Classifications for German Market
  type HolidayType =
    | 'federal' // Bundesweite Feiertage
    | 'state' // Landesfeiertage
    | 'regional' // Regionale Feiertage
    | 'religious'; // Konfessionelle Feiertage

  // German Timezone with DST transitions
  type GermanTimeZone = 'Europe/Berlin';

  // Constitutional Performance Requirements
  interface PerformanceTargets {
    maxLoadTime: 2000; // 2 seconds on 3G
    maxResponseTime: 100; // 100ms for API responses
    maxEmailDelivery: 5000; // 5 seconds for email delivery
    maxConcurrentUsers: 25000; // 25k concurrent users
  }

  // Bridge Weekend Calculation Types
  interface BridgeWeekendPattern {
    type: 'thursday-friday' | 'monday-tuesday' | 'sandwich';
    vacationDays: number;
    totalDaysOff: number;
    efficiency: number;
  }

  // GDPR Compliance Types for German/EU Requirements
  interface GDPRCompliance {
    consentGiven: boolean;
    dataRetentionDays: number; // 90 days per constitution
    rightToErasure: boolean;
    dataMinimization: boolean;
  }

  // Email Template Types for Bilingual Support
  interface BilingualEmailTemplate {
    subject: Record<Locale, string>;
    content: Record<Locale, string>;
    locale: Locale;
  }

  // Cache Configuration for Constitutional Performance
  interface CacheConfig {
    holidayDataTTL: number; // 30 days as per constitution
    bridgeCalculationTTL: number;
    staticAssetsTTL: number;
  }
}

export {};