/**
 * Environment Setup for Frontend Testing
 * Configures test environment variables and global settings
 */

// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_APP_ENV = 'test';

// API endpoints for testing
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_API_VERSION = 'v1';

// Mock external service URLs
process.env.NEXT_PUBLIC_RESEND_PUBLIC_KEY = 'test_public_key';
process.env.NEXT_PUBLIC_SENTRY_DSN = '';
process.env.NEXT_PUBLIC_ANALYTICS_ID = '';

// German market configuration
process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE = 'de';
process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES = 'de,en';
process.env.NEXT_PUBLIC_DEFAULT_STATE = 'BY'; // Bavaria as default
process.env.NEXT_PUBLIC_TIMEZONE = 'Europe/Berlin';

// GDPR compliance settings
process.env.NEXT_PUBLIC_PRIVACY_POLICY_VERSION = '1.0';
process.env.NEXT_PUBLIC_COOKIE_CONSENT_VERSION = '1.0';

// Performance testing configuration
process.env.NEXT_PUBLIC_BUNDLE_ANALYZER = 'false';
process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING = 'false';

// Feature flags for testing
process.env.NEXT_PUBLIC_FEATURE_HOLIDAY_REMINDERS = 'true';
process.env.NEXT_PUBLIC_FEATURE_CALENDAR_SYNC = 'true';
process.env.NEXT_PUBLIC_FEATURE_SOCIAL_SHARING = 'false';

console.log('🔧 Frontend test environment variables configured');