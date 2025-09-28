import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Optimized Holiday API Routes
 * Constitutional requirement: <100ms response times
 * Implements aggressive caching, query optimization, and German market patterns
 */

interface HolidayQuery {
  state?: string;
  year?: number;
  lang?: string;
  format?: 'json' | 'ical';
  include_bridge?: boolean;
}

interface BridgeWeekendQuery {
  state: string;
  year?: number;
  vacation_days?: number;
  lang?: string;
  sort?: 'efficiency' | 'date' | 'duration';
}

/**
 * Holiday routes optimized for German traffic patterns
 */
async function holidayRoutesOptimized(fastify: FastifyInstance): Promise<void> {
  // Preload hook for performance middleware
  fastify.addHook('preHandler', fastify.cacheManager?.createCacheMiddleware(86400000)); // 24h cache

  /**
   * Get holidays for German state
   * Optimized for <100ms response time requirement
   */
  fastify.get('/holidays', {
    schema: {
      description: 'Get German holidays by state and year (optimized)',
      tags: ['holidays'],
      querystring: {
        type: 'object',
        properties: {
          state: {
            type: 'string',
            enum: ['BY', 'BW', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
            description: 'German state code (Bundesland)'
          },
          year: {
            type: 'integer',
            minimum: 2024,
            maximum: 2027,
            default: new Date().getFullYear()
          },
          lang: {
            type: 'string',
            enum: ['de', 'en'],
            default: 'de'
          },
          format: {
            type: 'string',
            enum: ['json', 'ical'],
            default: 'json'
          },
          include_bridge: {
            type: 'boolean',
            default: false,
            description: 'Include bridge weekend opportunities'
          }
        },
        required: ['state']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            state: { type: 'string' },
            year: { type: 'number' },
            language: { type: 'string' },
            holidays: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  type: { type: 'string' },
                  isNationwide: { type: 'boolean' },
                  religiousDenomination: { type: 'string' },
                  bridgeOpportunities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' },
                        vacationDaysNeeded: { type: 'number' },
                        totalDaysOff: { type: 'number' },
                        efficiency: { type: 'number' }
                      }
                    }
                  }
                }
              }
            },
            performance: {
              type: 'object',
              properties: {
                queryTime: { type: 'number' },
                cacheHit: { type: 'boolean' },
                responseTime: { type: 'number' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: HolidayQuery }>, reply: FastifyReply) => {
    const startTime = Date.now();
    const { state, year = new Date().getFullYear(), lang = 'de', format = 'json', include_bridge = false } = request.query;

    try {
      // Validate German state
      if (!isValidGermanState(state)) {
        return reply.status(400).send({
          error: 'INVALID_STATE',
          message: `Invalid German state code: ${state}`,
          statusCode: 400
        });
      }

      // Get holidays with optimized query
      const holidays = await fastify.queryOptimizer.getHolidays(state, year, lang);

      // Include bridge opportunities if requested
      let processedHolidays = holidays;
      if (include_bridge) {
        const bridges = await fastify.queryOptimizer.getBridgeOpportunities(state, year);
        processedHolidays = mergeHolidaysWithBridges(holidays, bridges);
      }

      // Format response based on language
      const formattedHolidays = formatHolidays(processedHolidays, lang);

      const responseTime = Date.now() - startTime;

      // Constitutional compliance check
      if (responseTime > 100) {
        fastify.log.warn({
          requestId: request.id,
          responseTime,
          state,
          year,
          constitutionalViolation: true
        }, 'Holiday API response time violation');
      }

      // Handle different response formats
      if (format === 'ical') {
        const icalData = generateICalData(formattedHolidays, state, year);
        reply.header('Content-Type', 'text/calendar');
        reply.header('Content-Disposition', `attachment; filename="holidays-${state}-${year}.ics"`);
        return reply.send(icalData);
      }

      return {
        state,
        year,
        language: lang,
        holidays: formattedHolidays,
        performance: {
          queryTime: responseTime,
          cacheHit: reply.getHeader('X-Cache-Status') === 'HIT',
          responseTime
        }
      };

    } catch (error) {
      fastify.log.error({
        error: error.message,
        state,
        year,
        responseTime: Date.now() - startTime
      }, 'Holiday API error');

      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve holidays',
        statusCode: 500
      });
    }
  });

  /**
   * Get bridge weekend opportunities (optimized)
   */
  fastify.get('/bridge-weekends', {
    schema: {
      description: 'Get optimized bridge weekend opportunities',
      tags: ['bridge-weekends'],
      querystring: {
        type: 'object',
        properties: {
          state: {
            type: 'string',
            enum: ['BY', 'BW', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH']
          },
          year: {
            type: 'integer',
            minimum: 2024,
            maximum: 2027,
            default: new Date().getFullYear()
          },
          vacation_days: {
            type: 'integer',
            minimum: 1,
            maximum: 30,
            default: 10,
            description: 'Maximum vacation days to use'
          },
          lang: {
            type: 'string',
            enum: ['de', 'en'],
            default: 'de'
          },
          sort: {
            type: 'string',
            enum: ['efficiency', 'date', 'duration'],
            default: 'efficiency'
          }
        },
        required: ['state']
      }
    }
  }, async (request: FastifyRequest<{ Querystring: BridgeWeekendQuery }>, reply: FastifyReply) => {
    const startTime = Date.now();
    const { state, year = new Date().getFullYear(), vacation_days = 10, lang = 'de', sort = 'efficiency' } = request.query;

    try {
      // Get bridge opportunities with optimized query
      const bridges = await fastify.queryOptimizer.getBridgeOpportunities(state, year, vacation_days);

      // Sort results based on preference
      const sortedBridges = sortBridgeOpportunities(bridges, sort);

      // Format for German market preferences
      const formattedBridges = formatBridgeOpportunities(sortedBridges, lang);

      const responseTime = Date.now() - startTime;

      return {
        state,
        year,
        maxVacationDays: vacation_days,
        language: lang,
        sortBy: sort,
        opportunities: formattedBridges,
        summary: {
          totalOpportunities: formattedBridges.length,
          bestEfficiency: formattedBridges[0]?.efficiency || 0,
          averageVacationDays: calculateAverageVacationDays(formattedBridges)
        },
        performance: {
          queryTime: responseTime,
          cacheHit: reply.getHeader('X-Cache-Status') === 'HIT',
          responseTime
        }
      };

    } catch (error) {
      fastify.log.error({
        error: error.message,
        state,
        year,
        responseTime: Date.now() - startTime
      }, 'Bridge weekends API error');

      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve bridge opportunities',
        statusCode: 500
      });
    }
  });

  /**
   * Health check for holiday service
   */
  fastify.get('/health', async () => {
    const startTime = Date.now();

    try {
      // Quick health check query
      await fastify.queryOptimizer.executeQuery(
        'SELECT 1 as health_check',
        [],
        { timeout: 5000 }
      );

      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime,
        constitutional: {
          target: 100,
          compliance: responseTime <= 100
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  });

  /**
   * Preload cache endpoint (for deployment optimization)
   */
  fastify.post('/preload', {
    schema: {
      description: 'Preload holiday cache for all German states',
      tags: ['admin']
    }
  }, async () => {
    const startTime = Date.now();
    const states = ['BY', 'BW', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
    const years = [2025, 2026];
    let preloaded = 0;

    for (const state of states) {
      for (const year of years) {
        try {
          await fastify.queryOptimizer.getHolidays(state, year, 'de');
          await fastify.queryOptimizer.getHolidays(state, year, 'en');
          await fastify.queryOptimizer.getBridgeOpportunities(state, year);
          preloaded += 3;
        } catch (error) {
          fastify.log.warn({ state, year, error: error.message }, 'Preload failed');
        }
      }
    }

    return {
      preloaded,
      states: states.length,
      years: years.length,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  });
}

/**
 * Utility functions for holiday processing
 */

function isValidGermanState(state: string): boolean {
  const validStates = ['BY', 'BW', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
  return validStates.includes(state);
}

function formatHolidays(holidays: any[], language: string): any[] {
  return holidays.map(holiday => ({
    id: holiday.id,
    name: language === 'en' ? holiday.name_en || holiday.name_de : holiday.name_de,
    date: holiday.date,
    type: holiday.type,
    isNationwide: holiday.is_nationwide,
    religiousDenomination: holiday.religious_denomination,
    bridgeOpportunities: holiday.bridgeOpportunities || []
  }));
}

function mergeHolidaysWithBridges(holidays: any[], bridges: any[]): any[] {
  const bridgeMap = new Map();
  bridges.forEach(bridge => {
    if (!bridgeMap.has(bridge.holiday_id)) {
      bridgeMap.set(bridge.holiday_id, []);
    }
    bridgeMap.get(bridge.holiday_id).push({
      startDate: bridge.start_date,
      endDate: bridge.end_date,
      vacationDaysNeeded: bridge.vacation_days_needed,
      totalDaysOff: bridge.total_days_off,
      efficiency: bridge.efficiency
    });
  });

  return holidays.map(holiday => ({
    ...holiday,
    bridgeOpportunities: bridgeMap.get(holiday.id) || []
  }));
}

function sortBridgeOpportunities(bridges: any[], sortBy: string): any[] {
  switch (sortBy) {
    case 'efficiency':
      return bridges.sort((a, b) => b.efficiency - a.efficiency);
    case 'date':
      return bridges.sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime());
    case 'duration':
      return bridges.sort((a, b) => b.total_days_off - a.total_days_off);
    default:
      return bridges;
  }
}

function formatBridgeOpportunities(bridges: any[], language: string): any[] {
  return bridges.map(bridge => ({
    holidayId: bridge.holiday_id,
    holidayName: language === 'en' ? bridge.name_en || bridge.name_de : bridge.name_de,
    holidayDate: bridge.holiday_date,
    startDate: bridge.start_date,
    endDate: bridge.end_date,
    vacationDaysNeeded: bridge.vacation_days_needed,
    totalDaysOff: bridge.total_days_off,
    efficiency: Math.round(bridge.efficiency * 100) / 100,
    patternType: bridge.pattern_type
  }));
}

function calculateAverageVacationDays(bridges: any[]): number {
  if (bridges.length === 0) return 0;
  const total = bridges.reduce((sum, bridge) => sum + bridge.vacationDaysNeeded, 0);
  return Math.round((total / bridges.length) * 100) / 100;
}

function generateICalData(holidays: any[], state: string, year: number): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TimeButler//Holiday Calendar//EN',
    `X-WR-CALNAME:German Holidays ${state} ${year}`,
    'X-WR-TIMEZONE:Europe/Berlin',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  holidays.forEach(holiday => {
    const date = new Date(holiday.date);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${holiday.id}@timebutler.de`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `SUMMARY:${holiday.name}`,
      `DESCRIPTION:German public holiday - ${state}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default fp(holidayRoutesOptimized, {
  name: 'holidays-optimized',
  dependencies: ['performance-monitoring', 'caching']
});

// Extend Fastify instance for TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    queryOptimizer: any; // Would be properly typed with actual QueryOptimizer
  }
}