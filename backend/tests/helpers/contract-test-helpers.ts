/**
 * Contract Test Helpers for Backend API Testing
 * Focus: API specification compliance, request/response validation
 * Ensures backend API matches frontend expectations and OpenAPI specification
 */

import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { faker } from '@faker-js/faker';

// Initialize AJV for schema validation
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * API Schema Definitions for Contract Testing
 * These schemas define the exact structure expected by the frontend
 */

// Holiday API Response Schema
export const HolidayResponseSchema: JSONSchemaType<{
  holidays: Array<{
    id: string;
    key: string;
    name_de: string;
    name_en: string;
    date: string;
    year: number;
    state: string;
    is_federal: boolean;
    type: string;
  }>;
  meta: {
    state: string;
    year: number;
    total_count: number;
    federal_count: number;
    state_count: number;
  };
}> = {
  type: 'object',
  properties: {
    holidays: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1 },
          key: { type: 'string', minLength: 1 },
          name_de: { type: 'string', minLength: 1 },
          name_en: { type: 'string', minLength: 1 },
          date: { type: 'string', format: 'date' },
          year: { type: 'number', minimum: 2025, maximum: 2026 },
          state: { type: 'string', pattern: '^(ALL|BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$' },
          is_federal: { type: 'boolean' },
          type: { type: 'string', enum: ['secular', 'religious', 'national'] }
        },
        required: ['id', 'key', 'name_de', 'name_en', 'date', 'year', 'state', 'is_federal', 'type'],
        additionalProperties: false
      }
    },
    meta: {
      type: 'object',
      properties: {
        state: { type: 'string', pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$' },
        year: { type: 'number', minimum: 2025, maximum: 2026 },
        total_count: { type: 'number', minimum: 0 },
        federal_count: { type: 'number', minimum: 9, maximum: 9 }, // Always 9 federal holidays
        state_count: { type: 'number', minimum: 0 }
      },
      required: ['state', 'year', 'total_count', 'federal_count', 'state_count'],
      additionalProperties: false
    }
  },
  required: ['holidays', 'meta'],
  additionalProperties: false
};

// Bridge Weekend Calculation Request Schema
export const BridgeWeekendRequestSchema: JSONSchemaType<{
  state: string;
  year: number;
  vacation_days: number;
  optimize_for: string;
  preferences?: {
    include_religious_holidays?: boolean;
    max_consecutive_vacation_days?: number;
    prefer_long_weekends?: boolean;
  };
}> = {
  type: 'object',
  properties: {
    state: { type: 'string', pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$' },
    year: { type: 'number', minimum: 2025, maximum: 2026 },
    vacation_days: { type: 'number', minimum: 1, maximum: 50 },
    optimize_for: { type: 'string', enum: ['efficiency', 'total_days_off', 'balanced'] },
    preferences: {
      type: 'object',
      properties: {
        include_religious_holidays: { type: 'boolean', nullable: true },
        max_consecutive_vacation_days: { type: 'number', minimum: 1, maximum: 14, nullable: true },
        prefer_long_weekends: { type: 'boolean', nullable: true }
      },
      additionalProperties: false,
      nullable: true
    }
  },
  required: ['state', 'year', 'vacation_days', 'optimize_for'],
  additionalProperties: false
};

// Bridge Weekend Response Schema
export const BridgeWeekendResponseSchema: JSONSchemaType<{
  bridge_weekends: Array<{
    id: string;
    holiday_id: string;
    start_date: string;
    end_date: string;
    vacation_days_needed: number;
    total_days_off: number;
    efficiency: number;
    pattern: string;
    quality_score: number;
    popularity_score: number;
  }>;
  optimization: {
    strategy: string;
    total_vacation_days_available: number;
    total_vacation_days_used: number;
    total_days_off_achieved: number;
    efficiency_rating: string;
  };
  session_id: string;
}> = {
  type: 'object',
  properties: {
    bridge_weekends: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1 },
          holiday_id: { type: 'string', minLength: 1 },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
          vacation_days_needed: { type: 'number', minimum: 1, maximum: 5 },
          total_days_off: { type: 'number', minimum: 3, maximum: 10 },
          efficiency: { type: 'number', minimum: 1.0, maximum: 10.0 },
          pattern: { type: 'string', enum: ['single-bridge', 'sandwich', 'extend-weekend', 'long-weekend'] },
          quality_score: { type: 'number', minimum: 0, maximum: 100 },
          popularity_score: { type: 'number', minimum: 0, maximum: 100 }
        },
        required: ['id', 'holiday_id', 'start_date', 'end_date', 'vacation_days_needed', 'total_days_off', 'efficiency', 'pattern', 'quality_score', 'popularity_score'],
        additionalProperties: false
      }
    },
    optimization: {
      type: 'object',
      properties: {
        strategy: { type: 'string', enum: ['efficiency', 'total_days_off', 'balanced'] },
        total_vacation_days_available: { type: 'number', minimum: 1 },
        total_vacation_days_used: { type: 'number', minimum: 0 },
        total_days_off_achieved: { type: 'number', minimum: 0 },
        efficiency_rating: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
      },
      required: ['strategy', 'total_vacation_days_available', 'total_vacation_days_used', 'total_days_off_achieved', 'efficiency_rating'],
      additionalProperties: false
    },
    session_id: { type: 'string', minLength: 1 }
  },
  required: ['bridge_weekends', 'optimization', 'session_id'],
  additionalProperties: false
};

// Vacation Plan Request Schema
export const VacationPlanRequestSchema: JSONSchemaType<{
  state: string;
  vacation_days: number;
  selected_bridges: number[];
  language: string;
  user_preferences?: {
    calendar_format?: string;
    timezone?: string;
    include_notes?: boolean;
  };
}> = {
  type: 'object',
  properties: {
    state: { type: 'string', pattern: '^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)$' },
    vacation_days: { type: 'number', minimum: 1, maximum: 50 },
    selected_bridges: {
      type: 'array',
      items: { type: 'number', minimum: 1 },
      minItems: 1,
      maxItems: 10
    },
    language: { type: 'string', enum: ['de', 'en'] },
    user_preferences: {
      type: 'object',
      properties: {
        calendar_format: { type: 'string', enum: ['ical', 'google', 'outlook'], nullable: true },
        timezone: { type: 'string', nullable: true },
        include_notes: { type: 'boolean', nullable: true }
      },
      additionalProperties: false,
      nullable: true
    }
  },
  required: ['state', 'vacation_days', 'selected_bridges', 'language'],
  additionalProperties: false
};

// Email Send Request Schema (GDPR compliant)
export const EmailSendRequestSchema: JSONSchemaType<{
  email: string;
  gdpr_consent: boolean;
  privacy_notice_version: string;
  marketing_consent?: boolean;
  language?: string;
}> = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', maxLength: 254 },
    gdpr_consent: { type: 'boolean' },
    privacy_notice_version: { type: 'string', minLength: 1 },
    marketing_consent: { type: 'boolean', nullable: true },
    language: { type: 'string', enum: ['de', 'en'], nullable: true }
  },
  required: ['email', 'gdpr_consent', 'privacy_notice_version'],
  additionalProperties: false
};

// Error Response Schema
export const ErrorResponseSchema: JSONSchemaType<{
  error: {
    code: string;
    message: string;
    details?: string;
    validation_errors?: Array<{
      field: string;
      message: string;
    }>;
  };
  timestamp: string;
  path: string;
}> = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', minLength: 1 },
        message: { type: 'string', minLength: 1 },
        details: { type: 'string', nullable: true },
        validation_errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', minLength: 1 },
              message: { type: 'string', minLength: 1 }
            },
            required: ['field', 'message'],
            additionalProperties: false
          },
          nullable: true
        }
      },
      required: ['code', 'message'],
      additionalProperties: false
    },
    timestamp: { type: 'string', format: 'date-time' },
    path: { type: 'string', minLength: 1 }
  },
  required: ['error', 'timestamp', 'path'],
  additionalProperties: false
};

/**
 * Contract Validation Helper
 * Validates API responses against schemas
 */
export class ContractValidator {
  private static validateSchema<T>(schema: JSONSchemaType<T>, data: unknown): {
    isValid: boolean;
    errors: string[];
    data?: T;
  } {
    const validate = ajv.compile(schema);
    const isValid = validate(data);

    if (isValid) {
      return { isValid: true, errors: [], data: data as T };
    }

    const errors = validate.errors?.map(err => {
      const path = err.instancePath || 'root';
      return `${path}: ${err.message}`;
    }) || ['Unknown validation error'];

    return { isValid: false, errors };
  }

  static validateHolidayResponse(data: unknown) {
    return this.validateSchema(HolidayResponseSchema, data);
  }

  static validateBridgeWeekendRequest(data: unknown) {
    return this.validateSchema(BridgeWeekendRequestSchema, data);
  }

  static validateBridgeWeekendResponse(data: unknown) {
    return this.validateSchema(BridgeWeekendResponseSchema, data);
  }

  static validateVacationPlanRequest(data: unknown) {
    return this.validateSchema(VacationPlanRequestSchema, data);
  }

  static validateEmailSendRequest(data: unknown) {
    return this.validateSchema(EmailSendRequestSchema, data);
  }

  static validateErrorResponse(data: unknown) {
    return this.validateSchema(ErrorResponseSchema, data);
  }
}

/**
 * Test Data Factory for Contract Testing
 * Generates valid and invalid test data for API contracts
 */
export class ContractTestDataFactory {
  static createValidHolidayRequest() {
    return {
      state: faker.helpers.arrayElement(['BW', 'BY', 'BE', 'NW']),
      year: faker.helpers.arrayElement([2025, 2026]),
      lang: faker.helpers.arrayElement(['de', 'en'])
    };
  }

  static createValidBridgeWeekendRequest() {
    return {
      state: faker.helpers.arrayElement(['BW', 'BY', 'BE', 'NW']),
      year: 2025,
      vacation_days: faker.number.int({ min: 20, max: 35 }),
      optimize_for: faker.helpers.arrayElement(['efficiency', 'total_days_off', 'balanced']),
      preferences: {
        include_religious_holidays: faker.datatype.boolean(),
        max_consecutive_vacation_days: faker.number.int({ min: 3, max: 10 }),
        prefer_long_weekends: faker.datatype.boolean()
      }
    };
  }

  static createValidVacationPlanRequest() {
    return {
      state: faker.helpers.arrayElement(['BW', 'BY', 'BE', 'NW']),
      vacation_days: faker.number.int({ min: 20, max: 35 }),
      selected_bridges: [1, 3, 5, 8],
      language: faker.helpers.arrayElement(['de', 'en']),
      user_preferences: {
        calendar_format: faker.helpers.arrayElement(['ical', 'google', 'outlook']),
        timezone: 'Europe/Berlin',
        include_notes: faker.datatype.boolean()
      }
    };
  }

  static createValidEmailSendRequest() {
    return {
      email: faker.internet.email({ provider: 'example.de' }),
      gdpr_consent: true,
      privacy_notice_version: '1.0',
      marketing_consent: faker.datatype.boolean(),
      language: faker.helpers.arrayElement(['de', 'en'])
    };
  }

  // Invalid data for negative testing
  static createInvalidHolidayRequest() {
    return {
      state: 'INVALID_STATE', // Invalid state code
      year: 2020, // Year out of range
      lang: 'fr' // Unsupported language
    };
  }

  static createInvalidBridgeWeekendRequest() {
    return {
      state: 'XX', // Invalid state
      year: 2024, // Invalid year
      vacation_days: 0, // Below minimum
      optimize_for: 'invalid_strategy' // Invalid strategy
    };
  }

  static createInvalidVacationPlanRequest() {
    return {
      state: 'INVALID',
      vacation_days: -5, // Negative value
      selected_bridges: [], // Empty array
      language: 'invalid' // Invalid language
    };
  }

  static createInvalidEmailSendRequest() {
    return {
      email: 'invalid-email-format', // Invalid email format
      gdpr_consent: false, // GDPR consent must be true
      privacy_notice_version: '', // Empty version
      language: 'invalid' // Invalid language
    };
  }
}

/**
 * HTTP Status Code Validator
 * Ensures proper HTTP status codes for different scenarios
 */
export class HttpStatusValidator {
  static validateSuccessResponse(statusCode: number, method: string): boolean {
    switch (method.toUpperCase()) {
      case 'GET':
        return statusCode === 200;
      case 'POST':
        return statusCode === 200 || statusCode === 201;
      case 'PUT':
        return statusCode === 200 || statusCode === 204;
      case 'DELETE':
        return statusCode === 200 || statusCode === 204;
      default:
        return false;
    }
  }

  static validateErrorResponse(statusCode: number, errorType: string): boolean {
    const errorMap = {
      'validation': [400],
      'authentication': [401],
      'authorization': [403],
      'not_found': [404],
      'rate_limit': [429],
      'server_error': [500],
      'service_unavailable': [503]
    };

    return errorMap[errorType as keyof typeof errorMap]?.includes(statusCode) || false;
  }
}

/**
 * Content Type Validator
 * Ensures proper content types for API responses
 */
export class ContentTypeValidator {
  static validateJSONResponse(contentType: string): boolean {
    return contentType.includes('application/json');
  }

  static validateCalendarResponse(contentType: string): boolean {
    return contentType.includes('text/calendar') ||
           contentType.includes('application/octet-stream');
  }

  static validateErrorResponse(contentType: string): boolean {
    return contentType.includes('application/json');
  }
}

/**
 * Performance Contract Validator
 * Ensures API meets constitutional performance requirements
 */
export class PerformanceContractValidator {
  static validateResponseTime(duration: number, endpoint: string): {
    meetsTarget: boolean;
    target: number;
    actual: number;
  } {
    // Constitutional requirement: <100ms for API responses
    const target = 100;
    const meetsTarget = duration <= target;

    return { meetsTarget, target, actual: duration };
  }

  static validateThroughput(requestsPerSecond: number): {
    meetsTarget: boolean;
    target: number;
    actual: number;
  } {
    // Target based on 25k concurrent users
    const target = 1000; // requests per second
    const meetsTarget = requestsPerSecond >= target;

    return { meetsTarget, target, actual: requestsPerSecond };
  }
}

// Export all contract testing utilities
export const contractTestHelpers = {
  ContractValidator,
  ContractTestDataFactory,
  HttpStatusValidator,
  ContentTypeValidator,
  PerformanceContractValidator,
  HolidayResponseSchema,
  BridgeWeekendRequestSchema,
  BridgeWeekendResponseSchema,
  VacationPlanRequestSchema,
  EmailSendRequestSchema,
  ErrorResponseSchema
};