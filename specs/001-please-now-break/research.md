# Research: Timebutler Calendar MVP

## German Holiday Data Sources

### Decision: Official Government APIs (bundesregierung.de)
**Rationale**: Constitutional requirement for 100% accuracy across all 16 Bundesländer demands official sources. Government APIs provide legal authority and regional variations (Catholic/Protestant).

**Alternatives considered**:
- Commercial APIs (TimeandDate.com): Less authoritative, potential accuracy gaps
- Static datasets: Maintenance burden, no automatic updates
- Community databases: Inconsistent quality, reliability concerns

**Implementation**: Primary source via bundesregierung.de APIs with fallback to state-specific sources for regional holidays.

## Email Service Integration

### Decision: Resend Email Service
**Rationale**: Modern transactional email service optimized for developer experience and delivery speed. Meets 5-second delivery requirement with reliable infrastructure.

**Alternatives considered**:
- SendGrid: More complex pricing, heavyweight for MVP
- AWS SES: Requires more configuration, delivery setup
- Direct SMTP: High maintenance, deliverability challenges

**Implementation**: Resend API with bilingual HTML/text templates, webhook confirmation for delivery tracking.

## Frontend Framework Selection

### Decision: React with TypeScript
**Rationale**:
- Progressive enhancement support (SSR/SSG capability)
- Strong accessibility ecosystem (React Aria, Reach UI)
- Excellent bundle size optimization tools (Vite, Rollup)
- TypeScript provides type safety for complex date/holiday calculations

**Alternatives considered**:
- Vue: Good option but smaller ecosystem for accessibility
- Svelte: Excellent performance but less mature tooling
- Vanilla JS: Would require more custom development

**Implementation**: Next.js or Remix for SSR/SSG, focus on 200KB bundle limit.

## Backend Architecture

### Decision: Node.js with Express/Fastify
**Rationale**:
- Stateless API design fits constitutional requirements
- Excellent ecosystem for date/time manipulation (date-fns, luxon)
- Strong Redis integration for caching holiday data
- Easy Docker containerization

**Alternatives considered**:
- Python FastAPI: Good choice but Node.js better for frontend integration
- Go: High performance but team expertise considerations
- PHP: Legacy concerns for modern deployment

**Implementation**: Express.js with Redis caching layer, PostgreSQL for analytics storage.

## Holiday Calculation Algorithms

### Decision: Pre-computed Holiday Rules with Runtime Bridge Calculation
**Rationale**:
- 2025-2026 holiday data can be pre-calculated and cached
- Bridge weekend logic runs client-side for immediate feedback
- Deterministic algorithms enable comprehensive testing

**Alternatives considered**:
- Dynamic API calls: Would violate response time requirements
- Full client-side: Complex for regional variations
- Hybrid approach: Unnecessary complexity for 2-year scope

**Implementation**: Static holiday JSON files with date-fns for bridge calculations.

## Internationalization (i18n)

### Decision: React-i18next with ICU message format
**Rationale**:
- Robust pluralization for German language rules
- Context-aware translations (formal/informal addressing)
- Efficient bundle splitting for language-specific content

**Alternatives considered**:
- FormatJS: More complex setup for simple use case
- Custom solution: Reinventing wheel for standard problem
- Server-side only: Would break progressive enhancement

**Implementation**: Language detection via Accept-Language header with localStorage persistence.

## Calendar Export Generation

### Decision: ical-generator library with custom timezone handling
**Rationale**:
- RFC 5545 compliant output
- Support for all major calendar applications
- Proper CET/CEST timezone transitions

**Alternatives considered**:
- Manual iCal generation: Error-prone, maintenance burden
- Third-party API: External dependency, cost implications
- Calendar-specific formats: Limited interoperability

**Implementation**: Generate .ics files with signed URLs, 30-day TTL via cloud storage.

## Performance & Caching Strategy

### Decision: Multi-layer caching (CDN + Redis + Browser)
**Rationale**:
- CDN for static assets (holiday data, translations)
- Redis for computed bridge weekends
- Browser caching for user selections

**Alternatives considered**:
- Database-only: Too slow for 100ms interaction requirement
- File system: Doesn't scale to 25k concurrent users
- In-memory only: Not fault tolerant

**Implementation**: CloudFlare CDN + Redis cache with proper cache invalidation.

## Testing Strategy

### Decision: Comprehensive test pyramid (Unit + Integration + E2E)
**Rationale**:
- Constitutional requirement for >90% coverage
- Holiday calculations are mission-critical
- Email delivery requires integration testing
- Accessibility requires E2E validation

**Alternatives considered**:
- Unit tests only: Insufficient for integration points
- Manual testing only: Cannot achieve coverage requirements
- Lightweight testing: Risk of accuracy failures

**Implementation**: Jest (unit), Testing Library (integration), Playwright (E2E).

## Deployment & Infrastructure

### Decision: Docker containers on cloud platform (Vercel/Railway)
**Rationale**:
- Auto-scaling for traffic spikes (December/January)
- Zero-downtime deployments
- Built-in monitoring and observability

**Alternatives considered**:
- Traditional VPS: Manual scaling, maintenance burden
- Serverless only: Cold start issues for interactive requirements
- Kubernetes: Overkill for MVP complexity

**Implementation**: Frontend on Vercel, backend on Railway/Render with Redis Cloud.

---

**Research Status**: ✅ Complete
**Key Decisions**: 9 major technology choices resolved
**Next Phase**: Design & Contracts (data model, API contracts)