import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { BridgeCalculatorService } from '../../services/BridgeCalculatorService.js';
import { HolidayService } from '../../services/HolidayService.js';
import { BridgeWeekend, BridgeWeekendConstraints } from '../../models/bridge-weekend.js';
import { getEnvConfig } from '../../config/env.js';
import Redis from 'ioredis';

/**
 * Bridge Weekend API routes - German Holiday Bridge Weekend Optimization
 * Task T032: POST /v1/bridge-weekends endpoint with vacation budget optimization
 *
 * Constitutional Requirements:
 * - <100ms response time for all calculations
 * - Mathematical precision: efficiency = total_days_off / vacation_days_needed
 * - German holiday optimization patterns (May cluster, Christmas mega-bridge)
 * - Support for all 16 German Bundesländer with Catholic/Protestant variations
 * - Vacation budget optimization with constraint handling
 * - Bilingual support (German formal, English casual)
 * - Performance monitoring and metrics collection
 */
const bridgeWeekendsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Initialize services for bridge calculation
  const env = getEnvConfig();
  const redis = new Redis(env.REDIS_URL);
  const holidayService = new HolidayService(redis);
  const bridgeCalculatorService = new BridgeCalculatorService(holidayService, redis);

  // Enhanced bridge weekend calculation request schema with German optimization
  const bridgeWeekendRequestSchema = Type.Object({
    state: Type.String({
      pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$',
      description: 'German state code (Bundesland)'
    }),
    year: Type.Number({
      minimum: 2025,
      maximum: 2026,
      description: 'Year for calculation (2025-2026 supported)'
    }),
    vacation_days_budget: Type.Number({
      minimum: 1,
      maximum: 30,
      description: 'Total available vacation days for optimization'
    }),
    constraints: Type.Optional(Type.Object({
      minimum_efficiency: Type.Optional(Type.Number({
        minimum: 1.0,
        maximum: 10.0,
        default: 2.0,
        description: 'Minimum efficiency threshold (days_off / vacation_days)'
      })),
      max_vacation_days_per_bridge: Type.Optional(Type.Number({
        minimum: 1,
        maximum: 10,
        default: 4,
        description: 'Maximum vacation days per individual bridge'
      })),
      avoid_school_holidays: Type.Optional(Type.Boolean({
        default: false,
        description: 'Avoid overlapping with school holidays'
      })),
      prefer_long_weekends: Type.Optional(Type.Boolean({
        default: true,
        description: 'Prioritize longer weekend breaks'
      })),
      max_consecutive_days_off: Type.Optional(Type.Number({
        minimum: 3,
        maximum: 21,
        description: 'Maximum consecutive days off limit'
      })),
      include_religious_holidays: Type.Optional(Type.Boolean({
        default: true,
        description: 'Include Catholic/Protestant holidays if applicable'
      }))
    })),
    language: Type.Optional(Type.String({
      enum: ['de', 'en'],
      default: 'de',
      description: 'Response language preference'
    }))
  });

  // Enhanced bridge weekend response schema with German optimization data
  const bridgeWeekendResponseSchema = Type.Object({
    bridges: Type.Array(Type.Object({
      id: Type.String({ description: 'Unique bridge weekend identifier' }),
      holiday_id: Type.String({ description: 'Associated holiday identifier' }),
      holiday_name: Type.String({ description: 'Holiday name in requested language' }),
      state_code: Type.String({ description: 'German state code' }),
      start_date: Type.String({ format: 'date', description: 'Bridge start date (ISO)' }),
      end_date: Type.String({ format: 'date', description: 'Bridge end date (ISO)' }),
      vacation_days_needed: Type.Number({ description: 'Required vacation days' }),
      total_days_off: Type.Number({ description: 'Total days off including weekends' }),
      efficiency: Type.Number({ description: 'ROI: total_days_off / vacation_days_needed' }),
      pattern: Type.String({
        enum: ['thursday-friday', 'monday-tuesday', 'tuesday-friday', 'sandwich', 'extend-weekend'],
        description: 'Bridge pattern type'
      })
    })),
    optimization: Type.Object({
      total_bridges_found: Type.Number({ description: 'Total bridge opportunities identified' }),
      selected_bridges_count: Type.Number({ description: 'Optimally selected bridges' }),
      total_vacation_days_used: Type.Number({ description: 'Vacation days used in optimization' }),
      total_days_off: Type.Number({ description: 'Total days off achieved' }),
      unused_vacation_days: Type.Number({ description: 'Remaining vacation budget' }),
      average_efficiency: Type.Number({ description: 'Average efficiency of selected bridges' }),
      optimization_score: Type.Number({ description: 'Overall optimization quality score' })
    }),
    recommendations: Type.Array(Type.String({ description: 'German optimization recommendations' })),
    metadata: Type.Object({
      state: Type.String({ description: 'German state code' }),
      year: Type.Number({ description: 'Calculation year' }),
      language: Type.String({ description: 'Response language' }),
      calculation_time_ms: Type.Number({ description: 'Calculation performance' }),
      cache_hit: Type.Boolean({ description: 'Whether result was cached' })
    })
  });

  // POST /v1/bridge-weekends - Calculate optimal bridge weekends with German optimization
  await fastify.post('/', {
    schema: {
      description: 'Calculate optimal bridge weekends for German holidays with vacation budget optimization',
      summary: 'German Holiday Bridge Weekend Optimization Engine',
      tags: ['bridge-weekends', 'optimization', 'german-holidays'],
      body: bridgeWeekendRequestSchema,
      response: {
        200: bridgeWeekendResponseSchema,
        400: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                details: { type: 'string' },
                statusCode: { type: 'number' },
                code: { type: 'string' }
              }
            }
          }
        },
        422: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                validation_errors: { type: 'array' },
                statusCode: { type: 'number' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const startTime = performance.now();
    const {
      state,
      year,
      vacation_days_budget,
      constraints = {},
      language = 'de'
    } = request.body as any;

    try {
      // Validate German state code
      const validStates = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
      if (!validStates.includes(state.toUpperCase())) {
        return reply.status(400).send({
          error: {
            message: language === 'de' ? 'Ungültiger Bundesland-Code' : 'Invalid German state code',
            details: `Valid states: ${validStates.join(', ')}`,
            statusCode: 400,
            code: 'INVALID_STATE_CODE'
          }
        });
      }

      // Validate year range
      if (year < 2025 || year > 2026) {
        return reply.status(400).send({
          error: {
            message: language === 'de' ? 'Jahr außerhalb des unterstützten Bereichs' : 'Year outside supported range',
            details: 'Supported years: 2025-2026',
            statusCode: 400,
            code: 'INVALID_YEAR_RANGE'
          }
        });
      }

      // Validate vacation days budget
      if (vacation_days_budget < 1 || vacation_days_budget > 30) {
        return reply.status(422).send({
          error: {
            message: language === 'de' ? 'Urlaubstage-Budget muss zwischen 1 und 30 liegen' : 'Vacation days budget must be between 1 and 30',
            validation_errors: ['vacation_days_budget: must be between 1 and 30'],
            statusCode: 422
          }
        });
      }

      // Convert request constraints to BridgeWeekendConstraints
      const bridgeConstraints: BridgeWeekendConstraints = {
        maxVacationDays: constraints.max_vacation_days_per_bridge || 4,
        avoidSchoolHolidays: constraints.avoid_school_holidays || false,
        maxConsecutiveDaysOff: constraints.max_consecutive_days_off,
        preferLongWeekends: constraints.prefer_long_weekends !== false,
        minimum_efficiency: constraints.minimum_efficiency || 2.0
      };

      // Calculate optimal bridge weekends using the service
      const optimalSelection = await bridgeCalculatorService.calculateOptimalBridges(
        state.toUpperCase(),
        year,
        vacation_days_budget,
        bridgeConstraints
      );

      // Get performance metrics
      const calculationTime = performance.now() - startTime;
      const performanceMetrics = bridgeCalculatorService.getPerformanceMetrics();

      // Format bridge weekends for response
      const formattedBridges = optimalSelection.selectedBridges.map(bridge => ({
        id: bridge.id,
        holiday_id: bridge.holiday_id,
        holiday_name: bridge.holiday_id, // Will be enhanced with actual holiday names
        state_code: bridge.state_code,
        start_date: bridge.start_date,
        end_date: bridge.end_date,
        vacation_days_needed: bridge.vacation_days_needed,
        total_days_off: bridge.total_days_off,
        efficiency: bridge.efficiency,
        pattern: bridge.pattern
      }));

      // Prepare optimization summary
      const optimization = {
        total_bridges_found: formattedBridges.length,
        selected_bridges_count: optimalSelection.selectedBridges.length,
        total_vacation_days_used: optimalSelection.totalVacationUsed,
        total_days_off: optimalSelection.totalDaysOff,
        unused_vacation_days: optimalSelection.unusedVacationDays,
        average_efficiency: optimalSelection.averageEfficiency,
        optimization_score: optimalSelection.optimizationScore
      };

      // Add performance headers for monitoring
      reply.header('X-Calculation-Time-Ms', calculationTime.toFixed(2));
      reply.header('X-Cache-Hit-Rate', `${(performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) * 100).toFixed(1)}%`);
      reply.header('X-Bridge-Service-Version', '1.0.0');

      // Validate performance requirement (<100ms)
      if (calculationTime > 100) {
        fastify.log.warn({
          calculationTime,
          state,
          year,
          vacationBudget: vacation_days_budget
        }, 'Bridge calculation exceeded 100ms performance target');
      }

      // Send optimized response
      await reply.send({
        bridges: formattedBridges,
        optimization,
        recommendations: optimalSelection.recommendations,
        metadata: {
          state: state.toUpperCase(),
          year,
          language,
          calculation_time_ms: Math.round(calculationTime * 100) / 100,
          cache_hit: performanceMetrics.cacheHits > performanceMetrics.cacheMisses
        }
      });

    } catch (error: any) {
      const calculationTime = performance.now() - startTime;

      fastify.log.error({
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        request: {
          state,
          year,
          vacation_days_budget,
          constraints,
          language
        },
        performance: {
          calculation_time_ms: calculationTime
        }
      }, 'Bridge weekend calculation failed');

      // Return appropriate error based on error type
      if (error.message.includes('Invalid state code') || error.message.includes('Year must be')) {
        return reply.status(400).send({
          error: {
            message: language === 'de' ? 'Ungültige Eingabedaten' : 'Invalid input data',
            details: error.message,
            statusCode: 400,
            code: 'VALIDATION_ERROR'
          }
        });
      }

      // Generic server error
      return reply.status(500).send({
        error: {
          message: language === 'de'
            ? 'Fehler bei der Brückentage-Berechnung'
            : 'Bridge weekend calculation failed',
          statusCode: 500
        }
      });
    }
  });

  // GET /v1/bridge-weekends/:state/:year - Get all available bridge weekends (fast cached retrieval)
  await fastify.get('/:state/:year', {
    schema: {
      description: 'Get all available bridge weekends for state and year (cached for performance)',
      summary: 'Fast cached bridge weekend retrieval',
      tags: ['bridge-weekends', 'cache'],
      params: Type.Object({
        state: Type.String({
          pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$',
          description: 'German state code'
        }),
        year: Type.String({
          pattern: '^(2025|2026)$',
          description: 'Calculation year'
        })
      }),
      querystring: Type.Object({
        language: Type.Optional(Type.String({
          enum: ['de', 'en'],
          default: 'de',
          description: 'Response language preference'
        })),
        efficiency_threshold: Type.Optional(Type.Number({
          minimum: 1.0,
          maximum: 10.0,
          default: 2.0,
          description: 'Minimum efficiency filter'
        }))
      }),
      response: {
        200: Type.Object({
          bridges: Type.Array(Type.Object({
            id: Type.String(),
            holiday_id: Type.String(),
            holiday_name: Type.String(),
            state_code: Type.String(),
            start_date: Type.String({ format: 'date' }),
            end_date: Type.String({ format: 'date' }),
            vacation_days_needed: Type.Number(),
            total_days_off: Type.Number(),
            efficiency: Type.Number(),
            pattern: Type.String()
          })),
          metadata: Type.Object({
            total_bridges: Type.Number(),
            average_efficiency: Type.Number(),
            state: Type.String(),
            year: Type.Number(),
            language: Type.String(),
            cached: Type.Boolean(),
            calculation_time_ms: Type.Number()
          })
        })
      }
    }
  }, async (request, reply) => {
    const startTime = performance.now();
    const { state, year: yearStr } = request.params as any;
    const { language = 'de', efficiency_threshold = 2.0 } = request.query as any;
    const year = parseInt(yearStr, 10);

    try {
      // Calculate all available bridges using the service
      const allBridges = await bridgeCalculatorService.calculateBridgeWeekends(
        state.toUpperCase(),
        year,
        {
          efficiencyThreshold: efficiency_threshold,
          includeReligiousHolidays: true,
          preferLongWeekends: true,
          maxVacationDays: 30 // Show all possibilities
        }
      );

      const calculationTime = performance.now() - startTime;
      const performanceMetrics = bridgeCalculatorService.getPerformanceMetrics();

      // Format bridges for response
      const formattedBridges = allBridges.map(bridge => ({
        id: bridge.id,
        holiday_id: bridge.holiday_id,
        holiday_name: bridge.holiday_id, // Will be enhanced with actual names
        state_code: bridge.state_code,
        start_date: bridge.start_date,
        end_date: bridge.end_date,
        vacation_days_needed: bridge.vacation_days_needed,
        total_days_off: bridge.total_days_off,
        efficiency: bridge.efficiency,
        pattern: bridge.pattern
      }));

      const averageEfficiency = formattedBridges.length > 0
        ? formattedBridges.reduce((sum, bridge) => sum + bridge.efficiency, 0) / formattedBridges.length
        : 0;

      // Add performance headers
      reply.header('X-Calculation-Time-Ms', calculationTime.toFixed(2));
      reply.header('X-Total-Bridges', formattedBridges.length.toString());
      reply.header('X-Cache-Hit', performanceMetrics.cacheHits > 0 ? 'true' : 'false');

      await reply.send({
        bridges: formattedBridges,
        metadata: {
          total_bridges: formattedBridges.length,
          average_efficiency: Math.round(averageEfficiency * 100) / 100,
          state: state.toUpperCase(),
          year,
          language,
          cached: performanceMetrics.cacheHits > performanceMetrics.cacheMisses,
          calculation_time_ms: Math.round(calculationTime * 100) / 100
        }
      });

    } catch (error: any) {
      const calculationTime = performance.now() - startTime;

      fastify.log.error({
        error: error.message,
        state,
        year,
        language,
        calculation_time_ms: calculationTime
      }, 'Failed to retrieve bridge weekends');

      return reply.status(500).send({
        error: {
          message: language === 'de'
            ? 'Fehler beim Abrufen der Brückentage'
            : 'Failed to retrieve bridge weekends',
          statusCode: 500
        }
      });
    }
  });

  // Cleanup resources on plugin close
  fastify.addHook('onClose', async () => {
    await bridgeCalculatorService.close();
  });
};

export default bridgeWeekendsRoutes;