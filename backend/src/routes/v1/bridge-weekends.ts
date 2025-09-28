import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

/**
 * Bridge Weekend API routes
 * POST /v1/bridge-weekends - Calculate optimal bridge weekends
 */
const bridgeWeekendsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Bridge weekend calculation request schema
  const bridgeWeekendRequestSchema = Type.Object({
    state: Type.String({
      pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$',
      description: 'German state code'
    }),
    year: Type.Number({
      minimum: 2025,
      maximum: 2030,
      description: 'Year for calculation'
    }),
    vacationDaysBudget: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 30,
      default: 20,
      description: 'Available vacation days'
    })),
    preferences: Type.Optional(Type.Object({
      minDaysOff: Type.Optional(Type.Number({ minimum: 3, maximum: 10, default: 4 })),
      maxVacationDays: Type.Optional(Type.Number({ minimum: 1, maximum: 4, default: 2 })),
      includeWeekends: Type.Optional(Type.Boolean({ default: true }))
    }))
  });

  // Bridge weekend response schema
  const bridgeWeekendResponseSchema = Type.Object({
    bridgeWeekends: Type.Array(Type.Object({
      id: Type.String(),
      holidayId: Type.String(),
      holidayName: Type.String(),
      startDate: Type.String({ format: 'date' }),
      endDate: Type.String({ format: 'date' }),
      vacationDaysNeeded: Type.Number(),
      totalDaysOff: Type.Number(),
      efficiency: Type.Number({ description: 'Days off per vacation day ratio' }),
      pattern: Type.String({ enum: ['thursday-friday', 'monday-tuesday', 'sandwich'] })
    })),
    summary: Type.Object({
      totalBridgeWeekends: Type.Number(),
      totalVacationDaysNeeded: Type.Number(),
      totalDaysOff: Type.Number(),
      averageEfficiency: Type.Number()
    }),
    state: Type.String(),
    year: Type.Number()
  });

  // POST /v1/bridge-weekends - Calculate bridge weekends
  await fastify.post('/', {
    schema: {
      description: 'Calculate optimal bridge weekends for German holidays',
      tags: ['bridge-weekends'],
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
                statusCode: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { state, year, vacationDaysBudget = 20, preferences = {} } = request.body as any;

    try {
      // TODO: Implement bridge weekend calculation service
      // const bridgeWeekends = await fastify.bridgeWeekendService.calculate({
      //   state,
      //   year,
      //   vacationDaysBudget,
      //   preferences
      // });

      // Mock response for now
      const bridgeWeekends = [
        {
          id: 'bridge-neujahr-2025',
          holidayId: 'neujahr-2025',
          holidayName: 'Neujahr',
          startDate: '2025-01-01',
          endDate: '2025-01-03',
          vacationDaysNeeded: 2,
          totalDaysOff: 5, // Wed-Sun (holiday + 2 vacation + weekend)
          efficiency: 2.5,
          pattern: 'thursday-friday' as const
        }
      ];

      const summary = {
        totalBridgeWeekends: bridgeWeekends.length,
        totalVacationDaysNeeded: bridgeWeekends.reduce((sum, b) => sum + b.vacationDaysNeeded, 0),
        totalDaysOff: bridgeWeekends.reduce((sum, b) => sum + b.totalDaysOff, 0),
        averageEfficiency: bridgeWeekends.reduce((sum, b) => sum + b.efficiency, 0) / bridgeWeekends.length
      };

      await reply.send({
        bridgeWeekends,
        summary,
        state,
        year
      });

    } catch (error) {
      fastify.log.error({ error, state, year }, 'Failed to calculate bridge weekends');
      throw new Error('Failed to calculate bridge weekends');
    }
  });

  // GET /v1/bridge-weekends/:state/:year - Get pre-calculated bridge weekends
  await fastify.get('/:state/:year', {
    schema: {
      description: 'Get pre-calculated bridge weekends for state and year',
      tags: ['bridge-weekends'],
      params: Type.Object({
        state: Type.String({ pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$' }),
        year: Type.String({ pattern: '^(2025|2026|2027|2028|2029|2030)$' })
      }),
      response: {
        200: bridgeWeekendResponseSchema
      }
    }
  }, async (request, reply) => {
    const { state, year: yearStr } = request.params as any;
    const year = parseInt(yearStr, 10);

    // TODO: Implement cached bridge weekend retrieval
    // This would be much faster than calculating on demand

    // Mock response
    const bridgeWeekends = [
      {
        id: `bridge-neujahr-${year}`,
        holidayId: `neujahr-${year}`,
        holidayName: 'Neujahr',
        startDate: `${year}-01-01`,
        endDate: `${year}-01-03`,
        vacationDaysNeeded: 2,
        totalDaysOff: 5,
        efficiency: 2.5,
        pattern: 'thursday-friday' as const
      }
    ];

    const summary = {
      totalBridgeWeekends: bridgeWeekends.length,
      totalVacationDaysNeeded: bridgeWeekends.reduce((sum, b) => sum + b.vacationDaysNeeded, 0),
      totalDaysOff: bridgeWeekends.reduce((sum, b) => sum + b.totalDaysOff, 0),
      averageEfficiency: bridgeWeekends.reduce((sum, b) => sum + b.efficiency, 0) / bridgeWeekends.length
    };

    await reply.send({
      bridgeWeekends,
      summary,
      state,
      year
    });
  });
};

export default bridgeWeekendsRoutes;