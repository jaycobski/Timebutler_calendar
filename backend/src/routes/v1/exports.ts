import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { CalendarExport, CalendarFormat } from '../../models/CalendarExport';
import { CalendarService } from '../../services/CalendarService';
import { VacationPlanService } from '../../services/VacationPlanService';
import {
  ValidationError,
  DataRetentionError,
  SessionError
} from '../../lib/errors';

/**
 * Calendar Export API routes
 * Handles .ics file generation and download with signed URL validation
 *
 * Constitutional Requirements:
 * - RFC 5545 iCalendar compliance
 * - Signed URL security with 30-day expiration
 * - GDPR data retention policies
 * - Performance <100ms for calendar generation
 * - Cross-platform compatibility (Google, Outlook, Apple)
 */
const exportsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Initialize services
  const calendarService = new CalendarService();
  const vacationPlanService = new VacationPlanService(fastify);
  // GET /v1/exports/:id - Download calendar export with signed URL validation
  await fastify.get('/:id', {
    schema: {
      description: 'Download calendar export as RFC 5545 compliant .ics file with signed URL security',
      tags: ['exports'],
      params: Type.Object({
        id: Type.String({
          pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$',
          description: 'UUID format vacation plan ID'
        })
      }),
      querystring: Type.Object({
        format: Type.Optional(Type.String({
          enum: ['ical', 'google', 'outlook', 'apple'],
          default: 'ical',
          description: 'Calendar platform format optimization'
        })),
        lang: Type.Optional(Type.String({
          enum: ['de', 'en'],
          default: 'de',
          description: 'Language preference for calendar content'
        })),
        download: Type.Optional(Type.Boolean({
          default: true,
          description: 'Force download vs inline display'
        })),
        expires: Type.Optional(Type.Number({
          description: 'Unix timestamp for signed URL expiration'
        })),
        signature: Type.Optional(Type.String({
          description: 'HMAC signature for URL security verification'
        }))
      }),
      response: {
        200: {
          type: 'string',
          description: 'RFC 5545 compliant iCalendar file content'
        },
        404: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
                code: { type: 'string' }
              }
            }
          }
        },
        403: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
                code: { type: 'string' }
              }
            }
          }
        },
        410: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
                code: { type: 'string' },
                expiresAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now();
    const { id: planId } = request.params as { id: string };
    const {
      format = 'ical',
      lang = 'de',
      download = true,
      expires,
      signature
    } = request.query as {
      format?: CalendarFormat;
      lang?: 'de' | 'en';
      download?: boolean;
      expires?: number;
      signature?: string;
    };

    try {
      // Step 1: Validate signed URL if signature parameters are provided
      if (expires && signature) {
        const isValidSignature = CalendarExport.verifySignature(
          planId,
          expires,
          signature,
          format
        );

        if (!isValidSignature) {
          fastify.log.warn({
            planId,
            expires,
            signature: signature.substring(0, 8) + '...',
            clientIp: request.ip
          }, 'Invalid signed URL signature detected');

          throw {
            statusCode: 403,
            code: 'INVALID_SIGNATURE',
            message: lang === 'de'
              ? 'Ungültige URL-Signatur. Der Download-Link ist möglicherweise abgelaufen oder manipuliert.'
              : 'Invalid URL signature. The download link may be expired or tampered with.'
          };
        }
      }

      // Step 2: Retrieve vacation plan data
      let vacationPlanResponse;
      try {
        vacationPlanResponse = await vacationPlanService.getVacationPlan(planId);
      } catch (error: any) {
        if (error.code === 'PLAN_NOT_FOUND') {
          throw {
            statusCode: 404,
            code: 'EXPORT_NOT_FOUND',
            message: lang === 'de'
              ? 'Kalenderexport nicht gefunden. Der Link ist möglicherweise abgelaufen.'
              : 'Calendar export not found. The link may have expired.'
          };
        }
        throw error;
      }

      // Step 3: Check data retention policy (30-day export expiration)
      const now = new Date();
      const createdAt = new Date(vacationPlanResponse.createdAt);
      const exportExpiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      if (now > exportExpiresAt) {
        throw {
          statusCode: 410,
          code: 'EXPORT_EXPIRED',
          message: lang === 'de'
            ? 'Kalenderexport abgelaufen. Exportlinks sind 30 Tage gültig.'
            : 'Calendar export expired. Export links are valid for 30 days.',
          expiresAt: exportExpiresAt.toISOString()
        };
      }

      // Step 4: Generate calendar content using CalendarService
      const calendarExport = await calendarService.generateCalendar(planId);

      // Step 5: Platform-specific formatting
      let calendarContent = calendarExport.generateCalendarContent();
      if (format !== 'ical') {
        calendarContent = calendarService.formatForPlatform(calendarContent, format);
      }

      // Step 6: Validate RFC 5545 compliance
      const validation = calendarService.validateRFC5545(calendarContent);
      if (!validation.valid) {
        fastify.log.error({
          planId,
          format,
          validationErrors: validation.errors
        }, 'Generated calendar failed RFC 5545 validation');

        throw new ValidationError(
          'Generated calendar content is not RFC 5545 compliant',
          'INVALID_CALENDAR_FORMAT',
          'calendar_content'
        );
      }

      // Step 7: Record download analytics (GDPR compliant)
      const userAgent = request.headers['user-agent'] || 'unknown';
      const clientIp = request.ip || 'unknown';

      try {
        calendarExport.recordDownload(userAgent, clientIp);
      } catch (analyticsError) {
        // Log but don't fail the request if analytics recording fails
        fastify.log.warn({ analyticsError, planId }, 'Failed to record download analytics');
      }

      // Step 8: Set response headers
      const filename = calendarExport.getFilename();
      const contentType = calendarExport.getContentType();
      const fileSize = Buffer.byteLength(calendarContent, 'utf8');

      // Security headers
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('Content-Security-Policy', "default-src 'none'");

      // Performance headers
      reply.header('Content-Length', fileSize.toString());
      reply.header('X-Calendar-Format', format);
      reply.header('X-Calendar-Language', lang);
      reply.header('X-TimeButler-Version', '1.0.0');

      // Caching headers (30 days for immutable calendar exports)
      reply.header('Cache-Control', 'private, max-age=2592000, immutable'); // 30 days
      reply.header('ETag', `"${calendarExport.id}"`);
      reply.header('Last-Modified', createdAt.toUTCString());

      if (download) {
        reply
          .header('Content-Type', contentType)
          .header('Content-Disposition', `attachment; filename="${filename}"`);
      } else {
        reply
          .header('Content-Type', contentType)
          .header('Content-Disposition', `inline; filename="${filename}"`);
      }

      // Step 9: Performance monitoring
      const responseTime = Date.now() - startTime;

      // Log slow responses (Constitutional requirement: <100ms)
      if (responseTime > 100) {
        fastify.log.warn({
          planId,
          format,
          responseTime,
          fileSize,
          eventCount: vacationPlanResponse.bridgeWeekends.length
        }, 'Slow calendar export generation detected');
      }

      fastify.log.info({
        planId,
        format,
        lang,
        fileSize,
        responseTime,
        userAgent: userAgent.substring(0, 50),
        clientIp: clientIp.substring(0, 10) + '...'
      }, 'Calendar export downloaded successfully');

      // Step 10: Send calendar content
      await reply.send(calendarContent);

    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      fastify.log.error({
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode
        },
        planId,
        format,
        lang,
        responseTime,
        clientIp: request.ip
      }, 'Failed to generate calendar export');

      // Handle specific error types
      if (error instanceof DataRetentionError) {
        throw {
          statusCode: 410,
          code: 'DATA_RETENTION_EXPIRED',
          message: error.message,
          expiresAt: error.expirationDate.toISOString()
        };
      }

      if (error instanceof SessionError) {
        throw {
          statusCode: 404,
          code: error.code,
          message: error.message
        };
      }

      if (error instanceof ValidationError) {
        throw {
          statusCode: 400,
          code: error.code,
          message: error.message
        };
      }

      // Handle pre-formatted errors
      if (error.statusCode) {
        throw error;
      }

      // Generic server error
      throw {
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: lang === 'de'
          ? 'Interner Serverfehler bei der Kalendergenerierung'
          : 'Internal server error during calendar generation'
      };
    }
  });

  // POST /v1/exports/:id/regenerate - Regenerate expired export
  await fastify.post('/:id/regenerate', {
    schema: {
      description: 'Regenerate expired calendar export',
      tags: ['exports'],
      params: Type.Object({
        id: Type.String({ pattern: '^plan_[0-9]+_[a-zA-Z0-9]+$' })
      }),
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        lang: Type.Optional(Type.String({ enum: ['de', 'en'], default: 'de' }))
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
          exportUrl: Type.String({ format: 'uri' }),
          expiresAt: Type.String({ format: 'date-time' })
        }),
        404: {
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
    const { id } = request.params as any;
    const { email, lang = 'de' } = request.body as any;

    try {
      // TODO: Implement export regeneration
      // await fastify.calendarExportService.regenerate(id, email, lang);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await reply.send({
        message: lang === 'de'
          ? 'Kalenderexport wurde erneuert und per E-Mail gesendet'
          : 'Calendar export has been renewed and sent via email',
        exportUrl: `${request.protocol}://${request.hostname}/v1/exports/${id}`,
        expiresAt: expiresAt.toISOString()
      });

    } catch (error) {
      fastify.log.error({ error, planId: id, email }, 'Failed to regenerate export');

      if ((error as any).code === 'PLAN_NOT_FOUND') {
        throw { statusCode: 404, message: 'Vacation plan not found' };
      }

      throw error;
    }
  });

  // GET /v1/exports/:id/preview - Preview calendar content
  await fastify.get('/:id/preview', {
    schema: {
      description: 'Preview calendar export without downloading',
      tags: ['exports'],
      params: Type.Object({
        id: Type.String({ pattern: '^plan_[0-9]+_[a-zA-Z0-9]+$' })
      }),
      querystring: Type.Object({
        lang: Type.Optional(Type.String({ enum: ['de', 'en'], default: 'de' }))
      }),
      response: {
        200: Type.Object({
          events: Type.Array(Type.Object({
            title: Type.String(),
            startDate: Type.String({ format: 'date' }),
            endDate: Type.String({ format: 'date' }),
            description: Type.String(),
            vacationDays: Type.Number(),
            totalDaysOff: Type.Number()
          })),
          summary: Type.Object({
            totalEvents: Type.Number(),
            totalVacationDays: Type.Number(),
            totalDaysOff: Type.Number()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { lang = 'de' } = request.query as any;

    try {
      // TODO: Implement preview service
      // const preview = await fastify.calendarExportService.preview(id, lang);

      // Mock preview
      const events = [
        {
          title: lang === 'de' ? 'Brückenwochenende Neujahr' : 'New Year Bridge Weekend',
          startDate: '2025-01-01',
          endDate: '2025-01-03',
          description: lang === 'de'
            ? '2 Urlaubstage für 5 freie Tage'
            : '2 vacation days for 5 days off',
          vacationDays: 2,
          totalDaysOff: 5
        }
      ];

      const summary = {
        totalEvents: events.length,
        totalVacationDays: events.reduce((sum, e) => sum + e.vacationDays, 0),
        totalDaysOff: events.reduce((sum, e) => sum + e.totalDaysOff, 0)
      };

      await reply.send({ events, summary });

    } catch (error) {
      fastify.log.error({ error, planId: id }, 'Failed to generate preview');
      throw error;
    }
  });
};

export default exportsRoutes;