import { FastifyServerOptions } from 'fastify';
import { envSchema } from './env.js';

export interface ServerConfig extends FastifyServerOptions {
  port: number;
  host: string;
}

/**
 * Performance-optimized Fastify server configuration
 * Designed for <100ms API response times and 25k concurrent users
 */
export const createServerConfig = (): ServerConfig => {
  const env = envSchema();

  return {
    // Network Configuration
    port: env.PORT,
    host: env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1',

    // Performance Optimizations
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true,
    maxParamLength: 100,
    caseSensitive: false,

    // Request/Response Limits for Performance
    bodyLimit: env.BODY_LIMIT, // 1MB default
    requestTimeout: env.CONNECTION_TIMEOUT, // 30s default
    keepAliveTimeout: env.KEEP_ALIVE_TIMEOUT, // 5s default
    maxRequestsPerSocket: 1000,

    // Connection Pool Optimization
    connectionTimeout: env.CONNECTION_TIMEOUT,
    pluginTimeout: 10000,

    // Security Headers
    trustProxy: env.NODE_ENV === 'production',

    // Logging Configuration (Pino for performance)
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
      ...(env.NODE_ENV === 'production' && {
        // Production logging optimizations
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        serializers: {
          req(request) {
            return {
              method: request.method,
              url: request.url,
              headers: {
                host: request.headers.host,
                'user-agent': request.headers['user-agent'],
                'content-type': request.headers['content-type'],
              },
            };
          },
          res(response) {
            return {
              statusCode: response.statusCode,
              responseTime: response.responseTime,
            };
          },
        },
      }),
    },

    // Validation Configuration
    ajv: {
      customOptions: {
        strict: 'log',
        keywords: ['kind', 'modifier'],
        validateFormats: true,
      },
    },

    // Schema Controller for Performance
    schemaController: {
      bucket: (parentSchemas) => {
        return {
          addSchema(schema) {
            return parentSchemas.add(schema);
          },
          getSchema(schemaId) {
            return parentSchemas.get(schemaId);
          },
          getSchemas() {
            const schemas = {};
            for (const [schemaId, schema] of parentSchemas.entries()) {
              schemas[schemaId] = schema;
            }
            return schemas;
          },
        };
      },
    },

    // Disable powered-by header for security
    disableRequestLogging: env.NODE_ENV === 'production',

    // HTTP/2 Support (when available)
    http2: false, // Can be enabled with proper TLS setup

    // Request ID Generation
    genReqId: (req) => {
      return req.headers['x-request-id'] || crypto.randomUUID();
    },
  };
};

/**
 * Production-specific optimizations
 * Applied when NODE_ENV=production
 */
export const productionOptimizations = {
  // V8 optimizations for production
  nodeOptions: [
    '--max-old-space-size=2048',
    '--optimize-for-size',
    '--gc-interval=100',
    '--max-semi-space-size=128',
  ],

  // Clustering configuration for 25k concurrent users
  cluster: {
    enabled: true,
    workers: process.env.CLUSTER_WORKERS ? parseInt(process.env.CLUSTER_WORKERS) : 0, // 0 = CPU count
    maxMemory: 512, // MB per worker
    respawn: true,
    gracefulShutdown: 30000, // 30s
  },

  // Process monitoring
  monitoring: {
    enabled: true,
    memoryThreshold: 0.8, // 80% of available memory
    cpuThreshold: 0.9, // 90% CPU usage
    healthCheck: {
      interval: 30000, // 30s
      timeout: 5000, // 5s
    },
  },
};