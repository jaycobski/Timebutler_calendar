/**
 * Example integration of security middleware
 *
 * Shows how to integrate the security middleware with a Fastify application
 * for the Timebutler Calendar backend.
 */

import Fastify from 'fastify';
import { registerSecurityMiddleware, createSecurityConfig } from './security.js';

/**
 * Example 1: Basic integration with default configuration
 */
export async function createBasicSecureApp() {
  const app = Fastify({
    logger: true,
    trustProxy: true
  });

  // Register security middleware with default settings
  await registerSecurityMiddleware(app);

  // Add a test route
  app.get('/api/test', async () => {
    return { message: 'Hello from secure API!' };
  });

  return app;
}

/**
 * Example 2: Custom configuration for German production deployment
 */
export async function createProductionSecureApp() {
  const app = Fastify({
    logger: {
      level: 'info',
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          headers: {
            host: req.headers.host,
            'user-agent': req.headers['user-agent'],
            origin: req.headers.origin,
            'x-gdpr-consent': req.headers['x-gdpr-consent']
          }
        })
      }
    },
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024 // 10MB
  });

  // Custom security configuration for German market
  const securityConfig = {
    ...createSecurityConfig('production'),
    cors: {
      origin: [
        'https://timebutler-calendar.de',
        'https://www.timebutler-calendar.de',
        'https://calendar.timebutler.de'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
      maxAge: 86400 // 24 hours
    },
    headers: {
      ...createSecurityConfig('production').headers,
      csp: {
        enabled: true,
        reportOnly: false,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'strict-dynamic'"],
          'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
          'font-src': ["'self'", 'fonts.gstatic.com'],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'", 'api.timebutler.de', '*.timebutler.de'],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'upgrade-insecure-requests': []
        }
      }
    },
    compliance: {
      gdprHeaders: true,
      germanLanguageSupport: true,
      euCookieCompliance: true,
      dataMinimization: true
    }
  };

  // Register security middleware with custom configuration
  await registerSecurityMiddleware(app, securityConfig);

  // Example API routes with GDPR compliance
  app.get('/api/holidays', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            holidays: { type: 'array' },
            gdprNotice: { type: 'string' }
          }
        }
      }
    }
  }, async () => {
    return {
      holidays: [],
      gdprNotice: 'Diese API sammelt keine personenbezogenen Daten.'
    };
  });

  app.post('/api/vacation-plan', {
    schema: {
      headers: {
        type: 'object',
        properties: {
          'x-gdpr-consent': { type: 'string', enum: ['accepted'] }
        },
        required: ['x-gdpr-consent']
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          state: { type: 'string' },
          selectedBridges: { type: 'array' }
        },
        required: ['email', 'state', 'selectedBridges']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            planId: { type: 'string' },
            gdprInfo: {
              type: 'object',
              properties: {
                dataRetention: { type: 'string' },
                privacyPolicy: { type: 'string' },
                rightToErasure: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    // This route requires GDPR consent header
    // Middleware will automatically validate this

    return {
      planId: 'plan-123',
      gdprInfo: {
        dataRetention: 'Ihre Daten werden 90 Tage gespeichert',
        privacyPolicy: 'https://timebutler.de/privacy',
        rightToErasure: 'Sie können die Löschung Ihrer Daten jederzeit beantragen'
      }
    };
  });

  return app;
}

/**
 * Example 3: Development configuration with relaxed security
 */
export async function createDevelopmentSecureApp() {
  const app = Fastify({
    logger: {
      level: 'debug'
    },
    trustProxy: true
  });

  const devConfig = {
    ...createSecurityConfig('development'),
    cors: {
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: ['*'],
      exposedHeaders: [
        'X-Response-Time',
        'X-Request-ID',
        'X-GDPR-Status'
      ]
    }
  };

  await registerSecurityMiddleware(app, devConfig);

  // Development-only debugging routes
  app.get('/debug/headers', async (request) => {
    return {
      headers: request.headers,
      security: (request as any).security,
      rateLimit: (request as any).rateLimit
    };
  });

  app.get('/debug/gdpr-test', {
    schema: {
      headers: {
        type: 'object',
        properties: {
          'x-gdpr-consent': { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const hasConsent = request.headers['x-gdpr-consent'] === 'accepted';

    reply.header('X-GDPR-Test', hasConsent ? 'valid' : 'missing');

    return {
      gdprConsent: hasConsent,
      message: hasConsent
        ? 'GDPR consent detected'
        : 'GDPR consent missing - add X-GDPR-Consent: accepted header'
    };
  });

  return app;
}

/**
 * Example 4: How to handle security violations
 */
export async function createAppWithSecurityMonitoring() {
  const app = Fastify({ logger: true });

  await registerSecurityMiddleware(app);

  // Custom error handler for security violations
  app.setErrorHandler(async (error, request, reply) => {
    app.log.error({
      error: error.message,
      statusCode: error.statusCode,
      url: request.url,
      method: request.method,
      headers: request.headers,
      security: (request as any).security
    }, 'Security violation detected');

    // Send appropriate response based on error type
    if (error.statusCode === 451) {
      // GDPR consent required
      return reply.status(451).send({
        error: {
          message: 'GDPR-Einwilligung erforderlich für die Datenverarbeitung',
          statusCode: 451,
          consentRequired: true,
          privacyPolicy: 'https://timebutler.de/privacy',
          germanMessage: 'Ihre Einwilligung ist gemäß DSGVO erforderlich'
        }
      });
    }

    if (error.statusCode === 413) {
      // Request too large
      return reply.status(413).send({
        error: {
          message: 'Request zu groß',
          statusCode: 413,
          maxSize: '10MB',
          germanMessage: 'Die Anfrage überschreitet die maximale Größe'
        }
      });
    }

    if (error.statusCode === 429) {
      // Rate limit exceeded
      return reply.status(429).send({
        error: {
          message: 'Rate limit überschritten',
          statusCode: 429,
          retryAfter: '60',
          germanMessage: 'Zu viele Anfragen - bitte versuchen Sie es später erneut'
        }
      });
    }

    // Default error response
    return reply.status(error.statusCode || 500).send({
      error: {
        message: error.message,
        statusCode: error.statusCode || 500
      }
    });
  });

  return app;
}

/**
 * Example usage in main application
 */
if (require.main === module) {
  const startServer = async () => {
    try {
      const app = await createProductionSecureApp();

      await app.listen({
        port: 3001,
        host: '127.0.0.1'
      });

      console.log('Server started with security middleware');
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  };

  startServer();
}