import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { getEnvConfig } from '../config/env.js';
import sessionPlugin from './session.js';
import { VacationPlanService } from '../services/VacationPlanService.js';
import { EmailService, EmailServiceFactory } from '../services/EmailService.js';

/**
 * Register all Fastify plugins for performance and security
 */
export const registerPlugins = async (app: FastifyInstance): Promise<void> => {
  const env = getEnvConfig();

  // Security plugins (order matters)
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
  });

  // CORS configuration
  await app.register(import('@fastify/cors'), {
    origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Compression for performance (Brotli + Gzip)
  await app.register(import('@fastify/compress'), {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
    encodings: ['br', 'gzip', 'deflate'],
    brotliOptions: {
      params: {
        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 6, // Balance between speed and compression
      },
    },
    zlibOptions: {
      level: 6, // Balance between speed and compression
      chunkSize: 1024,
    },
  });

  // Rate limiting (constitutional requirement: 25k concurrent users)
  if (!env.DISABLE_RATE_LIMITING) {
    await app.register(import('@fastify/rate-limit'), {
      max: env.RATE_LIMIT_MAX, // requests per window
      timeWindow: env.RATE_LIMIT_WINDOW_MS, // 15 minutes default
      cache: 10000, // cache 10k users
      allowList: ['127.0.0.1', '::1'], // localhost
      skipOnError: true, // don't fail on rate limit errors
      keyGenerator: (request) => {
        // Use forwarded IP in production, fallback to connection IP
        return request.headers['x-forwarded-for'] ||
               request.headers['x-real-ip'] ||
               request.connection.remoteAddress ||
               request.ip;
      },
      errorResponseBuilder: (request, context) => ({
        error: {
          message: 'Too many requests',
          statusCode: 429,
          retryAfter: Math.round(context.ttl / 1000),
        },
      }),
    });
  }

  // Under pressure monitoring for performance
  await app.register(import('under-pressure'), {
    maxEventLoopDelay: 1000, // 1s max event loop delay
    maxHeapUsedBytes: 1073741824, // 1GB max heap
    maxRssBytes: 1073741824, // 1GB max RSS
    maxEventLoopUtilization: 0.98, // 98% max event loop utilization
    message: 'Service temporarily unavailable due to high load',
    retryAfter: 30, // retry after 30 seconds
    healthCheck: async () => {
      // Custom health check logic can be added here
      return true;
    },
  });

  // Static file serving (for health checks, docs)
  await app.register(import('@fastify/static'), {
    root: process.cwd() + '/public',
    prefix: '/static/',
    list: false, // disable directory listing
    dotfiles: 'ignore',
    etag: true,
    lastModified: true,
    maxAge: env.NODE_ENV === 'production' ? 86400000 : 0, // 1 day in production
  });

  // API documentation (development only)
  if (env.NODE_ENV === 'development') {
    await app.register(import('@fastify/swagger'), {
      swagger: {
        info: {
          title: 'TimeButler Calendar API',
          description: 'German holiday bridge weekend optimizer',
          version: '1.0.0',
        },
        host: `localhost:${env.PORT}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'holidays', description: 'German holiday data' },
          { name: 'bridge-weekends', description: 'Bridge weekend calculations' },
          { name: 'exports', description: 'Calendar exports' },
          { name: 'health', description: 'Health check endpoints' },
        ],
      },
    });

    await app.register(import('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'none',
        deepLinking: false,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    });
  }

  // Request/Response validation schemas
  await registerValidationPlugin(app);

  // Database connection plugin
  await registerDatabasePlugin(app);

  // Redis connection plugin
  await registerRedisPlugin(app);

  // Session management plugin
  await registerSessionPlugin(app);

  // Email service plugin
  await registerEmailPlugin(app);

  // Vacation plan service plugin
  await registerVacationPlanServicePlugin(app);
};

/**
 * Register JSON schema validation plugin
 */
const registerValidationPlugin = fastifyPlugin(async (app: FastifyInstance) => {
  // Configure AJV for performance
  app.setValidatorCompiler(({ schema }) => {
    return app.ajv.compile(schema);
  });

  app.setSerializerCompiler(({ schema }) => {
    return app.ajv.compile(schema);
  });

  // Add custom formats for German-specific validation
  app.ajv.addFormat('german-state', /^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$/);
  app.ajv.addFormat('iso-date', /^\d{4}-\d{2}-\d{2}$/);
  app.ajv.addFormat('vacation-days', (data) => {
    return typeof data === 'number' && data >= 1 && data <= 4;
  });
});

/**
 * Register PostgreSQL database plugin
 */
const registerDatabasePlugin = fastifyPlugin(async (app: FastifyInstance) => {
  const env = getEnvConfig();

  // Database connection will be implemented in separate database service
  // For now, just register the plugin structure
  app.decorate('db', {
    // Database connection pool will be added here
    // Using pg.Pool for connection pooling performance
  });
});

/**
 * Register Redis caching plugin
 */
const registerRedisPlugin = fastifyPlugin(async (app: FastifyInstance) => {
  const env = getEnvConfig();

  // Mock Redis client for development
  // In production, this would be a real Redis connection
  const mockRedis = {
    get: async (key: string) => null,
    set: async (key: string, value: string) => 'OK',
    setex: async (key: string, ttl: number, value: string) => 'OK',
    del: async (key: string) => 1,
    keys: async (pattern: string) => [],
    ttl: async (key: string) => -1
  };

  app.decorate('redis', mockRedis);
  app.log.info('Redis plugin registered (mock mode for development)');
});

/**
 * Register session management plugin
 */
const registerSessionPlugin = fastifyPlugin(async (app: FastifyInstance) => {
  const env = getEnvConfig();

  await app.register(sessionPlugin, {
    secret: env.SESSION_SECRET || 'timebutler-session-secret-key-change-in-production',
    sessionName: 'timebutler.session',
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days for GDPR compliance
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    rolling: true,
    saveUninitialized: false,
    redisPrefix: 'timebutler:session'
  });
});

/**
 * Register email service plugin
 */
const registerEmailPlugin = fastifyPlugin(async (app: FastifyInstance) => {
  const env = getEnvConfig();

  // Create EmailService instance using factory
  const emailService = env.NODE_ENV === 'production'
    ? EmailServiceFactory.createProductionService(app.redis as any)
    : EmailServiceFactory.createDevelopmentService(app.redis as any);

  app.decorate('emailService', emailService);
  app.log.info('EmailService plugin registered successfully');
});

/**
 * Register vacation plan service plugin
 */
const registerVacationPlanServicePlugin = fastifyPlugin(async (app: FastifyInstance) => {
  const vacationPlanService = new VacationPlanService(app);
  app.decorate('vacationPlanService', vacationPlanService);

  app.log.info('VacationPlanService plugin registered successfully');
});

// Augment Fastify instance with custom decorators
declare module 'fastify' {
  interface FastifyInstance {
    db: {
      // Database interface will be defined here
    };
    redis: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string) => Promise<string>;
      setex: (key: string, ttl: number, value: string) => Promise<string>;
      del: (key: string) => Promise<number>;
      keys: (pattern: string) => Promise<string[]>;
      ttl: (key: string) => Promise<number>;
    };
    emailService: EmailService;
    vacationPlanService: VacationPlanService;
  }
}