# TimeButler Calendar MVP - Load Testing Framework

## 🎯 Constitutional Performance Requirements

This load testing framework validates the TimeButler Calendar MVP against its constitutional performance requirements:

- **Load Time**: <2 seconds on 3G connections
- **Concurrent Users**: Handle 25,000 concurrent German users
- **Email Delivery**: <5 seconds from submission to inbox
- **Bundle Size**: <200KB gzipped for frontend
- **Error Rate**: <1% for all operations
- **Response Time**: <100ms for user interactions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- k6 load testing tool

### Installation

```bash
# Install dependencies
npm install

# Install k6 (macOS)
brew install k6

# Install k6 (Linux)
sudo apt update && sudo apt install k6

# Install k6 (Windows)
winget install k6
```

### Setup Load Testing Environment

```bash
# Start monitoring infrastructure
npm run load:prepare

# This starts:
# - InfluxDB (metrics storage)
# - Grafana (visualization)
# - Redis (caching simulation)
# - PostgreSQL (database load testing)
# - Nginx (load balancing)
# - WireMock (API mocking)
```

## 📊 Load Testing Scenarios

### 1. Constitutional Compliance Validation

```bash
# Full constitutional compliance test
npm run test:load:constitutional

# Tests all constitutional requirements:
# - 25k concurrent users
# - <2s load times on 3G
# - <5s email delivery
# - <200KB bundle size
# - <1% error rate
```

### 2. German Market Scenarios

```bash
# German user behavior simulation
npm run test:load:german

# Tests regional differences:
# - Bavarian users (Catholic holidays)
# - NRW users (Industrial region)
# - Berlin users (International, bilingual)
# - Mobile users (70% of German traffic)
# - Rural users (slower connections)
```

### 3. Peak Season Simulation

```bash
# Christmas/New Year traffic surge
npm run test:load:peak

# Simulates German vacation planning patterns:
# - December Christmas planning surge
# - New Year bridge optimization rush
# - School holiday coordination
# - Last-minute panic planning (Dec 28-31)
```

### 4. Infrastructure Performance

```bash
# Database and Redis performance
npm run test:load:database

# Email delivery performance
npm run test:load:email

# Combined infrastructure test
npm run test:load
```

## 📈 Monitoring and Reporting

### Real-time Monitoring

Access monitoring dashboards:

- **Grafana**: http://localhost:3003 (admin/admin)
- **InfluxDB**: http://localhost:8086
- **Mailhog** (Email testing): http://localhost:8025

### Performance Monitoring

```bash
# Start error rate monitoring
node scripts/error-rate-monitor.js

# Generate comprehensive report
npm run load:report
```

### Constitutional Compliance Dashboard

The Grafana dashboard tracks:
- Load time compliance (<2s target)
- Concurrent users (25k target)
- Error rate compliance (<1% target)
- Email delivery compliance (<5s target)
- Bundle size compliance (<200KB target)

## 🧪 Load Test Configuration

### Test Scenarios Overview

| Scenario | Target Users | Duration | Focus |
|----------|-------------|----------|-------|
| Constitutional | 25,000 | 69 min | All requirements |
| German Market | 15,000 | 50 min | Regional behavior |
| Peak Season | 35,000 | 95 min | Christmas/NY rush |
| Database | 25,000 | 69 min | DB/Cache performance |
| Email | 10,000 | 69 min | Email delivery |

### Performance Thresholds

```javascript
// Constitutional thresholds
thresholds: {
  'constitutional_load_time': ['p(95)<2000'],
  'constitutional_error_rate': ['rate<0.01'],
  'email_delivery_time': ['p(95)<5000'],
  'constitutional_bundle_size': ['avg<204800'],
  'concurrent_users_peak': ['max>=25000']
}
```

## 🇩🇪 German Market Testing

### State Coverage

Tests all 16 German Bundesländer:
- **High Population**: NW, BY, BW (prioritized)
- **Catholic States**: BY, BW, ST (Heilige Drei Könige)
- **Protestant States**: Northern states (Reformation Day)
- **International**: BE (bilingual support)

### Holiday Accuracy Testing

Validates German holiday data:
- Federal holidays (all states)
- State-specific holidays
- Religious holidays (Catholic/Protestant)
- Regional variations
- School holiday coordination

### Language Testing

- **German (87%)**: Formal addressing, official holiday names
- **English (13%)**: International users, casual tone
- **Bilingual switching**: Language toggle performance

## 📧 Email Delivery Testing

### Constitutional Requirements

- **Delivery Time**: <5 seconds (95th percentile)
- **Success Rate**: >98%
- **Volume**: Handle peak season email surges
- **GDPR Compliance**: All emails must be compliant

### Email Scenarios

```javascript
// Email test patterns
scenarios: {
  vacation_plan: "Calendar export delivery",
  bridge_weekend: "Optimization results",
  holiday_reminder: "Upcoming holidays",
  year_end_summary: "Annual planning recap"
}
```

### Template Performance

- German templates: Formal tone, Sie addressing
- English templates: Casual tone, international context
- Bilingual rendering: <600ms performance target
- Mobile-optimized: Responsive email design

## 🗄️ Database & Cache Testing

### Database Performance

- **Query Time**: <500ms (95th percentile)
- **Throughput**: >100 queries/second
- **Error Rate**: <0.5%
- **Connection Pool**: Optimized for 25k users

### Redis Cache Performance

- **Hit Rate**: >85%
- **Latency**: <10ms (95th percentile)
- **Eviction Rate**: <10%
- **Holiday Data TTL**: 30 days

### German Holiday Data

- **Fetch Time**: <200ms for state-specific holidays
- **Cache Efficiency**: >90% for repeated queries
- **Multi-year Queries**: <800ms for 2025-2026 data
- **Bundesland Queries**: <150ms per state

## 📊 Report Generation

### Comprehensive Reports

```bash
# Generate all reports
npm run load:report

# Generated files:
# - constitutional-compliance-report.json
# - german-market-report.json
# - peak-season-report.json
# - database-redis-performance-report.json
# - email-delivery-load-report.json
# - comprehensive-load-test-report.json
# - load-test-report.md
# - executive-summary.json
```

### Constitutional Compliance Card

```json
{
  "constitutional_compliance_card": {
    "status": "CONSTITUTIONAL_COMPLIANT",
    "grade": "A+ (Constitutional Compliant)",
    "score": "97.8%",
    "requirements": {
      "Load Time <2s (3G)": "PASS",
      "25k Concurrent Users": "PASS",
      "Email Delivery <5s": "PASS",
      "Error Rate <1%": "PASS"
    },
    "verdict": "✅ CONSTITUTIONAL REQUIREMENTS MET"
  }
}
```

### Executive Summary

Key metrics for stakeholders:
- Constitutional compliance status
- German market readiness
- Performance bottlenecks
- Immediate action items
- Production readiness verdict

## 🚨 Error Rate Monitoring

### Real-time Alerts

The monitoring system triggers alerts for:
- Constitutional violations (error rate >1%)
- Performance degradation (response time >2s)
- Email delivery issues (>5s delivery time)
- Concurrent user failures (<25k capacity)

### Alert Levels

- **CRITICAL**: Constitutional requirement violations
- **HIGH**: Performance degradation
- **MEDIUM**: Infrastructure warnings
- **LOW**: Optimization opportunities

## 🔧 Configuration

### Environment Variables

```bash
# Load testing configuration
BASE_URL=http://localhost:3000          # Frontend URL
API_BASE_URL=http://localhost:3001      # Backend API URL
K6_INFLUXDB_ADDR=http://localhost:8086  # Metrics storage

# German market configuration
GERMAN_STATES_FOCUS=BY,NW,BW,BE         # Priority states
LANGUAGE_SPLIT=0.87                     # 87% German, 13% English
PEAK_SEASON_MULTIPLIER=2.5              # Dec/Jan traffic increase
```

### Test Customization

```javascript
// Custom test scenarios
export let options = {
  scenarios: {
    custom_load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '5m', target: 1000 },
        { duration: '15m', target: 25000 },
        { duration: '10m', target: 0 }
      ]
    }
  }
};
```

## 🎯 Success Criteria

### Constitutional Compliance

- ✅ All constitutional requirements met (>95% compliance)
- ✅ 25,000 concurrent users successfully handled
- ✅ <2s load times on simulated 3G connections
- ✅ <5s email delivery (95th percentile)
- ✅ <1% error rate across all operations
- ✅ <200KB bundle size (gzipped)

### German Market Readiness

- ✅ All 16 Bundesländer supported
- ✅ 99%+ holiday data accuracy
- ✅ Bilingual support (German/English)
- ✅ Regional performance consistency
- ✅ GDPR compliance validation

### Production Readiness

- ✅ Peak season traffic handling
- ✅ Database performance under load
- ✅ Email infrastructure scaling
- ✅ Cache efficiency optimization
- ✅ Error monitoring and alerting

## 🏆 Performance Optimization

### Bundle Size Optimization

- Code splitting by route and component
- Tree shaking for unused code elimination
- Asset compression (Brotli/Gzip)
- Dynamic imports for lazy loading
- Font optimization with font-display: swap

### Caching Strategy

- **Browser Cache**: Static assets, translations
- **CDN Cache**: Holiday data, public assets
- **Redis Cache**: API responses, sessions (30-day TTL)
- **Application Cache**: Bridge calculations, user preferences

### Database Optimization

- Query optimization for German holiday data
- Proper indexing for state-based queries
- Connection pooling for concurrent users
- Read replicas for query distribution

## 📞 Support

For load testing support:

- **Documentation**: This README and inline comments
- **Monitoring**: Grafana dashboards and alerts
- **Reporting**: Automated report generation
- **Debugging**: k6 logs and error monitoring

## 🔄 Continuous Integration

Integrate load testing in CI/CD:

```yaml
# GitHub Actions example
- name: Constitutional Load Test
  run: |
    npm run load:prepare
    npm run test:load:constitutional
    npm run load:report

- name: Upload Performance Reports
  uses: actions/upload-artifact@v3
  with:
    name: load-test-reports
    path: reports/
```

---

**TimeButler Calendar MVP Load Testing Framework v1.0**
*Constitutional Performance Validation for German Market*