import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

/**
 * Vacation Plan API routes
 * Stateless session management for vacation planning
 */
const vacationPlansRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Create vacation plan request schema
  const createVacationPlanSchema = Type.Object({
    bridgeWeekendIds: Type.Array(Type.String(), {
      minItems: 1,
      maxItems: 10,
      description: 'Selected bridge weekend IDs'
    }),
    userPreferences: Type.Object({
      email: Type.String({ format: 'email' }),
      language: Type.String({ enum: ['de', 'en'], default: 'de' }),
      calendarFormat: Type.Optional(Type.String({ enum: ['ics', 'google', 'outlook'], default: 'ics' })),
      gdprConsent: Type.Boolean({ description: 'GDPR consent for email processing' }),
      marketingConsent: Type.Optional(Type.Boolean({ default: false }))
    }),
    metadata: Type.Optional(Type.Object({
      state: Type.String(),
      year: Type.Number(),
      totalVacationDays: Type.Number(),
      userAgent: Type.Optional(Type.String()),
      referrer: Type.Optional(Type.String())
    }))
  });

  // Vacation plan response schema
  const vacationPlanResponseSchema = Type.Object({
    id: Type.String({ description: 'Unique plan ID' }),
    bridgeWeekends: Type.Array(Type.Object({
      id: Type.String(),
      holidayName: Type.String(),
      startDate: Type.String({ format: 'date' }),
      endDate: Type.String({ format: 'date' }),
      vacationDaysNeeded: Type.Number(),
      totalDaysOff: Type.Number()
    })),
    summary: Type.Object({
      totalVacationDays: Type.Number(),
      totalDaysOff: Type.Number(),
      efficiency: Type.Number()
    }),
    exportUrl: Type.String({ format: 'uri' }),
    expiresAt: Type.String({ format: 'date-time' }),
    createdAt: Type.String({ format: 'date-time' })
  });

  // POST /v1/vacation-plans - Create vacation plan
  await fastify.post('/', {
    schema: {
      description: 'Create a vacation plan with selected bridge weekends',
      tags: ['vacation-plans'],
      body: createVacationPlanSchema,
      response: {
        201: vacationPlanResponseSchema,
        400: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
                validationErrors: Type.Optional(Type.Array(Type.String()))
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { bridgeWeekendIds, userPreferences, metadata } = request.body as any;

    try {
      // Get client IP for GDPR audit trail
      const clientIp = request.headers['x-forwarded-for'] as string ||
                       request.headers['x-real-ip'] as string ||
                       request.connection?.remoteAddress ||
                       request.ip;

      // Create vacation plan using service
      const vacationPlan = await fastify.vacationPlanService.createVacationPlan({
        bridgeWeekendIds,
        userPreferences,
        metadata: {
          ...metadata,
          userAgent: request.headers['user-agent'],
          referrer: request.headers['referer'],
          ipAddress: clientIp
        }
      }, clientIp);

      await reply.status(201).send(vacationPlan);

    } catch (error) {
      fastify.log.error({ error, bridgeWeekendIds }, 'Failed to create vacation plan');

      // Handle specific error types for better user experience
      if (error.name === 'ValidationError') {
        const statusCode = error.statusCode || 400;
        await reply.status(statusCode).send({
          error: {
            message: error.message,
            statusCode,
            field: error.field,
            validationErrors: [error.message]
          }
        });
        return;
      }

      if (error.name === 'GDPRViolationError') {
        await reply.status(400).send({
          error: {
            message: error.message,
            statusCode: 400,
            gdprViolation: true,
            article: error.article,
            severity: error.severity,
            validationErrors: [error.message]
          }
        });
        return;
      }

      throw error;
    }
  });

  // GET /v1/vacation-plans/:id - Get vacation plan
  await fastify.get('/:id', {
    schema: {
      description: 'Get vacation plan by ID',
      tags: ['vacation-plans'],
      params: Type.Object({
        id: Type.String({ pattern: '^plan_[0-9]+_[a-zA-Z0-9]+$' })
      }),
      response: {
        200: vacationPlanResponseSchema,
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

    try {
      // Get vacation plan using service
      const vacationPlan = await fastify.vacationPlanService.getVacationPlan(
        id,
        request.sessionId || undefined
      );

      await reply.send(vacationPlan);

    } catch (error) {
      fastify.log.error({ error, planId: id }, 'Failed to get vacation plan');

      // Handle specific error types
      if (error.name === 'SessionError' && error.code === 'PLAN_NOT_FOUND') {
        await reply.status(404).send({
          error: {
            message: 'Vacation plan not found',
            statusCode: 404
          }
        });
        return;
      }

      if (error.name === 'DataRetentionError') {
        await reply.status(410).send({
          error: {
            message: 'Vacation plan has expired and been deleted per GDPR retention policy',
            statusCode: 410,
            gdprCompliant: true
          }
        });
        return;
      }

      throw error;
    }
  });

  // POST /v1/vacation-plans/:id/email - Send vacation plan via email with GDPR consent
  await fastify.post('/:id/email', {
    schema: {
      description: 'Send vacation plan calendar via email with GDPR consent validation and template delivery',
      tags: ['vacation-plans'],
      params: Type.Object({
        id: Type.String({ pattern: '^plan_[0-9]+_[a-zA-Z0-9]+$' })
      }),
      body: Type.Object({
        email: Type.String({ format: 'email', description: 'Recipient email address' }),
        language: Type.Optional(Type.String({ enum: ['de', 'en'], default: 'de', description: 'Email language preference' })),
        includeCalendar: Type.Optional(Type.Boolean({ default: true, description: 'Include .ics calendar attachment' })),
        includeInstructions: Type.Optional(Type.Boolean({ default: true, description: 'Include setup instructions' })),
        gdprConsent: Type.Boolean({ description: 'GDPR consent required for email processing' }),
        marketingConsent: Type.Optional(Type.Boolean({ default: false, description: 'Optional consent for TimeButler marketing' }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          messageId: Type.String({ description: 'Email delivery tracking ID' }),
          deliveryTime: Type.String({ format: 'date-time' }),
          recipient: Type.String({ format: 'email' }),
          language: Type.String({ enum: ['de', 'en'] }),
          attachments: Type.Array(Type.Object({
            filename: Type.String(),
            contentType: Type.String(),
            size: Type.Number()
          })),
          gdprCompliant: Type.Boolean(),
          estimatedDelivery: Type.String({ description: 'Estimated delivery time' })
        }),
        400: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
                field: Type.Optional(Type.String()),
                gdprViolation: Type.Optional(Type.Boolean()),
                validationErrors: Type.Optional(Type.Array(Type.String()))
              }
            }
          }
        },
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
        },
        429: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
                retryAfter: Type.Number()
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const {
      email,
      language = 'de',
      includeCalendar = true,
      includeInstructions = true,
      gdprConsent,
      marketingConsent = false
    } = request.body as any;

    try {
      // Get client IP for GDPR audit trail
      const clientIp = request.headers['x-forwarded-for'] as string ||
                       request.headers['x-real-ip'] as string ||
                       request.connection?.remoteAddress ||
                       request.ip;

      // Step 1: Validate GDPR consent
      if (!gdprConsent) {
        throw {
          statusCode: 400,
          name: 'GDPRViolationError',
          message: language === 'de'
            ? 'DSGVO-Einwilligung ist für E-Mail-Versand erforderlich'
            : 'GDPR consent is required for email delivery',
          field: 'gdprConsent',
          gdprViolation: true,
          article: 'Article 6(1)(a)',
          severity: 'critical'
        };
      }

      // Step 2: Retrieve vacation plan and validate access
      const vacationPlan = await fastify.vacationPlanService.getVacationPlan(
        id,
        request.sessionId || undefined
      );

      // Step 3: Validate email address format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw {
          statusCode: 400,
          name: 'ValidationError',
          message: language === 'de'
            ? 'Gültige E-Mail-Adresse ist erforderlich'
            : 'Valid email address is required',
          field: 'email'
        };
      }

      // Step 4: Check rate limiting (prevent abuse)
      const rateLimitKey = `email_rate_limit:${clientIp}:${id}`;
      const recentRequests = await fastify.redis.get(rateLimitKey);

      if (recentRequests && parseInt(recentRequests) >= 3) {
        throw {
          statusCode: 429,
          message: language === 'de'
            ? 'Zu viele E-Mail-Anfragen. Bitte versuchen Sie es in 5 Minuten erneut.'
            : 'Too many email requests. Please try again in 5 minutes.',
          retryAfter: 300 // 5 minutes
        };
      }

      // Step 5: Send email using EmailService
      const emailResult = await fastify.emailService.sendVacationPlan(
        id,
        email,
        language,
        includeCalendar ? `calendar_${id}` : undefined
      );

      // Step 6: Update rate limiting
      await fastify.redis.setex(rateLimitKey, 300, (parseInt(recentRequests || '0') + 1).toString());

      // Step 7: Create GDPR audit entry for email delivery
      const ipHash = clientIp ? require('crypto').createHash('sha256').update(clientIp + (process.env.HASH_SALT || 'default-salt')).digest('hex') : undefined;

      // For now, log the GDPR audit entry - in production this would be handled by a dedicated service
      fastify.log.info({
        timestamp: new Date().toISOString(),
        action: 'email_sent',
        planId: id,
        sessionId: request.sessionId || '',
        ipHash,
        userAgent: request.headers['user-agent'],
        dataProcessed: ['vacation_plan_data', 'email_address'],
        legalBasis: 'Article 6(1)(a) - Consent',
        purpose: marketingConsent ? 'vacation_planning,marketing_timebutler' : 'vacation_planning',
        consentId: `consent_${id}_${Date.now()}`
      }, 'GDPR audit: Email sent for vacation plan');

      // Step 8: Prepare successful response
      const response = {
        success: true,
        messageId: emailResult,
        deliveryTime: new Date().toISOString(),
        recipient: email,
        language: language,
        attachments: includeCalendar ? [
          {
            filename: `timebutler-calendar-${id.split('_')[1] || 'vacation'}.ics`,
            contentType: 'text/calendar',
            size: 2048 // Estimated size
          }
        ] : [],
        gdprCompliant: true,
        estimatedDelivery: language === 'de'
          ? 'Zustellung innerhalb von 5 Sekunden erwartet'
          : 'Delivery expected within 5 seconds'
      };

      fastify.log.info({
        planId: id,
        email: email.replace(/(.{3}).*@/, '$1***@'), // Mask email for privacy
        messageId: emailResult,
        language,
        includeCalendar,
        gdprConsent: true
      }, 'Vacation plan email sent successfully');

      await reply.send(response);

    } catch (error) {
      fastify.log.error({
        error,
        planId: id,
        email: email?.replace(/(.{3}).*@/, '$1***@'),
        language
      }, 'Failed to send vacation plan email');

      // Handle specific error types for better UX
      if (error.name === 'SessionError' && error.code === 'PLAN_NOT_FOUND') {
        await reply.status(404).send({
          error: {
            message: language === 'de'
              ? 'Urlaubsplan nicht gefunden oder abgelaufen'
              : 'Vacation plan not found or expired',
            statusCode: 404
          }
        });
        return;
      }

      if (error.name === 'DataRetentionError') {
        await reply.status(410).send({
          error: {
            message: language === 'de'
              ? 'Urlaubsplan ist abgelaufen und wurde gemäß DSGVO-Aufbewahrungsrichtlinie gelöscht'
              : 'Vacation plan has expired and been deleted per GDPR retention policy',
            statusCode: 410,
            gdprCompliant: true
          }
        });
        return;
      }

      if (error.name === 'GDPRViolationError' || error.gdprViolation) {
        await reply.status(400).send({
          error: {
            message: error.message,
            statusCode: 400,
            field: error.field,
            gdprViolation: true,
            validationErrors: [error.message]
          }
        });
        return;
      }

      if (error.name === 'ValidationError') {
        await reply.status(400).send({
          error: {
            message: error.message,
            statusCode: 400,
            field: error.field,
            validationErrors: [error.message]
          }
        });
        return;
      }

      if (error.statusCode === 429) {
        await reply.status(429).send({
          error: {
            message: error.message,
            statusCode: 429,
            retryAfter: error.retryAfter
          }
        });
        return;
      }

      // Generic error response
      await reply.status(500).send({
        error: {
          message: language === 'de'
            ? 'E-Mail-Versand fehlgeschlagen. Bitte versuchen Sie es erneut.'
            : 'Email delivery failed. Please try again.',
          statusCode: 500
        }
      });
    }
  });

  // DELETE /v1/vacation-plans/:id - Delete vacation plan (GDPR compliance)
  await fastify.delete('/:id', {
    schema: {
      description: 'Delete vacation plan (GDPR right to deletion)',
      tags: ['vacation-plans'],
      params: Type.Object({
        id: Type.String({ pattern: '^plan_[0-9]+_[a-zA-Z0-9]+$' })
      }),
      response: {
        204: Type.Null(),
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

    try {
      // Delete vacation plan using service (GDPR Article 17)
      await fastify.vacationPlanService.deleteVacationPlan(
        id,
        request.sessionId || undefined
      );

      await reply.status(204).send();

    } catch (error) {
      fastify.log.error({ error, planId: id }, 'Failed to delete vacation plan');

      if (error.name === 'SessionError' && error.code === 'PLAN_NOT_FOUND') {
        await reply.status(404).send({
          error: {
            message: 'Vacation plan not found',
            statusCode: 404
          }
        });
        return;
      }

      throw error;
    }
  });
};

export default vacationPlansRoutes;