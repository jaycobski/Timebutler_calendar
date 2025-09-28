# Security Middleware

Comprehensive security middleware for the Timebutler Calendar backend, providing CORS handling, security headers, and German/EU compliance features.

## Features

### 🔒 Core Security
- **CORS Configuration**: Flexible origin validation with development/production modes
- **Security Headers**: HSTS, CSP, X-Frame-Options, and more
- **Request Validation**: Content-length limits, host validation, input sanitization
- **Response Cleanup**: Removes sensitive headers, adds security indicators

### 🇩🇪 German/EU Compliance
- **GDPR Compliance**: Consent validation, data minimization, privacy headers
- **German Language Support**: Bilingual error messages and headers
- **EU Cookie Compliance**: Proper cookie handling for EU regulations
- **TMG/BDSG Compliance**: German Telemediengesetz and data protection law support

### ⚡ Performance Optimization
- **Rate Limiting Integration**: Client identification and endpoint categorization
- **Response Time Tracking**: Performance monitoring headers
- **Efficient Processing**: Optimized for 25k concurrent users
- **Compression Support**: Gzip/deflate compression integration

## Quick Start

### Basic Setup

```typescript
import { registerSecurityMiddleware } from './middleware/security';
import { FastifyInstance } from 'fastify';

// Register with default configuration
await registerSecurityMiddleware(app);
```

### Custom Configuration

```typescript
import { registerSecurityMiddleware, createSecurityConfig } from './middleware/security';

const customConfig = {
  ...createSecurityConfig('production'),
  cors: {
    origin: ['https://my-domain.com'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  headers: {
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"]
      }
    }
  }
};

await registerSecurityMiddleware(app, customConfig);
```

## Configuration Options

### CORS Configuration

```typescript
{
  cors: {
    origin: string[] | string | boolean,  // Allowed origins
    credentials: boolean,                  // Allow credentials
    methods: string[],                     // Allowed methods
    allowedHeaders: string[],             // Allowed headers
    exposedHeaders?: string[],            // Exposed headers
    maxAge?: number                       // Preflight cache duration
  }
}
```

### Security Headers

```typescript
{
  headers: {
    hsts: {
      enabled: boolean,        // Enable HSTS
      maxAge: number,         // Max age in seconds
      includeSubDomains: boolean,
      preload: boolean
    },
    csp: {
      enabled: boolean,        // Enable CSP
      directives: Record<string, string[]>,
      reportOnly: boolean     // Report-only mode
    },
    frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM',
    contentTypeOptions: boolean,
    xssProtection: boolean,
    referrerPolicy: string
  }
}
```

### GDPR Compliance

```typescript
{
  compliance: {
    gdprHeaders: boolean,          // Add GDPR headers
    germanLanguageSupport: boolean, // German language support
    euCookieCompliance: boolean,   // EU cookie compliance
    dataMinimization: boolean      // Data minimization enforcement
  }
}
```

## Environment-Specific Configurations

### Development
- CORS allows localhost origins
- CSP in report-only mode
- HSTS disabled
- Relaxed host validation
- Detailed error messages

### Production
- Strict CORS policy
- Full CSP enforcement
- HSTS enabled with preload
- Strict host validation
- Minimal error information

### Test
- Minimal security for testing
- Allows all origins
- Disabled security headers
- Fast execution

## GDPR Features

### Consent Validation

The middleware automatically validates GDPR consent for data processing endpoints:

```typescript
// Endpoints requiring consent
const dataProcessingPaths = [
  '/v1/vacation-plan',
  '/v1/export',
  '/v1/email',
  '/api/analytics'
];

// Required header
headers: {
  'X-GDPR-Consent': 'accepted'
}
```

### Privacy Headers

Automatically added GDPR compliance headers:

```
X-GDPR-Compliant: true
X-Data-Retention: 90-days
X-Privacy-Policy: https://timebutler.de/privacy
X-Supported-Languages: de,en
X-Default-Language: de
```

## Rate Limiting Integration

The middleware provides rate limiting hooks:

```typescript
// Rate limit categories
const categories = {
  'health': '1000/minute',
  'data': '100/minute',
  'computation': '50/minute',
  'user-data': '20/minute',
  'export': '10/minute',
  'email': '5/minute',
  'general': '200/minute'
};
```

## Security Headers Reference

### Content Security Policy (CSP)

Production CSP configuration:

```
default-src 'self';
script-src 'self' 'strict-dynamic';
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
font-src 'self' fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' api.timebutler.de *.timebutler.de;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

### HTTP Strict Transport Security (HSTS)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Other Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## Error Handling

### GDPR Consent Required (451)

```json
{
  "error": {
    "message": "GDPR consent required for data processing",
    "statusCode": 451,
    "consentRequired": true,
    "privacyPolicy": "https://timebutler.de/privacy"
  }
}
```

### Invalid Host Header (400)

```json
{
  "error": {
    "message": "Invalid host header",
    "statusCode": 400
  }
}
```

### Request Too Large (413)

```json
{
  "error": {
    "message": "Request entity too large",
    "statusCode": 413,
    "maxSize": "10MB"
  }
}
```

## Performance Considerations

- Middleware hooks are optimized for minimal overhead
- Headers are cached where possible
- Rate limiting context is efficiently computed
- Memory usage is minimized for high concurrency

## Testing

Run middleware tests:

```bash
npm run test:middleware
```

Test specific security features:

```bash
npm run test -- --testNamePattern="CORS"
npm run test -- --testNamePattern="GDPR"
npm run test -- --testNamePattern="Security Headers"
```

## Compliance Standards

### German Regulations
- **TMG (Telemediengesetz)**: Impressum and privacy requirements
- **BDSG (Bundesdatenschutzgesetz)**: German data protection law
- **German Language**: Formal addressing and legal terminology

### EU Regulations
- **GDPR**: Full General Data Protection Regulation compliance
- **ePrivacy Directive**: Cookie consent and electronic communications
- **NIS Directive**: Network and information security requirements

## Security Best Practices

1. **Origin Validation**: Always validate request origins in production
2. **HTTPS Enforcement**: Use HSTS and upgrade insecure requests
3. **Content Security**: Implement strict CSP policies
4. **Data Minimization**: Collect only necessary data
5. **Consent Management**: Require explicit consent for data processing
6. **Audit Logging**: Log all security-related events
7. **Regular Updates**: Keep security policies current with regulations

## Support

For security issues or compliance questions:
- Review the test suite for usage examples
- Check the TypeScript definitions for configuration options
- Consult the German compliance documentation
- Test thoroughly in development environment before production deployment