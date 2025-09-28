/**
 * Comprehensive Middleware Module Index
 *
 * Exports all middleware components for the Timebutler Calendar backend.
 * Provides security, performance optimization, and German/EU compliance features.
 * Constitutional compliance: <100ms response times, 25k concurrent users
 */

// Performance optimization middleware exports
export { default as performanceMonitoring } from './performance.js';
export { default as caching } from './caching.js';
export { default as constitutionalCompliance } from './constitutional-compliance.js';

export {
  PerformanceMonitor,
  PerformanceMetrics,
  PerformanceStats
} from './performance.js';

export {
  CacheManager,
  CacheConfig,
  CacheEntry,
  CacheStats
} from './caching.js';

export {
  ConstitutionalValidator,
  ConstitutionalRequirements,
  ComplianceViolation,
  ComplianceMetrics
} from './constitutional-compliance.js';

// Main security middleware exports
export {
  registerSecurityMiddleware,
  createSecurityConfig,
  handleCORS,
  setSecurityHeaders,
  validateRequest,
  rateLimitingHook,
  responseCleanup
} from './security.js';

// Rate limiting middleware exports
export {
  registerRateLimiting,
  createEmailRateLimit,
  createExportRateLimit,
  createCalculationRateLimit,
  createDataRateLimit,
  createGeneralRateLimit,
  getRateLimitMetrics,
  clearViolationHistory,
  rateLimitHealthCheck,
  RATE_LIMIT_CONFIGS,
  isGermanIP,
  getEndpointCategory
} from './rateLimiting.js';

// Logging middleware exports
export {
  registerLoggingMiddleware,
  createLoggingConfig,
  logRequestStart,
  logResponseComplete,
  logEmailDelivery,
  addRequestTiming,
  getTrafficMetrics,
  loggingHealthCheck,
  DEFAULT_LOGGING_CONFIG
} from './logging.js';

// Type definitions
export type {
  SecurityConfig,
  CORSConfig,
  HSTSConfig,
  CSPConfig,
  SecurityHeadersConfig,
  GDPRComplianceConfig,
  PerformanceConfig,
  RateLimitContext,
  SecurityViolation,
  GDPRConsentStatus,
  ClientSecurityContext,
  SecurityMetrics,
  SecurityAuditLog,
  GermanComplianceFeatures,
  SecurityConfigurationOptions
} from './types.js';

// Rate limiting type definitions
export type {
  RateLimitViolation,
  RateLimitMetrics
} from './rateLimiting.js';

// Logging type definitions
export type {
  RequestLogEntry,
  ResponseLogEntry,
  EmailDeliveryLogEntry,
  PerformanceMetrics,
  TrafficMetrics,
  LoggingConfig,
  LoggingContext
} from './logging.js';

// Re-export for convenience
export { createSecurityConfig as createDefaultSecurityConfig } from './security.js';