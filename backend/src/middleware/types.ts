/**
 * TypeScript type definitions for security middleware
 * Supporting German/EU compliance and GDPR requirements
 */

export interface CORSConfig {
  /** Allowed origins for CORS requests */
  origin: string[] | string | boolean;
  /** Allow credentials in CORS requests */
  credentials: boolean;
  /** Allowed HTTP methods */
  methods: string[];
  /** Allowed request headers */
  allowedHeaders: string[];
  /** Headers exposed to the client */
  exposedHeaders?: string[];
  /** Preflight cache duration in seconds */
  maxAge?: number;
}

export interface HSTSConfig {
  /** Enable HSTS header */
  enabled: boolean;
  /** Max age in seconds */
  maxAge: number;
  /** Include subdomains */
  includeSubDomains: boolean;
  /** Enable preload directive */
  preload: boolean;
}

export interface CSPConfig {
  /** Enable Content Security Policy */
  enabled: boolean;
  /** CSP directives */
  directives: Record<string, string[]>;
  /** Use report-only mode */
  reportOnly: boolean;
}

export interface SecurityHeadersConfig {
  /** HSTS configuration */
  hsts: HSTSConfig;
  /** Content Security Policy configuration */
  csp: CSPConfig;
  /** X-Frame-Options setting */
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  /** Enable X-Content-Type-Options: nosniff */
  contentTypeOptions: boolean;
  /** Enable X-XSS-Protection */
  xssProtection: boolean;
  /** Referrer-Policy setting */
  referrerPolicy: string;
}

export interface GDPRComplianceConfig {
  /** Add GDPR compliance headers */
  gdprHeaders: boolean;
  /** Support German language preferences */
  germanLanguageSupport: boolean;
  /** EU cookie compliance features */
  euCookieCompliance: boolean;
  /** Enforce data minimization principles */
  dataMinimization: boolean;
}

export interface PerformanceConfig {
  /** Include X-Response-Time header */
  responseTimeHeader: boolean;
  /** Include X-Request-ID header */
  requestIdHeader: boolean;
  /** Enable compression support */
  compressionSupport: boolean;
}

export interface RateLimitContext {
  /** Client identifier for rate limiting */
  identifier: string;
  /** Endpoint category */
  endpoint: string;
  /** Request timestamp */
  timestamp: number;
}

export interface SecurityViolation {
  /** Violation type */
  type: 'cors' | 'csp' | 'rate-limit' | 'gdpr' | 'validation';
  /** Violation severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Violation description */
  message: string;
  /** Client IP address */
  clientIp: string;
  /** Request URL */
  url: string;
  /** User agent */
  userAgent?: string;
  /** Timestamp */
  timestamp: Date;
}

export interface GDPRConsentStatus {
  /** Consent given */
  accepted: boolean;
  /** Consent timestamp */
  timestamp?: Date;
  /** Consent scope */
  scope?: string[];
  /** Consent version */
  version?: string;
}

export interface ClientSecurityContext {
  /** Client IP address */
  ip: string;
  /** User agent string */
  userAgent: string;
  /** Request origin */
  origin?: string;
  /** GDPR consent status */
  gdprConsent?: GDPRConsentStatus;
  /** Rate limiting context */
  rateLimit?: RateLimitContext;
  /** Security flags */
  flags: {
    /** Suspicious activity detected */
    suspicious: boolean;
    /** Bot detected */
    bot: boolean;
    /** VPN/Proxy detected */
    proxy: boolean;
  };
}

export interface SecurityMetrics {
  /** Total requests processed */
  totalRequests: number;
  /** Blocked requests */
  blockedRequests: number;
  /** CORS preflight requests */
  preflightRequests: number;
  /** GDPR consent violations */
  gdprViolations: number;
  /** Rate limit violations */
  rateLimitViolations: number;
  /** CSP violations */
  cspViolations: number;
  /** Average response time */
  averageResponseTime: number;
  /** Metrics timestamp */
  timestamp: Date;
}

export interface SecurityAuditLog {
  /** Log entry ID */
  id: string;
  /** Log type */
  type: 'access' | 'violation' | 'error' | 'admin';
  /** Severity level */
  severity: 'info' | 'warn' | 'error' | 'critical';
  /** Log message */
  message: string;
  /** Client context */
  client: ClientSecurityContext;
  /** Request details */
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  /** Response details */
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    responseTime: number;
  };
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Timestamp */
  timestamp: Date;
}

export interface GermanComplianceFeatures {
  /** Telemediengesetz (TMG) compliance */
  tmgCompliant: boolean;
  /** Bundesdatenschutzgesetz (BDSG) compliance */
  bdsgCompliant: boolean;
  /** Support for German legal requirements */
  germanLegalRequirements: {
    /** Impressum requirement */
    impressum: boolean;
    /** Privacy policy requirement */
    datenschutz: boolean;
    /** Cookie consent requirement */
    cookieConsent: boolean;
    /** Data retention limits */
    retentionLimits: boolean;
  };
  /** German language support */
  languageSupport: {
    /** Formal German addressing */
    formalAddressing: boolean;
    /** Legal terminology */
    legalTerminology: boolean;
    /** Error messages in German */
    germanErrors: boolean;
  };
}

export interface SecurityConfigurationOptions {
  /** Environment type */
  environment: 'development' | 'production' | 'test';
  /** CORS configuration */
  cors: CORSConfig;
  /** Security headers configuration */
  headers: SecurityHeadersConfig;
  /** GDPR compliance configuration */
  compliance: GDPRComplianceConfig;
  /** Performance configuration */
  performance: PerformanceConfig;
  /** German compliance features */
  germanCompliance?: GermanComplianceFeatures;
  /** Custom security policies */
  customPolicies?: Record<string, any>;
}

// Augment Fastify types for security context
declare module 'fastify' {
  interface FastifyRequest {
    /** Security context */
    security?: ClientSecurityContext;
    /** Rate limiting context */
    rateLimit?: RateLimitContext;
    /** Start time for performance measurement */
    startTime?: number;
  }

  interface FastifyReply {
    /** Security headers applied */
    securityHeaders?: string[];
    /** GDPR compliance status */
    gdprCompliant?: boolean;
  }
}

// Logging-related type definitions (imported from logging.ts)
export type {
  RequestLogEntry,
  ResponseLogEntry,
  EmailDeliveryLogEntry,
  PerformanceMetrics,
  TrafficMetrics,
  LoggingConfig,
  LoggingContext
} from './logging.js';

// Export all types
export type {
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
};