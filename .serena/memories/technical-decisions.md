# Technical Decisions Memory

## Architecture Decisions (Research Phase)

### Frontend Framework: React with TypeScript
**Decision**: React/TypeScript with Next.js for SSR/SSG
**Rationale**:
- Progressive enhancement support
- Strong accessibility ecosystem
- Bundle size optimization tools
- TypeScript for complex date calculations

### Backend Framework: Node.js/Express
**Decision**: Node.js with Express/Fastify
**Rationale**:
- Stateless API design fits constitutional requirements
- Excellent date/time libraries (date-fns, luxon)
- Strong Redis integration for caching
- Easy Docker containerization

### Email Service: Resend
**Decision**: Resend for transactional email
**Rationale**:
- Modern service optimized for 5-second delivery requirement
- Better developer experience than SendGrid/SES
- Reliable infrastructure for constitutional requirements

### Holiday Data: German Government APIs
**Decision**: Official bundesregierung.de APIs as primary source
**Rationale**:
- Constitutional requirement for 100% accuracy
- Legal authority for all 16 Bundesländer
- Handles Catholic/Protestant regional variations

### Caching Strategy: Multi-layer (CDN + Redis + Browser)
**Decision**: CloudFlare CDN + Redis + Browser caching
**Rationale**:
- Meets 100ms interaction requirement
- Scales to 25k concurrent users
- Holiday data changes infrequently

### Database Strategy: Redis + PostgreSQL
**Decision**: Redis for sessions/cache, PostgreSQL for analytics
**Rationale**:
- Redis: Fast session management, holiday data caching
- PostgreSQL: GDPR-compliant analytics storage
- No user data persistence beyond 90 days

## Data Model Decisions

### Entity Design: 6 Core Models
1. **Holiday**: Bilingual names, state/federal classification
2. **State**: 16 Bundesländer with religious demographics
3. **BridgeWeekend**: Efficiency calculations (ROI per vacation day)
4. **VacationPlan**: Session-based with GDPR consent
5. **CalendarExport**: Signed URLs, 30-day expiration
6. **LanguagePreference**: DE formal vs EN casual

### API Design: RESTful with OpenAPI
- **holidays-api.yaml**: Holiday data and bridge calculations
- **calendar-export-api.yaml**: Email delivery and exports
- RFC 5545 compliant iCalendar generation

## Performance Decisions

### Bundle Size: <200KB Target
**Strategy**:
- Tree shaking with Vite/Rollup
- Dynamic imports for language packs
- Aggressive code splitting

### Caching: 30-day TTL for Holiday Data
**Strategy**:
- Static holiday data (2025-2026 pre-computed)
- Redis cache with proper invalidation
- CDN for translations and static assets

### Progressive Enhancement: No-JS Core Features
**Strategy**:
- Server-side rendering for holiday viewing
- Enhanced interactions via client-side JavaScript
- Graceful degradation throughout

## Security & Compliance

### GDPR Compliance Strategy
- Clear consent with 90-day retention policy
- Data minimization (no unnecessary collection)
- Automatic deletion after retention period
- User rights clearly communicated

### Rate Limiting: IP-based Protection
- Prevent email abuse without blocking legitimate users
- Scale to handle German traffic spikes
- Fail gracefully with clear error messages

## Testing Strategy Decisions

### TDD Methodology: Tests First
- All contract tests must fail before implementation
- >90% coverage constitutional requirement
- Real calendar application validation
- Screen reader accessibility testing

### Cross-Browser Support
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- iOS Safari, Android Chrome
- Progressive enhancement validation