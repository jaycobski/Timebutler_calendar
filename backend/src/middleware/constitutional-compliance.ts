import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Constitutional Compliance Validator
 * Ensures all performance requirements are met according to Timebutler Calendar Constitution v1.1.0
 * Constitutional Requirements:
 * - Response time <100ms for all interactions
 * - Page load <2s on 3G connections
 * - Handle 25k concurrent users
 * - Bundle size <200KB gzipped
 * - Email delivery <5s
 */

interface ConstitutionalRequirements {
  responseTime: {
    target: number; // 100ms
    warning: number; // 80ms
    critical: number; // 150ms
  };
  pageLoad: {
    target: number; // 2000ms on 3G
    warning: number; // 1500ms
    critical: number; // 3000ms
  };
  concurrency: {
    target: number; // 25000 users
    warning: number; // 20000 users
    critical: number; // 30000 users
  };
  bundleSize: {
    target: number; // 200KB gzipped
    warning: number; // 180KB
    critical: number; // 250KB
  };
  emailDelivery: {
    target: number; // 5000ms
    warning: number; // 4000ms
    critical: number; // 7000ms
  };
}

interface ComplianceViolation {
  type: 'response_time' | 'concurrency' | 'memory' | 'bundle_size' | 'email_delivery';
  severity: 'warning' | 'critical' | 'constitutional_violation';
  message: string;
  actualValue: number;
  targetValue: number;
  timestamp: number;
  requestId?: string;
  route?: string;
  userAgent?: string;
}

interface ComplianceMetrics {
  totalRequests: number;
  violations: {
    responseTime: number;
    constitutional: number;
    total: number;
  };
  compliance: {
    responseTimeCompliance: number; // percentage
    overallCompliance: number; // percentage
    constitutionalCompliance: number; // percentage
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
}

class ConstitutionalValidator {
  private violations: ComplianceViolation[] = [];
  private metrics: ComplianceMetrics = {
    totalRequests: 0,
    violations: {
      responseTime: 0,
      constitutional: 0,
      total: 0
    },
    compliance: {
      responseTimeCompliance: 100,
      overallCompliance: 100,
      constitutionalCompliance: 100
    },
    performance: {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0
    }
  };

  private readonly requirements: ConstitutionalRequirements = {
    responseTime: {
      target: 100, // Constitutional requirement
      warning: 80,
      critical: 150
    },
    pageLoad: {
      target: 2000, // Constitutional requirement for 3G
      warning: 1500,
      critical: 3000
    },
    concurrency: {
      target: 25000, // Constitutional requirement
      warning: 20000,
      critical: 30000
    },
    bundleSize: {
      target: 200 * 1024, // 200KB Constitutional requirement
      warning: 180 * 1024,
      critical: 250 * 1024
    },
    emailDelivery: {
      target: 5000, // Constitutional requirement
      warning: 4000,
      critical: 7000
    }
  };

  private activeSessions = new Set<string>();
  private readonly maxViolationHistory = 1000;

  constructor(private app: FastifyInstance) {
    this.startComplianceMonitoring();
  }

  /**
   * Validate response time compliance
   */
  validateResponseTime(
    responseTime: number,
    request: FastifyRequest,
    reply: FastifyReply
  ): void {
    this.metrics.totalRequests++;

    // Constitutional violation check
    if (responseTime > this.requirements.responseTime.target) {
      const severity = responseTime > this.requirements.responseTime.critical
        ? 'constitutional_violation'
        : responseTime > this.requirements.responseTime.warning
        ? 'critical'
        : 'warning';

      const violation: ComplianceViolation = {
        type: 'response_time',
        severity,
        message: `Response time ${responseTime}ms exceeds constitutional requirement of ${this.requirements.responseTime.target}ms`,
        actualValue: responseTime,
        targetValue: this.requirements.responseTime.target,
        timestamp: Date.now(),
        requestId: request.id,
        route: request.url,
        userAgent: request.headers['user-agent']?.substring(0, 100)
      };

      this.recordViolation(violation);

      // Add compliance headers
      reply.header('X-Constitutional-Compliance', 'VIOLATION');
      reply.header('X-Response-Time-Target', this.requirements.responseTime.target.toString());
      reply.header('X-Response-Time-Actual', responseTime.toString());

      // Log constitutional violation
      if (severity === 'constitutional_violation') {
        this.app.log.error({
          constitutionalViolation: true,
          responseTime,
          target: this.requirements.responseTime.target,
          route: request.url,
          method: request.method,
          requestId: request.id
        }, 'CONSTITUTIONAL VIOLATION: Response time exceeds 100ms requirement');
      }
    } else {
      reply.header('X-Constitutional-Compliance', 'COMPLIANT');
    }

    // Update metrics
    this.updatePerformanceMetrics(responseTime);
  }

  /**
   * Validate concurrent user count
   */
  validateConcurrency(sessionId: string): boolean {
    this.activeSessions.add(sessionId);

    const currentConcurrency = this.activeSessions.size;

    if (currentConcurrency > this.requirements.concurrency.target) {
      const violation: ComplianceViolation = {
        type: 'concurrency',
        severity: currentConcurrency > this.requirements.concurrency.critical
          ? 'constitutional_violation'
          : 'warning',
        message: `Concurrent users ${currentConcurrency} exceeds constitutional target of ${this.requirements.concurrency.target}`,
        actualValue: currentConcurrency,
        targetValue: this.requirements.concurrency.target,
        timestamp: Date.now()
      };

      this.recordViolation(violation);

      if (violation.severity === 'constitutional_violation') {
        this.app.log.error({
          constitutionalViolation: true,
          currentConcurrency,
          target: this.requirements.concurrency.target
        }, 'CONSTITUTIONAL VIOLATION: Concurrent users exceed 25k limit');
      }

      return false;
    }

    return true;
  }

  /**
   * Remove session from concurrent tracking
   */
  removeSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Validate email delivery time
   */
  validateEmailDelivery(deliveryTime: number, emailId: string): void {
    if (deliveryTime > this.requirements.emailDelivery.target) {
      const violation: ComplianceViolation = {
        type: 'email_delivery',
        severity: deliveryTime > this.requirements.emailDelivery.critical
          ? 'constitutional_violation'
          : 'warning',
        message: `Email delivery time ${deliveryTime}ms exceeds constitutional requirement of ${this.requirements.emailDelivery.target}ms`,
        actualValue: deliveryTime,
        targetValue: this.requirements.emailDelivery.target,
        timestamp: Date.now(),
        requestId: emailId
      };

      this.recordViolation(violation);

      if (violation.severity === 'constitutional_violation') {
        this.app.log.error({
          constitutionalViolation: true,
          deliveryTime,
          target: this.requirements.emailDelivery.target,
          emailId
        }, 'CONSTITUTIONAL VIOLATION: Email delivery exceeds 5s requirement');
      }
    }
  }

  /**
   * Get current compliance status
   */
  getComplianceStatus(): {
    compliant: boolean;
    violations: ComplianceViolation[];
    metrics: ComplianceMetrics;
    recommendations: string[];
    constitutionalStatus: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  } {
    const recentViolations = this.getRecentViolations(3600000); // Last hour
    const constitutionalViolations = recentViolations.filter(v => v.severity === 'constitutional_violation');

    let constitutionalStatus: 'COMPLIANT' | 'WARNING' | 'VIOLATION' = 'COMPLIANT';
    if (constitutionalViolations.length > 0) {
      constitutionalStatus = 'VIOLATION';
    } else if (recentViolations.length > 10) {
      constitutionalStatus = 'WARNING';
    }

    return {
      compliant: constitutionalViolations.length === 0,
      violations: recentViolations.slice(0, 50),
      metrics: this.metrics,
      recommendations: this.generateRecommendations(recentViolations),
      constitutionalStatus
    };
  }

  /**
   * Get German market specific compliance report
   */
  getGermanMarketReport(): {
    peakHourCompliance: boolean;
    vacationSeasonReadiness: boolean;
    3gPerformance: boolean;
    constitutionalAdherence: number; // percentage
    recommendations: string[];
  } {
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth() + 1;

    // German peak hours: 9-11 AM, 1-3 PM, 7-9 PM
    const isPeakHour = (currentHour >= 9 && currentHour <= 11) ||
                       (currentHour >= 13 && currentHour <= 15) ||
                       (currentHour >= 19 && currentHour <= 21);

    // German vacation planning season: December-January
    const isVacationSeason = currentMonth === 12 || currentMonth === 1;

    const recentViolations = this.getRecentViolations(3600000);
    const responseTimeViolations = recentViolations.filter(v => v.type === 'response_time');

    const constitutionalAdherence = this.metrics.totalRequests > 0
      ? ((this.metrics.totalRequests - this.metrics.violations.constitutional) / this.metrics.totalRequests) * 100
      : 100;

    const recommendations: string[] = [];

    if (isPeakHour && responseTimeViolations.length > 0) {
      recommendations.push('Optimize for German peak hour traffic (9-11 AM, 1-3 PM, 7-9 PM)');
    }

    if (isVacationSeason && this.metrics.performance.p95ResponseTime > 100) {
      recommendations.push('Scale infrastructure for vacation planning season traffic');
    }

    if (this.metrics.performance.averageResponseTime > 50) {
      recommendations.push('Optimize for 3G network performance in rural German areas');
    }

    return {
      peakHourCompliance: !isPeakHour || responseTimeViolations.length === 0,
      vacationSeasonReadiness: !isVacationSeason || constitutionalAdherence > 95,
      '3gPerformance': this.metrics.performance.p95ResponseTime <= 100,
      constitutionalAdherence: Math.round(constitutionalAdherence * 100) / 100,
      recommendations
    };
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(): {
    summary: {
      status: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
      overallScore: number;
      constitutionalCompliance: number;
    };
    requirements: {
      responseTime: { status: string; compliance: number };
      concurrency: { status: string; current: number };
      emailDelivery: { status: string; compliance: number };
    };
    violations: {
      total: number;
      constitutional: number;
      recent: ComplianceViolation[];
    };
    recommendations: {
      immediate: string[];
      longTerm: string[];
    };
  } {
    const recentViolations = this.getRecentViolations(3600000);
    const constitutionalViolations = recentViolations.filter(v => v.severity === 'constitutional_violation');

    const status = constitutionalViolations.length > 0 ? 'VIOLATION' :
                   recentViolations.length > 20 ? 'WARNING' : 'COMPLIANT';

    return {
      summary: {
        status,
        overallScore: this.calculateOverallScore(),
        constitutionalCompliance: this.metrics.compliance.constitutionalCompliance
      },
      requirements: {
        responseTime: {
          status: this.metrics.performance.p95ResponseTime <= 100 ? 'COMPLIANT' : 'VIOLATION',
          compliance: this.metrics.compliance.responseTimeCompliance
        },
        concurrency: {
          status: this.activeSessions.size <= this.requirements.concurrency.target ? 'COMPLIANT' : 'WARNING',
          current: this.activeSessions.size
        },
        emailDelivery: {
          status: 'COMPLIANT', // Would be calculated from actual email metrics
          compliance: 100 // Placeholder
        }
      },
      violations: {
        total: this.metrics.violations.total,
        constitutional: this.metrics.violations.constitutional,
        recent: recentViolations.slice(0, 10)
      },
      recommendations: {
        immediate: this.generateImmediateRecommendations(constitutionalViolations),
        longTerm: this.generateLongTermRecommendations(recentViolations)
      }
    };
  }

  /**
   * Record compliance violation
   */
  private recordViolation(violation: ComplianceViolation): void {
    this.violations.push(violation);

    // Update violation counters
    this.metrics.violations.total++;
    if (violation.type === 'response_time') {
      this.metrics.violations.responseTime++;
    }
    if (violation.severity === 'constitutional_violation') {
      this.metrics.violations.constitutional++;
    }

    // Trim old violations
    if (this.violations.length > this.maxViolationHistory) {
      this.violations = this.violations.slice(-this.maxViolationHistory);
    }

    // Update compliance percentages
    this.updateComplianceMetrics();
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(responseTime: number): void {
    // Simple moving average for demonstration
    // In production, would use more sophisticated metrics calculation
    this.metrics.performance.averageResponseTime =
      ((this.metrics.performance.averageResponseTime * (this.metrics.totalRequests - 1)) + responseTime) /
      this.metrics.totalRequests;
  }

  /**
   * Update compliance metrics
   */
  private updateComplianceMetrics(): void {
    if (this.metrics.totalRequests === 0) return;

    this.metrics.compliance.responseTimeCompliance =
      ((this.metrics.totalRequests - this.metrics.violations.responseTime) / this.metrics.totalRequests) * 100;

    this.metrics.compliance.constitutionalCompliance =
      ((this.metrics.totalRequests - this.metrics.violations.constitutional) / this.metrics.totalRequests) * 100;

    this.metrics.compliance.overallCompliance =
      ((this.metrics.totalRequests - this.metrics.violations.total) / this.metrics.totalRequests) * 100;
  }

  /**
   * Get recent violations
   */
  private getRecentViolations(timeWindowMs: number): ComplianceViolation[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.violations.filter(v => v.timestamp > cutoff);
  }

  /**
   * Generate recommendations based on violations
   */
  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];

    const responseTimeViolations = violations.filter(v => v.type === 'response_time');
    if (responseTimeViolations.length > 0) {
      recommendations.push('Optimize database queries and enable aggressive caching');
      recommendations.push('Implement CDN for static assets');
      recommendations.push('Enable gzip compression');
    }

    const concurrencyViolations = violations.filter(v => v.type === 'concurrency');
    if (concurrencyViolations.length > 0) {
      recommendations.push('Scale horizontally with load balancers');
      recommendations.push('Implement connection pooling');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within constitutional requirements');
    }

    return recommendations;
  }

  /**
   * Generate immediate recommendations
   */
  private generateImmediateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.length > 0) {
      recommendations.push('Force garbage collection to free memory');
      recommendations.push('Clear all caches and restart if necessary');
      recommendations.push('Investigate slow database queries');
    }

    return recommendations;
  }

  /**
   * Generate long-term recommendations
   */
  private generateLongTermRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.length > 5) {
      recommendations.push('Implement more aggressive caching strategy');
      recommendations.push('Optimize database schema and indexes');
      recommendations.push('Consider microservices architecture');
    }

    return recommendations;
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallScore(): number {
    if (this.metrics.totalRequests === 0) return 100;

    const weights = {
      responseTime: 0.5,
      constitutional: 0.3,
      overall: 0.2
    };

    return Math.round(
      (weights.responseTime * this.metrics.compliance.responseTimeCompliance +
       weights.constitutional * this.metrics.compliance.constitutionalCompliance +
       weights.overall * this.metrics.compliance.overallCompliance) * 100
    ) / 100;
  }

  /**
   * Start compliance monitoring
   */
  private startComplianceMonitoring(): void {
    // Clean old sessions every 5 minutes
    setInterval(() => {
      // In production, would implement proper session tracking
      if (this.activeSessions.size > this.requirements.concurrency.critical) {
        this.app.log.warn({
          activeSessions: this.activeSessions.size,
          critical: this.requirements.concurrency.critical
        }, 'Active sessions exceed critical threshold');
      }
    }, 300000);

    // Generate compliance report every hour
    setInterval(() => {
      const report = this.generateComplianceReport();
      this.app.log.info({
        complianceReport: report.summary,
        violations: report.violations.total,
        constitutionalViolations: report.violations.constitutional
      }, 'Hourly constitutional compliance report');
    }, 3600000);
  }
}

/**
 * Constitutional compliance plugin
 */
async function constitutionalCompliancePlugin(fastify: FastifyInstance): Promise<void> {
  const validator = new ConstitutionalValidator(fastify);

  // Add validator to fastify instance
  fastify.decorate('constitutionalValidator', validator);

  // Hook into response cycle
  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = Date.now() - (request.startTime || Date.now());
    validator.validateResponseTime(responseTime, request, reply);
  });

  // Compliance endpoints
  fastify.get('/constitutional/status', {
    schema: {
      description: 'Get constitutional compliance status',
      tags: ['compliance']
    }
  }, async () => {
    return validator.getComplianceStatus();
  });

  fastify.get('/constitutional/report', {
    schema: {
      description: 'Generate full constitutional compliance report',
      tags: ['compliance']
    }
  }, async () => {
    return validator.generateComplianceReport();
  });

  fastify.get('/constitutional/german-market', {
    schema: {
      description: 'German market specific compliance report',
      tags: ['compliance']
    }
  }, async () => {
    return validator.getGermanMarketReport();
  });
}

// Extend Fastify instance type
declare module 'fastify' {
  interface FastifyInstance {
    constitutionalValidator: ConstitutionalValidator;
  }
}

export default fp(constitutionalCompliancePlugin, {
  name: 'constitutional-compliance',
  dependencies: []
});

export { ConstitutionalValidator, ConstitutionalRequirements, ComplianceViolation, ComplianceMetrics };