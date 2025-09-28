import { FastifyInstance } from 'fastify';
import { registerHealthRoutes } from '../api/routes/health.js';

/**
 * Register all API routes
 * Organized for performance and maintainability
 */
export const registerRoutes = async (app: FastifyInstance): Promise<void> => {
  // API prefix for all routes
  await app.register(async (fastify) => {
    // V1 API routes
    await fastify.register(registerV1Routes, { prefix: '/v1' });
  });

  // Root level routes (health, metrics)
  await app.register(registerRootRoutes);
};

/**
 * Register V1 API routes
 */
const registerV1Routes = async (app: FastifyInstance): Promise<void> => {
  // Holiday data routes
  await app.register(import('./v1/holidays.js'), { prefix: '/holidays' });

  // Bridge weekend calculation routes
  await app.register(import('./v1/bridge-weekends.js'), { prefix: '/bridge-weekends' });

  // Vacation plan routes
  await app.register(import('./v1/vacation-plans.js'), { prefix: '/vacation-plans' });

  // Calendar export routes
  await app.register(import('./v1/exports.js'), { prefix: '/exports' });

  // Email delivery routes
  await app.register(import('./v1/email.js'), { prefix: '/email' });
};

/**
 * Register root level routes
 */
const registerRootRoutes = async (app: FastifyInstance): Promise<void> => {
  // Register comprehensive health monitoring routes
  // This replaces basic health checks with constitutional monitoring
  await registerHealthRoutes(app);

  // API version info
  await app.get('/version', {
    schema: {
      description: 'API version information',
      response: {
        200: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            buildDate: { type: 'string' },
            nodeVersion: { type: 'string' },
            environment: { type: 'string' }
          }
        }
      }
    }
  }, async () => {
    return {
      version: '1.0.0',
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
  });
};