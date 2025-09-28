import Fastify, { FastifyInstance } from 'fastify';
import closeWithGrace from 'close-with-grace';

import { createServerConfig } from './config/server.js';
import { getEnvConfig } from './config/env.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';

/**
 * Create and configure Fastify application
 * Optimized for high performance and 25k concurrent users
 */
export const createApp = async (): Promise<FastifyInstance> => {
  const env = getEnvConfig();
  const serverConfig = createServerConfig();

  // Initialize Fastify with performance-optimized config
  const app = Fastify(serverConfig);

  // Graceful shutdown handler
  closeWithGrace({ delay: 500 }, async ({ signal, err }) => {
    app.log.info({ signal, err }, 'Closing application');
    await app.close();
  });

  // Global error handler for performance monitoring
  app.setErrorHandler(async (error, request, reply) => {
    const errorId = crypto.randomUUID();

    // Log error with correlation ID
    app.log.error({
      errorId,
      error: {
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
      }
    }, 'Request error occurred');

    // Return appropriate error response
    const statusCode = error.statusCode || 500;
    const isDevelopment = env.NODE_ENV === 'development';

    await reply.status(statusCode).send({
      error: {
        message: statusCode >= 500 && !isDevelopment
          ? 'Internal server error'
          : error.message,
        statusCode,
        ...(isDevelopment && { stack: error.stack }),
        errorId
      }
    });
  });

  // Not found handler
  app.setNotFoundHandler(async (request, reply) => {
    app.log.warn({
      method: request.method,
      url: request.url,
      headers: request.headers,
    }, 'Route not found');

    await reply.status(404).send({
      error: {
        message: 'Route not found',
        statusCode: 404,
        path: request.url
      }
    });
  });

  // Request/Response lifecycle hooks for performance monitoring
  app.addHook('onRequest', async (request) => {
    request.startTime = Date.now();
  });

  app.addHook('onResponse', async (request, reply) => {
    const responseTime = Date.now() - (request.startTime || Date.now());

    // Log slow requests (>100ms per constitutional requirement)
    if (responseTime > 100) {
      app.log.warn({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime
      }, 'Slow request detected');
    }

    // Add performance headers
    reply.header('X-Response-Time', responseTime);
    reply.header('X-Request-ID', request.id);
  });

  // Basic health endpoint is now handled by comprehensive health monitoring routes

  // Register all plugins (security, caching, validation, etc.)
  await registerPlugins(app);

  // Register API routes
  await registerRoutes(app);

  return app;
};

/**
 * Start the application server
 */
export const startApp = async (): Promise<FastifyInstance> => {
  const app = await createApp();
  const env = getEnvConfig();

  try {
    // Start listening
    const address = await app.listen({
      port: env.PORT,
      host: env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'
    });

    app.log.info({
      address,
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      pid: process.pid
    }, 'Server started successfully');

    // Performance monitoring in production
    if (env.NODE_ENV === 'production') {
      // Memory usage monitoring
      setInterval(() => {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        app.log.debug({
          memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          }
        }, 'Performance metrics');
      }, 30000); // Every 30 seconds
    }

    return app;

  } catch (error) {
    app.log.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Augment FastifyRequest interface for TypeScript
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}