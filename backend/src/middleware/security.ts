import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { IncomingMessage, ServerResponse } from 'http';

/**
 * Security Middleware for Timebutler Calendar
 *
 * Provides comprehensive security headers, CORS configuration, and German/EU compliance
 * features for production deployment in the German market.
 *
 * Features:
 * - CORS with German frontend domain support
 * - Security headers (HSTS, CSP, X-Frame-Options, etc.)
 * - GDPR-compliant privacy protection
 * - Rate limiting integration points
 * - Request validation hooks
 * - Performance optimization for 25k concurrent users
 */

export interface SecurityConfig {
  // CORS Configuration
  cors: {
    origin: string[] | string | boolean;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders?: string[];
    maxAge?: number;
  };

  // Security Headers
  headers: {
    hsts: {
      enabled: boolean;
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
    csp: {
      enabled: boolean;
      directives: Record<string, string[]>;
      reportOnly: boolean;
    };
    frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    contentTypeOptions: boolean;
    xssProtection: boolean;
    referrerPolicy: string;
  };

  // German/EU Compliance
  compliance: {
    gdprHeaders: boolean;
    germanLanguageSupport: boolean;
    euCookieCompliance: boolean;
    dataMinimization: boolean;
  };

  // Performance & Monitoring
  performance: {
    responseTimeHeader: boolean;
    requestIdHeader: boolean;
    compressionSupport: boolean;
  };

  // Development vs Production
  environment: 'development' | 'production' | 'test';
}

/**
 * Default security configuration optimized for German market deployment
 */
export const createSecurityConfig = (environment: string = 'production'): SecurityConfig => {
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  return {
    cors: {
      origin: isDevelopment
        ? ['http://localhost:3000', 'http://localhost:3001']
        : [
            'https://timebutler-calendar.de',
            'https://www.timebutler-calendar.de',
            'https://calendar.timebutler.de',
            'https://timebutler.de'
          ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Request-ID',
        'X-Language',
        'X-GDPR-Consent'
      ],
      exposedHeaders: [
        'X-Response-Time',
        'X-Request-ID',
        'X-Rate-Limit-Remaining',
        'X-GDPR-Status'
      ],
      maxAge: isProduction ? 86400 : 3600 // 24h in production, 1h in dev
    },

    headers: {
      hsts: {
        enabled: isProduction,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      csp: {
        enabled: true,
        reportOnly: isDevelopment,
        directives: {
          'default-src': ["'self'"],
          'script-src': isDevelopment
            ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:*']
            : ["'self'", "'strict-dynamic'"],
          'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
          'font-src': ["'self'", 'fonts.gstatic.com'],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': isDevelopment
            ? ["'self'", 'localhost:*', 'ws:', 'wss:']
            : ["'self'", 'api.timebutler.de', '*.timebutler.de'],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': isDevelopment ? ["'self'"] : ["'none'"],
          'upgrade-insecure-requests': isProduction ? [] : undefined
        }
      },
      frameOptions: isDevelopment ? 'SAMEORIGIN' : 'DENY',
      contentTypeOptions: true,
      xssProtection: true,
      referrerPolicy: 'strict-origin-when-cross-origin'
    },

    compliance: {
      gdprHeaders: true,
      germanLanguageSupport: true,
      euCookieCompliance: true,
      dataMinimization: true
    },

    performance: {
      responseTimeHeader: true,
      requestIdHeader: true,
      compressionSupport: true
    },

    environment: environment as SecurityConfig['environment']
  };
};

/**
 * CORS Handler for preflight requests and cross-origin requests
 */
export const handleCORS = (config: SecurityConfig) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const origin = request.headers.origin;
    const { cors } = config;

    // Determine if origin is allowed
    let allowedOrigin: string | boolean = false;

    if (cors.origin === true) {
      allowedOrigin = origin || '*';
    } else if (typeof cors.origin === 'string') {
      allowedOrigin = cors.origin;
    } else if (Array.isArray(cors.origin)) {
      allowedOrigin = cors.origin.includes(origin || '') ? origin || false : false;
    }

    // Set CORS headers
    if (allowedOrigin) {
      reply.header('Access-Control-Allow-Origin', allowedOrigin);
    }

    if (cors.credentials) {
      reply.header('Access-Control-Allow-Credentials', 'true');
    }

    reply.header('Access-Control-Allow-Methods', cors.methods.join(', '));
    reply.header('Access-Control-Allow-Headers', cors.allowedHeaders.join(', '));

    if (cors.exposedHeaders) {
      reply.header('Access-Control-Expose-Headers', cors.exposedHeaders.join(', '));
    }

    if (cors.maxAge) {
      reply.header('Access-Control-Max-Age', cors.maxAge.toString());
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      reply.status(204);
      return '';
    }
  };
};

/**
 * Security Headers Middleware
 */
export const setSecurityHeaders = (config: SecurityConfig) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { headers, compliance, performance } = config;

    // HSTS Header (only over HTTPS in production)
    if (headers.hsts.enabled && (request.protocol === 'https' || config.environment !== 'production')) {
      let hstsValue = `max-age=${headers.hsts.maxAge}`;
      if (headers.hsts.includeSubDomains) hstsValue += '; includeSubDomains';
      if (headers.hsts.preload) hstsValue += '; preload';
      reply.header('Strict-Transport-Security', hstsValue);
    }

    // Content Security Policy
    if (headers.csp.enabled) {
      const cspDirectives = Object.entries(headers.csp.directives)
        .filter(([, values]) => values !== undefined)
        .map(([directive, values]) => `${directive} ${values.join(' ')}`)
        .join('; ');

      const cspHeader = headers.csp.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';

      reply.header(cspHeader, cspDirectives);
    }

    // X-Frame-Options
    reply.header('X-Frame-Options', headers.frameOptions);

    // X-Content-Type-Options
    if (headers.contentTypeOptions) {
      reply.header('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection (legacy but still useful)
    if (headers.xssProtection) {
      reply.header('X-XSS-Protection', '1; mode=block');
    }

    // Referrer Policy
    reply.header('Referrer-Policy', headers.referrerPolicy);

    // GDPR Compliance Headers
    if (compliance.gdprHeaders) {
      reply.header('X-GDPR-Compliant', 'true');
      reply.header('X-Data-Retention', '90-days');
      reply.header('X-Privacy-Policy', 'https://timebutler.de/privacy');
    }

    // German Language Support Indicator
    if (compliance.germanLanguageSupport) {
      reply.header('X-Supported-Languages', 'de,en');
      reply.header('X-Default-Language', 'de');
    }

    // Performance Headers
    if (performance.requestIdHeader) {
      reply.header('X-Request-ID', request.id);
    }

    // Remove potentially sensitive headers
    reply.removeHeader('X-Powered-By');
    reply.removeHeader('Server');

    // Custom TimeButler identification
    reply.header('X-Service', 'TimeButler-Calendar');
    reply.header('X-Version', '1.0.0');
  };
};

/**
 * Request Validation Middleware
 * Validates common security requirements for incoming requests
 */
export const validateRequest = (config: SecurityConfig) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Content-Length validation to prevent DoS
    const contentLength = parseInt(request.headers['content-length'] || '0');
    const maxBodySize = 10 * 1024 * 1024; // 10MB max

    if (contentLength > maxBodySize) {
      reply.status(413).send({
        error: {
          message: 'Request entity too large',
          statusCode: 413,
          maxSize: '10MB'
        }
      });
      return;
    }

    // Host header validation (prevent Host header injection)
    const host = request.headers.host;
    const allowedHosts = config.environment === 'development'
      ? ['localhost:3000', 'localhost:3001', '127.0.0.1:3000', '127.0.0.1:3001']
      : ['timebutler-calendar.de', 'www.timebutler-calendar.de', 'calendar.timebutler.de'];

    if (host && !allowedHosts.some(allowedHost => host.includes(allowedHost))) {
      reply.status(400).send({
        error: {
          message: 'Invalid host header',
          statusCode: 400
        }
      });
      return;
    }

    // GDPR consent validation for data processing endpoints
    if (config.compliance.gdprHeaders && isDataProcessingEndpoint(request.url)) {
      const gdprConsent = request.headers['x-gdpr-consent'];
      if (!gdprConsent || gdprConsent !== 'accepted') {
        reply.status(451).send({
          error: {
            message: 'GDPR consent required for data processing',
            statusCode: 451,
            consentRequired: true,
            privacyPolicy: 'https://timebutler.de/privacy'
          }
        });
        return;
      }
    }
  };
};

/**
 * Rate Limiting Integration Hook
 * Provides integration points for rate limiting middleware
 */
export const rateLimitingHook = (config: SecurityConfig) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Add rate limiting context to request
    const clientIdentifier = getClientIdentifier(request);
    const endpoint = getEndpointCategory(request.url);

    // Attach rate limiting metadata for downstream middleware
    (request as any).rateLimit = {
      identifier: clientIdentifier,
      endpoint,
      timestamp: Date.now()
    };

    // Set rate limiting headers for transparency
    reply.header('X-Rate-Limit-Policy', getRateLimitPolicy(endpoint));
  };
};

/**
 * Response Security Cleanup
 * Final security cleanup before sending response
 */
export const responseCleanup = (config: SecurityConfig) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Remove any potentially sensitive response headers
    reply.removeHeader('X-Powered-By');
    reply.removeHeader('Server');

    // Add final security headers
    reply.header('X-Content-Type-Options', 'nosniff');

    // GDPR compliance: Ensure no sensitive data in headers
    if (config.compliance.dataMinimization) {
      // Remove headers that might leak sensitive information
      const sensitiveHeaders = ['x-real-ip', 'x-forwarded-for-original'];
      sensitiveHeaders.forEach(header => reply.removeHeader(header));
    }

    // Performance headers
    if (config.performance.responseTimeHeader && (request as any).startTime) {
      const responseTime = Date.now() - (request as any).startTime;
      reply.header('X-Response-Time', `${responseTime}ms`);
    }
  };
};

/**
 * Main Security Middleware Registration
 * Registers all security middleware with Fastify instance
 */
export const registerSecurityMiddleware = async (fastify: FastifyInstance, config?: Partial<SecurityConfig>) => {
  const securityConfig = {
    ...createSecurityConfig(process.env.NODE_ENV),
    ...config
  };

  // Register CORS handling
  fastify.addHook('onRequest', handleCORS(securityConfig));

  // Register security headers
  fastify.addHook('onRequest', setSecurityHeaders(securityConfig));

  // Register request validation
  fastify.addHook('preValidation', validateRequest(securityConfig));

  // Register rate limiting hook
  fastify.addHook('preHandler', rateLimitingHook(securityConfig));

  // Register response cleanup
  fastify.addHook('onSend', responseCleanup(securityConfig));

  // Log security configuration in development
  if (securityConfig.environment === 'development') {
    fastify.log.info('Security middleware registered with configuration:', {
      cors: securityConfig.cors.origin,
      csp: securityConfig.headers.csp.enabled,
      hsts: securityConfig.headers.hsts.enabled,
      gdpr: securityConfig.compliance.gdprHeaders
    });
  }
};

// Helper Functions

/**
 * Determines if the endpoint processes personal data requiring GDPR consent
 */
function isDataProcessingEndpoint(url: string): boolean {
  const dataProcessingPaths = [
    '/v1/vacation-plan',
    '/v1/export',
    '/v1/email',
    '/api/analytics'
  ];

  return dataProcessingPaths.some(path => url.includes(path));
}

/**
 * Extracts client identifier for rate limiting
 */
function getClientIdentifier(request: FastifyRequest): string {
  // Use X-Forwarded-For for proxy scenarios, fallback to connection IP
  const forwarded = request.headers['x-forwarded-for'] as string;
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : request.ip;

  // In development, use a combination of IP and User-Agent for better identification
  if (process.env.NODE_ENV === 'development') {
    const userAgent = request.headers['user-agent'] || 'unknown';
    return `${clientIp}:${Buffer.from(userAgent).toString('base64').substring(0, 8)}`;
  }

  return clientIp;
}

/**
 * Categorizes endpoints for rate limiting purposes
 */
function getEndpointCategory(url: string): string {
  if (url.includes('/health')) return 'health';
  if (url.includes('/v1/holidays')) return 'data';
  if (url.includes('/v1/bridge-weekends')) return 'computation';
  if (url.includes('/v1/vacation-plan')) return 'user-data';
  if (url.includes('/v1/export')) return 'export';
  if (url.includes('/v1/email')) return 'email';

  return 'general';
}

/**
 * Returns rate limit policy description for endpoint category
 */
function getRateLimitPolicy(category: string): string {
  const policies = {
    'health': '1000/minute',
    'data': '100/minute',
    'computation': '50/minute',
    'user-data': '20/minute',
    'export': '10/minute',
    'email': '5/minute',
    'general': '200/minute'
  };

  return policies[category] || policies.general;
}

// Export types for use in other modules
export type { SecurityConfig };
export { createSecurityConfig };