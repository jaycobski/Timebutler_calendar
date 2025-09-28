import envSchema from 'env-schema';

/**
 * Environment variable validation schema
 * Ensures all required configuration is present and valid
 */
const schema = {
  type: 'object',
  required: [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'REDIS_URL',
    'RESEND_API_KEY',
    'FROM_EMAIL',
    'JWT_SECRET'
  ],
  properties: {
    // Node Environment
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'test', 'staging', 'production'],
      default: 'development'
    },
    PORT: {
      type: 'integer',
      minimum: 1,
      maximum: 65535,
      default: 3001
    },

    // Database Configuration
    DATABASE_URL: {
      type: 'string',
      format: 'uri'
    },
    POSTGRES_HOST: {
      type: 'string',
      default: 'localhost'
    },
    POSTGRES_PORT: {
      type: 'integer',
      minimum: 1,
      maximum: 65535,
      default: 5432
    },
    POSTGRES_DB: {
      type: 'string',
      default: 'timebutler_calendar'
    },
    POSTGRES_USER: {
      type: 'string'
    },
    POSTGRES_PASSWORD: {
      type: 'string'
    },

    // Redis Configuration
    REDIS_URL: {
      type: 'string',
      format: 'uri'
    },
    REDIS_HOST: {
      type: 'string',
      default: 'localhost'
    },
    REDIS_PORT: {
      type: 'integer',
      minimum: 1,
      maximum: 65535,
      default: 6379
    },
    REDIS_PASSWORD: {
      type: 'string',
      default: ''
    },
    REDIS_DB: {
      type: 'integer',
      minimum: 0,
      maximum: 15,
      default: 0
    },

    // Email Service
    RESEND_API_KEY: {
      type: 'string',
      pattern: '^re_[a-zA-Z0-9]{32,}$'
    },
    FROM_EMAIL: {
      type: 'string',
      format: 'email'
    },
    FROM_NAME: {
      type: 'string',
      default: 'TimeButler Calendar'
    },

    // German Holiday API
    GERMAN_HOLIDAY_API_KEY: {
      type: 'string'
    },
    GERMAN_HOLIDAY_API_URL: {
      type: 'string',
      format: 'uri',
      default: 'https://feiertage-api.de/api'
    },

    // Security
    JWT_SECRET: {
      type: 'string',
      minLength: 32
    },
    RATE_LIMIT_MAX: {
      type: 'integer',
      minimum: 1,
      default: 1000
    },
    RATE_LIMIT_WINDOW_MS: {
      type: 'integer',
      minimum: 1000,
      default: 900000 // 15 minutes
    },
    CORS_ORIGIN: {
      type: 'string',
      default: 'http://localhost:3000'
    },

    // Monitoring & Logging
    LOG_LEVEL: {
      type: 'string',
      enum: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
      default: 'info'
    },
    METRICS_ENABLED: {
      type: 'boolean',
      default: true
    },
    SENTRY_DSN: {
      type: 'string',
      format: 'uri'
    },
    SENTRY_ENVIRONMENT: {
      type: 'string',
      default: 'development'
    },

    // Cache TTL Configuration (in seconds)
    CACHE_TTL_HOLIDAYS: {
      type: 'integer',
      minimum: 300, // 5 minutes minimum
      default: 2592000 // 30 days
    },
    CACHE_TTL_BRIDGES: {
      type: 'integer',
      minimum: 60,
      default: 86400 // 1 day
    },
    CACHE_TTL_EXPORTS: {
      type: 'integer',
      minimum: 60,
      default: 1800 // 30 minutes
    },

    // Performance Settings
    MAX_PAYLOAD_SIZE: {
      type: 'integer',
      minimum: 1024,
      default: 1048576 // 1MB
    },
    BODY_LIMIT: {
      type: 'integer',
      minimum: 1024,
      default: 1048576 // 1MB
    },
    CONNECTION_TIMEOUT: {
      type: 'integer',
      minimum: 1000,
      default: 30000 // 30s
    },
    KEEP_ALIVE_TIMEOUT: {
      type: 'integer',
      minimum: 1000,
      default: 5000 // 5s
    },

    // Email Template Configuration
    EMAIL_TEMPLATE_CACHE_TTL: {
      type: 'integer',
      minimum: 60,
      default: 3600 // 1 hour
    },
    CALENDAR_EXPORT_TTL: {
      type: 'integer',
      minimum: 300,
      default: 2592000 // 30 days
    },

    // GDPR Compliance
    DATA_RETENTION_DAYS: {
      type: 'integer',
      minimum: 1,
      maximum: 365,
      default: 90
    },
    COOKIE_SECURE: {
      type: 'boolean',
      default: false
    },
    COOKIE_SAME_SITE: {
      type: 'string',
      enum: ['strict', 'lax', 'none'],
      default: 'lax'
    },

    // Development Flags
    BUNDLE_ANALYZE: {
      type: 'boolean',
      default: false
    },
    DEBUG_MODE: {
      type: 'boolean',
      default: false
    },
    MOCK_EMAIL_SERVICE: {
      type: 'boolean',
      default: false
    },
    DISABLE_RATE_LIMITING: {
      type: 'boolean',
      default: false
    },

    // Clustering (for production)
    CLUSTER_WORKERS: {
      type: 'integer',
      minimum: 0,
      default: 0 // 0 means use CPU count
    }
  },
  additionalProperties: false
};

/**
 * Validated environment configuration
 */
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'test' | 'staging' | 'production';
  PORT: number;

  // Database
  DATABASE_URL: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER?: string;
  POSTGRES_PASSWORD?: string;

  // Redis
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_DB: number;

  // Email
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  FROM_NAME: string;

  // German Holiday API
  GERMAN_HOLIDAY_API_KEY?: string;
  GERMAN_HOLIDAY_API_URL: string;

  // Security
  JWT_SECRET: string;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_MS: number;
  CORS_ORIGIN: string;

  // Monitoring
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  METRICS_ENABLED: boolean;
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT: string;

  // Cache TTL
  CACHE_TTL_HOLIDAYS: number;
  CACHE_TTL_BRIDGES: number;
  CACHE_TTL_EXPORTS: number;

  // Performance
  MAX_PAYLOAD_SIZE: number;
  BODY_LIMIT: number;
  CONNECTION_TIMEOUT: number;
  KEEP_ALIVE_TIMEOUT: number;

  // Email templates
  EMAIL_TEMPLATE_CACHE_TTL: number;
  CALENDAR_EXPORT_TTL: number;

  // GDPR
  DATA_RETENTION_DAYS: number;
  COOKIE_SECURE: boolean;
  COOKIE_SAME_SITE: 'strict' | 'lax' | 'none';

  // Development
  BUNDLE_ANALYZE: boolean;
  DEBUG_MODE: boolean;
  MOCK_EMAIL_SERVICE: boolean;
  DISABLE_RATE_LIMITING: boolean;
  CLUSTER_WORKERS: number;
}

let cachedEnv: EnvironmentConfig | null = null;

/**
 * Get validated environment configuration
 * Cached for performance
 */
export const getEnvConfig = (): EnvironmentConfig => {
  if (cachedEnv === null) {
    cachedEnv = envSchema({ schema, dotenv: true }) as EnvironmentConfig;
  }
  return cachedEnv;
};

// Export for convenience
export { getEnvConfig as envSchema };

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
  return getEnvConfig().NODE_ENV === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return getEnvConfig().NODE_ENV === 'development';
};

/**
 * Check if running in test
 */
export const isTest = (): boolean => {
  return getEnvConfig().NODE_ENV === 'test';
};