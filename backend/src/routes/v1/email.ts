import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

/**
 * Email Delivery API routes
 * Handles sending calendar exports via email
 */
const emailRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Send email schema
  const sendEmailSchema = Type.Object({
    planId: Type.String({ pattern: '^plan_[0-9]+_[a-zA-Z0-9]+$' }),
    email: Type.String({ format: 'email' }),
    language: Type.String({ enum: ['de', 'en'], default: 'de' }),
    includeIcs: Type.Optional(Type.Boolean({ default: true })),
    includeInstructions: Type.Optional(Type.Boolean({ default: true })),
    gdprConsent: Type.Boolean({ description: 'Required for email processing' })
  });

  // Email response schema
  const emailResponseSchema = Type.Object({
    success: Type.Boolean(),
    messageId: Type.String(),
    deliveryTime: Type.String({ format: 'date-time' }),
    recipient: Type.String({ format: 'email' }),
    attachments: Type.Array(Type.Object({
      filename: Type.String(),
      contentType: Type.String(),
      size: Type.Number()
    }))
  });

  // POST /v1/email/send - Send vacation plan via email
  await fastify.post('/send', {
    schema: {
      description: 'Send vacation plan calendar via email',
      tags: ['email'],
      body: sendEmailSchema,
      response: {
        200: emailResponseSchema,
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
        }
      }
    }
  }, async (request, reply) => {
    const {
      planId,
      email,
      language = 'de',
      includeIcs = true,
      includeInstructions = true,
      gdprConsent
    } = request.body as any;

    try {
      // Validate GDPR consent
      if (!gdprConsent) {
        throw { statusCode: 400, message: 'GDPR consent is required for email processing' };
      }

      // TODO: Implement email service
      // const result = await fastify.emailService.sendVacationPlan({
      //   planId,
      //   email,
      //   language,
      //   includeIcs,
      //   includeInstructions
      // });

      // Mock email sending response
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deliveryTime = new Date();

      const emailResponse = {
        success: true,
        messageId,
        deliveryTime: deliveryTime.toISOString(),
        recipient: email,
        attachments: includeIcs ? [
          {
            filename: `timebutler-calendar-${planId.split('_')[1]}.ics`,
            contentType: 'text/calendar',
            size: 2048 // mock size
          }
        ] : []
      };

      // Log successful email delivery
      fastify.log.info({
        planId,
        email: email.replace(/(.{3}).*@/, '$1***@'), // Mask email for privacy
        messageId,
        language
      }, 'Email sent successfully');

      await reply.send(emailResponse);

    } catch (error) {
      fastify.log.error({ error, planId, email: email?.replace(/(.{3}).*@/, '$1***@') }, 'Failed to send email');

      if ((error as any).code === 'PLAN_NOT_FOUND') {
        throw { statusCode: 404, message: 'Vacation plan not found' };
      }

      if ((error as any).statusCode) {
        throw error;
      }

      throw new Error('Failed to send email');
    }
  });

  // POST /v1/email/preview - Preview email content
  await fastify.post('/preview', {
    schema: {
      description: 'Preview email content without sending',
      tags: ['email'],
      body: Type.Object({
        planId: Type.String({ pattern: '^plan_[0-9]+_[a-zA-Z0-9]+$' }),
        language: Type.String({ enum: ['de', 'en'], default: 'de' }),
        includeInstructions: Type.Optional(Type.Boolean({ default: true }))
      }),
      response: {
        200: Type.Object({
          subject: Type.String(),
          htmlContent: Type.String(),
          textContent: Type.String(),
          attachments: Type.Array(Type.Object({
            filename: Type.String(),
            contentType: Type.String()
          }))
        })
      }
    }
  }, async (request, reply) => {
    const { planId, language = 'de', includeInstructions = true } = request.body as any;

    try {
      // TODO: Implement email preview service
      // const preview = await fastify.emailService.previewEmail({
      //   planId,
      //   language,
      //   includeInstructions
      // });

      // Mock email preview
      const isGerman = language === 'de';
      const preview = {
        subject: isGerman
          ? 'Ihr optimierter Urlaubskalender von TimeButler'
          : 'Your optimized vacation calendar from TimeButler',
        htmlContent: `
          <html>
            <body>
              <h1>${isGerman ? 'Ihr Brückenwochenenden-Kalender' : 'Your Bridge Weekend Calendar'}</h1>
              <p>${isGerman
                ? 'Vielen Dank für die Nutzung des TimeButler Kalender-Tools!'
                : 'Thank you for using the TimeButler Calendar tool!'
              }</p>
              <p>${isGerman
                ? 'Im Anhang finden Sie Ihren personalisierten Urlaubskalender mit optimierten Brückenwochenenden.'
                : 'Please find attached your personalized vacation calendar with optimized bridge weekends.'
              }</p>
            </body>
          </html>
        `,
        textContent: isGerman
          ? 'Ihr optimierter Urlaubskalender von TimeButler\n\nVielen Dank für die Nutzung unseres Tools!'
          : 'Your optimized vacation calendar from TimeButler\n\nThank you for using our tool!',
        attachments: [
          {
            filename: `timebutler-calendar-${planId.split('_')[1]}.ics`,
            contentType: 'text/calendar'
          }
        ]
      };

      await reply.send(preview);

    } catch (error) {
      fastify.log.error({ error, planId }, 'Failed to generate email preview');
      throw error;
    }
  });

  // GET /v1/email/status/:messageId - Check email delivery status
  await fastify.get('/status/:messageId', {
    schema: {
      description: 'Check email delivery status',
      tags: ['email'],
      params: Type.Object({
        messageId: Type.String({ pattern: '^msg_[0-9]+_[a-zA-Z0-9]+$' })
      }),
      response: {
        200: Type.Object({
          messageId: Type.String(),
          status: Type.String({ enum: ['sent', 'delivered', 'bounced', 'failed', 'pending'] }),
          deliveredAt: Type.Optional(Type.String({ format: 'date-time' })),
          bouncedAt: Type.Optional(Type.String({ format: 'date-time' })),
          failedAt: Type.Optional(Type.String({ format: 'date-time' })),
          error: Type.Optional(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    const { messageId } = request.params as any;

    try {
      // TODO: Implement email status tracking
      // const status = await fastify.emailService.getDeliveryStatus(messageId);

      // Mock status response
      const status = {
        messageId,
        status: 'delivered' as const,
        deliveredAt: new Date().toISOString()
      };

      await reply.send(status);

    } catch (error) {
      fastify.log.error({ error, messageId }, 'Failed to get email status');
      throw error;
    }
  });
};

export default emailRoutes;