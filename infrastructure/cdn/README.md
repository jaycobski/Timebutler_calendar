# TimeButler Calendar CDN Configuration - German Market

This directory contains comprehensive CDN configuration optimized for the German market, including GDPR compliance, performance optimization, and failover strategies.

## Overview

The CDN configuration is specifically designed for TimeButler Calendar's German market deployment with the following key features:

- **German Edge Location Optimization**: Primary edge locations in Frankfurt, Munich, and Berlin
- **GDPR Compliance**: Full compliance with German data protection laws
- **Performance Optimization**: Sub-2s load times for German users
- **Failover Strategies**: Multi-region failover with health checks
- **Security**: WAF rules and security headers for German cybersecurity standards

## Files Structure

```
cdn/
├── cloudfront-config.json          # Main CloudFront distribution configuration
├── cache-policies.json             # Cache policies optimized for German traffic
├── security-headers-policies.json  # Security headers and origin request policies
├── waf-rules.json                  # WAF rules for German market security
├── failover-config.json            # Failover strategies and health checks
├── performance-monitoring.json     # Performance monitoring configuration
├── deploy-cdn.sh                   # Main deployment script
├── update-cdn.sh                   # Update existing CDN configuration
└── README.md                       # This documentation
```

## Configuration Highlights

### German Market Optimizations

#### Edge Locations
- **Tier 1 Primary**: Frankfurt (FRA), Munich (MUC), Berlin (BER)
- **Tier 1 Secondary**: Amsterdam (AMS), London (LHR), Paris (CDG)
- **Tier 2**: Vienna (VIE), Zurich (ZUR), Milan (MXP), Warsaw (WAW)

#### Performance Targets
- **Germany**: TTFB <200ms, LCP <1200ms, FID <50ms, CLS <0.05
- **DACH Region**: TTFB <300ms, LCP <1500ms, FID <75ms, CLS <0.08

#### GDPR Compliance Features
- Data processing restricted to EU (eu-central-1)
- IP anonymization in logs
- 180-day data retention policy
- Cookie consent enforcement
- Right to deletion support
- Data minimization in headers and cookies

### Cache Optimization

#### Holiday Data Caching
- **API Endpoints**: 24-hour cache with 7-day max
- **Static Assets**: 1-year cache with hash-based versioning
- **German State Data**: Per-state caching optimization

#### Seasonal Adjustments
- **Holiday Planning Peak** (Nov-Jan): Enhanced caching and precomputation
- **Business Hours Optimization**: CET/CEST timezone awareness

### Security Features

#### WAF Rules
- Geographic restriction to DACH + EU + selected markets
- Rate limiting optimized for German business hours
- Holiday planning season-specific rate limits
- GDPR consent enforcement
- Bot protection with German crawler whitelist

#### Security Headers
- Strict Transport Security with preload
- Content Security Policy optimized for German sites
- Frame options and XSS protection
- Custom headers for GDPR compliance indication

## Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **jq** for JSON processing
3. **AWS credentials** with CloudFront, WAF, and Route 53 permissions

### Environment Variables

```bash
export AWS_REGION="eu-central-1"
export ENVIRONMENT="production"
export DRY_RUN="false"  # Set to "true" for testing
```

### Initial Deployment

```bash
# Deploy new CDN configuration
./deploy-cdn.sh

# Dry run (test without creating resources)
DRY_RUN=true ./deploy-cdn.sh
```

### Update Existing Deployment

```bash
# Update existing CDN configuration
export DISTRIBUTION_ID="E1234567890ABC"
./update-cdn.sh
```

## Monitoring and Alerting

### CloudWatch Dashboards

1. **German Performance Dashboard**
   - German edge location latency
   - Core Web Vitals for German users
   - Cache hit rates
   - Performance by German state

2. **GDPR Compliance Dashboard**
   - Data processing location compliance
   - Consent rates by country
   - Data retention compliance
   - Right to deletion requests

### Alert Thresholds

#### Performance Alerts
- **German Edge Latency**: >500ms warning, >800ms critical
- **Cache Hit Rate**: <80% warning, <70% critical
- **Core Web Vitals**: LCP >2.5s, FID >100ms, CLS >0.1

#### Compliance Alerts
- **Non-EU Data Processing**: Immediate alert
- **Data Retention Violation**: <95% compliance
- **GDPR Consent Issues**: Missing consent for German users

## Testing and Validation

### Performance Testing
The deployment scripts include automated performance testing from German locations:

```bash
# Test specific URLs from German edge locations
curl -w '%{time_total}' -s -o /dev/null https://calendar.timebutler.de
```

### GDPR Compliance Testing
- Cookie consent enforcement verification
- Data processing location validation
- Log data minimization checks

### Failover Testing
- Quarterly failover drills
- Chaos engineering scenarios
- Health check validation

## Operational Procedures

### Cache Management

#### Cache Invalidation
```bash
# Invalidate specific paths
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --invalidation-batch 'Paths={Quantity=1,Items=["/api/v1/holidays/*"]},CallerReference=holiday-data-update'
```

#### Cache Warmup (Peak Season)
During holiday planning peak (November-January), cache warmup is automated for:
- German holiday data for all states
- Bridge weekend calculations
- Popular vacation planning combinations

### Seasonal Adjustments

#### Holiday Planning Peak (November-January)
- Reduced rate limits (50% of normal)
- Enhanced monitoring and alerting
- Pre-computed bridge weekend data
- Additional origin capacity

#### Summer Vacation (July-August)
- Normal rate limits
- Reduced monitoring frequency
- Focus on international user experience

## Troubleshooting

### Common Issues

#### High Latency from German Locations
1. Check German edge location health
2. Verify origin shield configuration
3. Review cache hit rates
4. Check for origin performance issues

#### GDPR Compliance Failures
1. Verify data processing location (must be eu-central-1)
2. Check cookie consent enforcement
3. Validate log data anonymization
4. Review data retention policies

#### Cache Miss Issues
1. Check cache policy configuration
2. Verify cache key parameters
3. Review TTL settings
4. Check for cache-busting parameters

### Emergency Procedures

#### Maintenance Mode
To enable emergency maintenance mode:

```bash
# Add maintenance header to WAF
aws wafv2 update-web-acl \
  --scope CLOUDFRONT \
  --region us-east-1 \
  --id YOUR_WAF_ID \
  --add-header "x-maintenance-mode: EMERGENCY_MAINTENANCE_ENABLED"
```

#### Regional Failover
Manual regional failover to eu-west-1:

```bash
# Update origin to failover region
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --distribution-config file://failover-distribution-config.json
```

## Compliance and Security

### Data Protection
- All data processing occurs within EU boundaries
- Personal data is minimized and anonymized
- Retention periods comply with GDPR requirements
- Consent management is enforced at CDN level

### German Cybersecurity Framework
- BSI (Bundesamt für Sicherheit in der Informationstechnik) compliance
- TLS 1.3 preferred, TLS 1.2 minimum
- Strong cipher suites only
- Regular security assessments

### Audit Trail
- All CDN configuration changes are logged
- WAF logs include German market specific events
- Performance metrics are retained for compliance reporting
- Access logs are anonymized and retained for 180 days

## Support and Contact

For CDN-related issues:
- **German Operations**: german-ops@timebutler.de
- **Performance Team**: performance@timebutler.de
- **Compliance Team**: compliance@timebutler.de
- **Emergency**: +49-XXX-XXXXXXX (German business hours: 08:00-19:00 CET)

## Version History

- **v2.0** (2025-01-24): Complete German market optimization with GDPR compliance
- **v1.0** (2024-XX-XX): Initial CDN configuration

---

*This configuration ensures optimal performance and compliance for TimeButler Calendar users in the German market while maintaining the highest standards of data protection and security.*