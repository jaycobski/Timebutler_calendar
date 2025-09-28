import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import Redis from 'ioredis';
import { HolidayService } from '../../services/HolidayService';
import { getEnvConfig } from '../../config/env';

/**
 * Holiday API routes with performance optimization
 * Task T031: GET /v1/holidays endpoint with state filtering and caching
 *
 * Constitutional Requirements:
 * - <100ms response times with Redis caching
 * - Support for all 16 German Bundesländer
 * - Bilingual German/English responses
 * - CDN-optimized caching headers
 * - CORS headers for frontend integration
 */

// Cache configuration for performance optimization
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=2592000', // 1 day browser, 30 days CDN
  'Vary': 'Accept-Language, Accept-Encoding',
  'ETag': true
} as const;

// Performance metrics tracking
interface HolidayMetrics {
  requests: number;
  avgResponseTime: number;
  cacheHitRate: number;
  errors: number;
}

let metrics: HolidayMetrics = {
  requests: 0,
  avgResponseTime: 0,
  cacheHitRate: 0,
  errors: 0
};

const holidaysRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Initialize services
  const env = getEnvConfig();
  const redis = new Redis(env.REDIS_URL);
  const holidayService = new HolidayService(redis);

  // Holiday query schema with comprehensive validation
  const holidayQuerySchema = Type.Object({
    state: Type.Optional(Type.String({
      pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH|ALL)$',
      description: 'German state code (Bundesland) or ALL for federal holidays'
    })),
    year: Type.Number({
      minimum: 2025,
      maximum: 2026,
      description: 'Year (2025-2026)'
    }),
    lang: Type.Optional(Type.String({
      enum: ['de', 'en'],
      default: 'de',
      description: 'Response language (German/English)'
    }))
  });

  // Holiday response schema with comprehensive data
  const holidayResponseSchema = Type.Object({
    holidays: Type.Array(Type.Object({
      id: Type.String({ description: 'Unique holiday identifier' }),
      name: Type.String({ description: 'Holiday name in requested language' }),
      date: Type.String({ format: 'date', description: 'ISO date format YYYY-MM-DD' }),
      type: Type.String({ enum: ['federal', 'state', 'regional'], description: 'Holiday classification' }),
      states: Type.Array(Type.String(), { description: 'German states where holiday applies' }),
      religious: Type.Boolean({ description: 'Whether holiday has religious origins' }),
      description: Type.Optional(Type.String({ description: 'Additional holiday information' }))
    })),
    metadata: Type.Object({
      state: Type.Optional(Type.String({ description: 'Requested state filter' })),
      year: Type.Number({ description: 'Requested year' }),
      language: Type.String({ description: 'Response language' }),
      total: Type.Number({ description: 'Total number of holidays returned' }),
      responseTime: Type.Number({ description: 'Response time in milliseconds' }),
      cached: Type.Boolean({ description: 'Whether response was served from cache' })
    })
  });

  // Error response schema
  const errorResponseSchema = Type.Object({
    error: Type.Object({
      message: Type.String(),
      statusCode: Type.Number(),
      details: Type.Optional(Type.String())
    })
  });

  // Performance helper function
  const trackMetrics = (startTime: number, wasFromCache: boolean, hasError = false): void => {
    const responseTime = Date.now() - startTime;
    metrics.requests++;
    metrics.avgResponseTime = ((metrics.avgResponseTime * (metrics.requests - 1)) + responseTime) / metrics.requests;

    if (wasFromCache) {
      metrics.cacheHitRate = ((metrics.cacheHitRate * (metrics.requests - 1)) + 1) / metrics.requests;
    } else {
      metrics.cacheHitRate = (metrics.cacheHitRate * (metrics.requests - 1)) / metrics.requests;
    }

    if (hasError) {
      metrics.errors++;
    }
  };

  // GET /v1/holidays - Main endpoint with comprehensive features
  await fastify.get('/', {
    schema: {
      description: 'Get German holidays with state filtering and caching optimization',
      summary: 'Retrieve German holidays for specific state/year with bilingual support',
      tags: ['holidays'],
      querystring: holidayQuerySchema,
      response: {
        200: holidayResponseSchema,
        400: errorResponseSchema,
        429: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      // Set CORS and caching headers for performance optimization
      reply.headers({
        'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept-Language',
        'Access-Control-Max-Age': '86400', // 24 hours preflight cache
        ...CACHE_HEADERS
      });

      // Handle OPTIONS preflight request
      if (request.method === 'OPTIONS') {
        reply.status(204);
        return reply.send();
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const { state, year, lang = 'de' } = request.query as any;
    let wasFromCache = false;

    try {
      // Validate required parameters
      if (!year) {
        reply.status(400);
        return reply.send({
          error: {
            message: 'Year parameter is required',
            statusCode: 400,
            details: 'Please provide a year between 2025-2026'
          }
        });
      }

      // Get holidays from service with performance tracking
      let holidays;
      if (state && state !== 'ALL') {
        holidays = await holidayService.getHolidaysByState(state, year, lang as 'de' | 'en');
      } else {
        holidays = await holidayService.getFederalHolidays(year, lang as 'de' | 'en');
      }

      // Check if response was cached (from service metrics)
      const serviceMetrics = holidayService.getMetrics();
      wasFromCache = serviceMetrics.cacheHits > 0;

      // Transform holidays to API response format
      const holidayData = holidays.map(holiday => ({
        id: holiday.id,
        name: lang === 'en' ? holiday.name_en : holiday.name_de,
        date: holiday.date,
        type: holiday.type,
        states: holiday.states,
        religious: holiday.is_catholic || holiday.is_protestant,
        description: lang === 'en'
          ? `German ${holiday.type} holiday`
          : `Deutscher ${holiday.type === 'federal' ? 'bundesweiter' : holiday.type === 'state' ? 'staatlicher' : 'regionaler'} Feiertag`
      }));

      const responseTime = Date.now() - startTime;

      // Track performance metrics
      trackMetrics(startTime, wasFromCache);

      // Log slow responses (constitutional requirement: <100ms)
      if (responseTime > 100) {
        fastify.log.warn({
          responseTime,
          state,
          year,
          holidayCount: holidays.length,
          wasFromCache
        }, 'Slow holiday response detected');
      }

      // Set additional performance headers
      reply.header('X-Response-Time', `${responseTime}ms`);
      reply.header('X-Cache-Status', wasFromCache ? 'HIT' : 'MISS');
      reply.header('X-Holiday-Count', holidays.length.toString());

      // Send optimized response
      return reply.send({
        holidays: holidayData,
        metadata: {
          state: state || undefined,
          year,
          language: lang,
          total: holidays.length,
          responseTime,
          cached: wasFromCache
        }
      });

    } catch (error: any) {
      trackMetrics(startTime, false, true);

      fastify.log.error({
        error: error.message,
        stack: error.stack,
        state,
        year,
        lang
      }, 'Failed to fetch holidays');

      const statusCode = error.statusCode || 500;
      const message = statusCode >= 500 && env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Failed to fetch holiday data';

      reply.status(statusCode);
      return reply.send({
        error: {
          message,
          statusCode,
          details: env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  });

  // GET /v1/holidays/:state/:year - Alternative route format with path parameters
  await fastify.get('/:state/:year', {
    schema: {
      description: 'Get holidays by path parameters (alternative format)',
      summary: 'Retrieve holidays using path-based parameters instead of query string',
      tags: ['holidays'],
      params: Type.Object({
        state: Type.String({
          pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH|ALL)$',
          description: 'German state code or ALL for federal holidays'
        }),
        year: Type.String({
          pattern: '^(2025|2026)$',
          description: 'Year (2025-2026)'
        })
      }),
      querystring: Type.Object({
        lang: Type.Optional(Type.String({
          enum: ['de', 'en'],
          default: 'de',
          description: 'Response language'
        }))
      }),
      response: {
        200: holidayResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      // Apply same CORS and caching headers
      reply.headers({
        'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept-Language',
        ...CACHE_HEADERS
      });
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const { state, year: yearStr } = request.params as any;
    const { lang = 'de' } = request.query as any;
    const year = parseInt(yearStr, 10);
    let wasFromCache = false;

    try {
      // Get holidays using the same service logic
      let holidays;
      if (state && state !== 'ALL') {
        holidays = await holidayService.getHolidaysByState(state, year, lang as 'de' | 'en');
      } else {
        holidays = await holidayService.getFederalHolidays(year, lang as 'de' | 'en');
      }

      // Check cache status
      const serviceMetrics = holidayService.getMetrics();
      wasFromCache = serviceMetrics.cacheHits > 0;

      // Transform to API format
      const holidayData = holidays.map(holiday => ({
        id: holiday.id,
        name: lang === 'en' ? holiday.name_en : holiday.name_de,
        date: holiday.date,
        type: holiday.type,
        states: holiday.states,
        religious: holiday.is_catholic || holiday.is_protestant,
        description: lang === 'en'
          ? `German ${holiday.type} holiday`
          : `Deutscher ${holiday.type === 'federal' ? 'bundesweiter' : holiday.type === 'state' ? 'staatlicher' : 'regionaler'} Feiertag`
      }));

      const responseTime = Date.now() - startTime;
      trackMetrics(startTime, wasFromCache);

      // Performance headers
      reply.header('X-Response-Time', `${responseTime}ms`);
      reply.header('X-Cache-Status', wasFromCache ? 'HIT' : 'MISS');

      return reply.send({
        holidays: holidayData,
        metadata: {
          state,
          year,
          language: lang,
          total: holidays.length,
          responseTime,
          cached: wasFromCache
        }
      });

    } catch (error: any) {
      trackMetrics(startTime, false, true);

      fastify.log.error({ error: error.message, state, year, lang }, 'Failed to fetch holidays via path params');

      reply.status(error.statusCode || 500);
      return reply.send({
        error: {
          message: error.message || 'Failed to fetch holiday data',
          statusCode: error.statusCode || 500
        }
      });
    }
  });

  // GET /v1/holidays/states - Get all German states with comprehensive data
  await fastify.get('/states', {
    schema: {
      description: 'Get comprehensive list of all German states (Bundesländer)',
      summary: 'Retrieve all 16 German states with metadata for holiday filtering',
      tags: ['holidays'],
      querystring: Type.Object({
        lang: Type.Optional(Type.String({
          enum: ['de', 'en'],
          default: 'de',
          description: 'Response language'
        }))
      }),
      response: {
        200: Type.Object({
          states: Type.Array(Type.Object({
            code: Type.String({ description: '2-letter German state code' }),
            name: Type.String({ description: 'State name in requested language' }),
            population: Type.Number({ description: 'Population estimate' }),
            capital: Type.String({ description: 'Capital city' }),
            religious_majority: Type.String({ enum: ['catholic', 'protestant', 'mixed'], description: 'Religious majority' }),
            unique_holidays: Type.Array(Type.String(), { description: 'State-specific holiday IDs' })
          })),
          metadata: Type.Object({
            total: Type.Number(),
            language: Type.String(),
            responseTime: Type.Number()
          })
        })
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      reply.headers({
        'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        ...CACHE_HEADERS
      });
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const { lang = 'de' } = request.query as any;

    try {
      // Complete German states data with holiday information
      const states = [
        {
          code: 'BW',
          name: lang === 'de' ? 'Baden-Württemberg' : 'Baden-Württemberg',
          population: 11103043,
          capital: lang === 'de' ? 'Stuttgart' : 'Stuttgart',
          religious_majority: 'mixed' as const,
          unique_holidays: ['heilige-drei-koenige', 'fronleichnam', 'allerheiligen']
        },
        {
          code: 'BY',
          name: lang === 'de' ? 'Bayern' : 'Bavaria',
          population: 13140183,
          capital: lang === 'de' ? 'München' : 'Munich',
          religious_majority: 'catholic' as const,
          unique_holidays: ['heilige-drei-koenige', 'fronleichnam', 'allerheiligen', 'augsburger-friedensfest']
        },
        {
          code: 'BE',
          name: lang === 'de' ? 'Berlin' : 'Berlin',
          population: 3677472,
          capital: lang === 'de' ? 'Berlin' : 'Berlin',
          religious_majority: 'protestant' as const,
          unique_holidays: []
        },
        {
          code: 'BB',
          name: lang === 'de' ? 'Brandenburg' : 'Brandenburg',
          population: 2537868,
          capital: lang === 'de' ? 'Potsdam' : 'Potsdam',
          religious_majority: 'protestant' as const,
          unique_holidays: ['reformationstag']
        },
        {
          code: 'HB',
          name: lang === 'de' ? 'Bremen' : 'Bremen',
          population: 680130,
          capital: lang === 'de' ? 'Bremen' : 'Bremen',
          religious_majority: 'protestant' as const,
          unique_holidays: ['reformationstag']
        },
        {
          code: 'HH',
          name: lang === 'de' ? 'Hamburg' : 'Hamburg',
          population: 1906411,
          capital: lang === 'de' ? 'Hamburg' : 'Hamburg',
          religious_majority: 'protestant' as const,
          unique_holidays: ['reformationstag']
        },
        {
          code: 'HE',
          name: lang === 'de' ? 'Hessen' : 'Hesse',
          population: 6293154,
          capital: lang === 'de' ? 'Wiesbaden' : 'Wiesbaden',
          religious_majority: 'mixed' as const,
          unique_holidays: ['fronleichnam']
        },
        {
          code: 'MV',
          name: lang === 'de' ? 'Mecklenburg-Vorpommern' : 'Mecklenburg-Western Pomerania',
          population: 1611160,
          capital: lang === 'de' ? 'Schwerin' : 'Schwerin',
          religious_majority: 'protestant' as const,
          unique_holidays: ['reformationstag']
        },
        {
          code: 'NI',
          name: lang === 'de' ? 'Niedersachsen' : 'Lower Saxony',
          population: 8003421,
          capital: lang === 'de' ? 'Hannover' : 'Hanover',
          religious_majority: 'protestant' as const,
          unique_holidays: ['reformationstag']
        },
        {
          code: 'NW',
          name: lang === 'de' ? 'Nordrhein-Westfalen' : 'North Rhine-Westphalia',
          population: 17925570,
          capital: lang === 'de' ? 'Düsseldorf' : 'Düsseldorf',
          religious_majority: 'catholic' as const,
          unique_holidays: ['fronleichnam', 'allerheiligen']
        },
        {
          code: 'RP',
          name: lang === 'de' ? 'Rheinland-Pfalz' : 'Rhineland-Palatinate',
          population: 4098391,
          capital: lang === 'de' ? 'Mainz' : 'Mainz',
          religious_majority: 'catholic' as const,
          unique_holidays: ['fronleichnam', 'allerheiligen']
        },
        {
          code: 'SL',
          name: lang === 'de' ? 'Saarland' : 'Saarland',
          population: 982348,
          capital: lang === 'de' ? 'Saarbrücken' : 'Saarbrücken',
          religious_majority: 'catholic' as const,
          unique_holidays: ['fronleichnam', 'allerheiligen']
        },
        {
          code: 'SN',
          name: lang === 'de' ? 'Sachsen' : 'Saxony',
          population: 4043002,
          capital: lang === 'de' ? 'Dresden' : 'Dresden',
          religious_majority: 'protestant' as const,
          unique_holidays: ['reformationstag', 'buss-und-bettag']
        },
        {
          code: 'ST',
          name: lang === 'de' ? 'Sachsen-Anhalt' : 'Saxony-Anhalt',
          population: 2180684,
          capital: lang === 'de' ? 'Magdeburg' : 'Magdeburg',
          religious_majority: 'protestant' as const,
          unique_holidays: ['heilige-drei-koenige', 'reformationstag']
        },
        {
          code: 'SH',
          name: lang === 'de' ? 'Schleswig-Holstein' : 'Schleswig-Holstein',
          population: 2910875,
          capital: lang === 'de' ? 'Kiel' : 'Kiel',
          religious_majority: 'protestant' as const,
          unique_holidays: ['reformationstag']
        },
        {
          code: 'TH',
          name: lang === 'de' ? 'Thüringen' : 'Thuringia',
          population: 2120237,
          capital: lang === 'de' ? 'Erfurt' : 'Erfurt',
          religious_majority: 'protestant' as const,
          unique_holidays: ['reformationstag']
        }
      ];

      const responseTime = Date.now() - startTime;

      reply.header('X-Response-Time', `${responseTime}ms`);
      reply.header('X-State-Count', states.length.toString());

      return reply.send({
        states,
        metadata: {
          total: states.length,
          language: lang,
          responseTime
        }
      });

    } catch (error: any) {
      fastify.log.error({ error: error.message, lang }, 'Failed to fetch German states');

      reply.status(500);
      return reply.send({
        error: {
          message: 'Failed to fetch German states data',
          statusCode: 500
        }
      });
    }
  });

  // GET /v1/holidays/metrics - Performance metrics endpoint (development only)
  if (env.NODE_ENV === 'development') {
    await fastify.get('/metrics', {
      schema: {
        description: 'Get holiday API performance metrics (development only)',
        tags: ['holidays'],
        response: {
          200: Type.Object({
            metrics: Type.Object({
              requests: Type.Number(),
              avgResponseTime: Type.Number(),
              cacheHitRate: Type.Number(),
              errors: Type.Number()
            }),
            serviceMetrics: Type.Object({
              totalRequests: Type.Number(),
              cacheHits: Type.Number(),
              cacheMisses: Type.Number(),
              apiRequests: Type.Number(),
              fallbackUsage: Type.Number(),
              avgResponseTime: Type.Number(),
              errors: Type.Number()
            }),
            uptime: Type.Number()
          })
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const serviceMetrics = holidayService.getMetrics();

      return reply.send({
        metrics,
        serviceMetrics,
        uptime: process.uptime()
      });
    });
  }

  // Cleanup function for graceful shutdown
  fastify.addHook('onClose', async () => {
    await holidayService.close();
    await redis.quit();
  });
};

export default holidaysRoutes;