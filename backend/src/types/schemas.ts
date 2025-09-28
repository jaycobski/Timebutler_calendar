/**
 * Shared TypeBox schema definitions for API validation
 * Performance-optimized schema compilation
 */

import { Type } from '@sinclair/typebox';

// Common German state validation
export const GermanStateSchema = Type.String({
  pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$',
  description: 'German state code (Bundesland)'
});

// Year validation for supported range
export const YearSchema = Type.Number({
  minimum: 2025,
  maximum: 2030,
  description: 'Year in supported range (2025-2030)'
});

// Language validation
export const LanguageSchema = Type.String({
  enum: ['de', 'en'],
  default: 'de',
  description: 'Language code'
});

// Email validation
export const EmailSchema = Type.String({
  format: 'email',
  description: 'Valid email address'
});

// Date validation
export const DateSchema = Type.String({
  format: 'date',
  description: 'ISO date format (YYYY-MM-DD)'
});

// Plan ID validation
export const PlanIdSchema = Type.String({
  pattern: '^plan_[0-9]+_[a-zA-Z0-9]+$',
  description: 'Vacation plan ID format'
});

// Holiday schema
export const HolidaySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  date: DateSchema,
  type: Type.String({ enum: ['federal', 'state', 'regional'] }),
  description: Type.Optional(Type.String()),
  religious: Type.Boolean()
});

// Bridge weekend schema
export const BridgeWeekendSchema = Type.Object({
  id: Type.String(),
  holidayId: Type.String(),
  holidayName: Type.String(),
  startDate: DateSchema,
  endDate: DateSchema,
  vacationDaysNeeded: Type.Number({ minimum: 1, maximum: 4 }),
  totalDaysOff: Type.Number({ minimum: 3 }),
  efficiency: Type.Number({ minimum: 1 }),
  pattern: Type.String({ enum: ['thursday-friday', 'monday-tuesday', 'sandwich'] })
});

// Error response schema
export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    message: Type.String(),
    statusCode: Type.Number(),
    errorId: Type.Optional(Type.String()),
    validationErrors: Type.Optional(Type.Array(Type.String()))
  })
});

// Success response wrapper
export const SuccessResponseSchema = <T>(data: T) => Type.Object({
  success: Type.Boolean({ default: true }),
  data,
  timestamp: Type.String({ format: 'date-time' })
});

// Pagination schema
export const PaginationSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Number({ minimum: 0, default: 0 }))
});

// Paginated response schema
export const PaginatedResponseSchema = <T>(items: T) => Type.Object({
  items,
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    pages: Type.Number()
  })
});

export default {
  GermanStateSchema,
  YearSchema,
  LanguageSchema,
  EmailSchema,
  DateSchema,
  PlanIdSchema,
  HolidaySchema,
  BridgeWeekendSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
  PaginationSchema,
  PaginatedResponseSchema
};