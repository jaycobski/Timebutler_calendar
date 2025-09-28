# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Timebutler Calendar MVP

German holiday bridge weekend optimizer web application. Helps German workers maximize vacation time by identifying optimal bridge weekends combining public holidays with strategic vacation days for 2025-2026.

### Key Features
- **No login required** - completely stateless operation
- **Bilingual support** - German (formal) and English (casual) interfaces
- **State-specific holidays** - accurate data for all 16 German Bundesländer
- **Email-based delivery** - calendar exports delivered via professional email
- **Brand awareness tool** - free service promoting TimeButler's time tracking solutions
- **Accessibility-first** - WCAG 2.1 Level AA compliance, works without JavaScript

## Architecture Overview

### Project Structure (Web Application)
```
backend/
├── src/
│   ├── models/          # Holiday, State, BridgeWeekend, VacationPlan
│   ├── services/        # Email, Calendar, Holiday data processing
│   ├── api/            # REST endpoints for holidays and exports
│   ├── lib/            # Bridge weekend algorithms, date utilities
│   └── templates/      # Bilingual email templates (DE/EN)
└── tests/
    ├── contract/       # API contract tests
    ├── integration/    # User story validation tests
    └── unit/           # Holiday calculations, algorithms

frontend/
├── src/
│   ├── components/     # React components with accessibility
│   ├── pages/          # SSR/SSG pages (Next.js/Remix)
│   ├── services/       # API integration, state management
│   ├── i18n/           # German/English translations
│   └── styles/         # Responsive, mobile-first CSS
└── tests/
    ├── e2e/            # Playwright cross-browser testing
    └── integration/    # Component integration tests
```

## Technology Stack

### Core Technologies
- **Languages**: TypeScript/JavaScript (Node.js 18+, modern ES2020+)
- **Frontend**: React with TypeScript, Next.js or Remix for SSR/SSG
- **Backend**: Express.js or Fastify
- **Database**: Redis (caching), PostgreSQL (analytics), file system (temp exports)
- **Email Service**: Resend for transactional email delivery
- **Testing**: Jest (unit), Testing Library (integration), Playwright (e2e)

### External Integrations
- **Holiday Data**: Official German government APIs (bundesregierung.de)
- **Calendar Export**: RFC 5545 compliant iCal generation
- **Monitoring**: Standard metrics (response times, user counts, email success rates)

## Development Guidelines

### Performance Requirements (Constitutional)
- **Page Load**: <2 seconds on 3G connections
- **Interactions**: <100ms response time for all user actions
- **Email Delivery**: <5 seconds from submission to inbox
- **Bundle Size**: <200KB gzipped for frontend
- **Concurrency**: Handle 25,000 concurrent users during peak season

### Data Requirements
- **Accuracy**: 100% accurate holiday data for all German states 2025-2026
- **Retention**: User data kept 90 days for analytics, then auto-deleted
- **Export Links**: Valid for 30 days, signed URLs for security
- **GDPR Compliance**: Clear consent, data minimization, right to deletion

### Testing Strategy (>90% Coverage Required)
- **Holiday Calculations**: Unit tests for each German state's holidays
- **Bridge Weekend Logic**: Comprehensive algorithm testing
- **Email Delivery**: Integration tests with Resend service
- **Calendar Exports**: Validation against real calendar applications
- **Accessibility**: Screen reader testing, keyboard navigation
- **Cross-browser**: Chrome, Firefox, Safari, Edge (latest 2 versions)

## Build & Development Commands

### Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Configure: DATABASE_URL, REDIS_URL, RESEND_API_KEY, GERMAN_API_KEY

# Initialize databases
npm run db:setup
npm run cache:setup
```

### Development
```bash
# Start development servers (parallel)
npm run dev              # Full stack with hot reload
npm run dev:frontend     # Frontend only (port 3000)
npm run dev:backend      # Backend only (port 3001)

# Holiday data management
npm run holidays:fetch   # Download latest German holiday data
npm run holidays:validate # Verify data accuracy
npm run bridges:calculate # Pre-compute bridge opportunities
```

### Testing
```bash
# Run all tests
npm test

# Test categories
npm run test:unit        # Holiday calculations, algorithms
npm run test:integration # API endpoints, user flows
npm run test:e2e         # Full user journeys across browsers
npm run test:contract    # API contract validation
npm run test:a11y        # Accessibility compliance

# Test specific features
npm run test:holidays    # Holiday data accuracy
npm run test:bridges     # Bridge weekend calculations
npm run test:email       # Email delivery and templates
npm run test:export      # Calendar export formats
```

### Quality & Performance
```bash
# Code quality
npm run lint             # ESLint with accessibility rules
npm run type-check       # TypeScript validation
npm run format           # Prettier formatting

# Performance testing
npm run lighthouse       # Performance audit
npm run bundle-analyzer  # Bundle size analysis
npm run load-test        # Simulate concurrent users

# Accessibility
npm run a11y:test        # Automated accessibility testing
npm run screen-reader    # Screen reader simulation
```

### Deployment
```bash
# Build for production
npm run build

# Database migrations
npm run db:migrate

# Start production server
npm start

# Health checks
npm run health:check     # API health verification
npm run monitoring:setup # Metrics and alerting
```

## Key Entities & Data Model

### Core Models
- **Holiday**: German public holidays (federal/state/regional) with bilingual names
- **State**: 16 Bundesländer with population and religious denomination data
- **BridgeWeekend**: Calculated opportunities (holiday + vacation days → total days off)
- **VacationPlan**: User session with selections, email, and GDPR consent
- **CalendarExport**: Generated .ics files with signed download URLs

### Bridge Weekend Algorithm
```typescript
interface BridgeWeekend {
  holiday_id: string;
  start_date: string;        // Weekend start (may include holiday)
  end_date: string;          // Weekend end
  vacation_days_needed: number; // 1-4 vacation days required
  total_days_off: number;    // Including weekends
  efficiency: number;        // total_days_off / vacation_days_needed
  pattern: 'thursday-friday' | 'monday-tuesday' | 'sandwich';
}
```

## API Endpoints

### Holiday Data API
- `GET /v1/holidays?state={BY}&year={2025}&lang={de}` - Get state holidays
- `POST /v1/bridge-weekends` - Calculate optimal bridges for vacation budget

### Calendar Export API
- `POST /v1/vacation-plan` - Create planning session
- `POST /v1/vacation-plan/{id}/email` - Send calendar via email
- `GET /v1/export/{id}` - Download calendar file

## Internationalization

### Languages Supported
- **German (de)**: Formal addressing ("Sie"), official holiday names
- **English (en)**: Casual tone, translated holiday names with German context

### Translation Requirements
- UI text: Complete translations, no placeholder text allowed
- Holiday names: Official German + English explanations
- Email templates: Professional German (formal) vs friendly English (casual)
- State names: Mixed approach (Bayern/Bavaria, Baden-Württemberg)

## Constitutional Compliance

The project follows the Timebutler Calendar Constitution v1.1.0:

### Core Principles
1. **User-Centric Simplicity**: Intuitive, no-documentation-needed interface
2. **Data Accuracy & Compliance**: Official sources, GDPR compliance
3. **Export & Delivery**: Flawless email + calendar integration
4. **Brand Integration**: Professional TimeButler promotion
5. **Progressive Enhancement**: Works without JavaScript
6. **Performance & Reliability**: Sub-2s loads, 25k concurrent users
7. **Testing Discipline**: >90% coverage, comprehensive validation

### Quality Gates
- Lighthouse score >90 for all metrics
- Email delivery success rate >95%
- Zero-login requirement maintained
- WCAG 2.1 Level AA compliance
- Holiday data 100% accuracy verified

## Common Development Patterns

### Holiday Data Processing
- Cache holidays in Redis with 30-day TTL
- Validate against official German sources annually
- Account for Catholic/Protestant regional variations
- Handle timezone transitions (CET/CEST) correctly

### Bridge Weekend Calculation
- Pre-compute opportunities for 2025-2026
- Client-side calculation for immediate feedback
- Server-side validation for accuracy
- Rank by efficiency (days off per vacation day)

### Email Template Generation
- Bilingual templates with proper cultural tone
- TimeButler branding without being intrusive
- Mobile-responsive HTML with plain text fallback
- Clear GDPR compliance messaging

### Error Handling
- Graceful degradation when JavaScript disabled
- Clear error messages in user's selected language
- Retry logic for email delivery failures
- Comprehensive logging for debugging

## Deployment & Infrastructure

### Production Requirements
- **Auto-scaling**: Handle German traffic spikes (Dec/Jan planning season)
- **CDN**: Static assets (holiday data, translations) globally distributed
- **Monitoring**: Response times, error rates, email delivery success
- **Backup**: Holiday data, analytics (not user sessions - stateless)

### Environment Variables
```bash
# Required
DATABASE_URL=           # PostgreSQL for analytics
REDIS_URL=             # Caching and session storage
RESEND_API_KEY=        # Email service authentication
GERMAN_HOLIDAY_API_KEY= # Official government API access

# Optional
NODE_ENV=production
PORT=3000
BUNDLE_ANALYZE=false
LOG_LEVEL=info
```

---

**Last Updated**: 2025-01-24 (Implementation Planning Phase)
**Next Phase**: Task generation (/tasks command)
**Status**: Ready for development - all planning artifacts complete