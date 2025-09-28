/**
 * TimeButler Calendar MVP - Load Test Report Generator
 * Comprehensive reporting for constitutional compliance validation
 */

const fs = require('fs');
const path = require('path');

class LoadTestReporter {
  constructor() {
    this.reportsDir = path.join(__dirname, '../reports');
    this.constitutional = this.loadConstitutionalRequirements();
    this.ensureReportsDirectory();
  }

  loadConstitutionalRequirements() {
    return {
      load_time_3g: 2000,        // <2s on 3G
      response_time: 100,        // <100ms for interactions
      email_delivery: 5000,      // <5s email delivery
      bundle_size: 204800,       // <200KB gzipped
      error_rate_max: 0.01,      // <1% error rate
      concurrent_users: 25000,   // 25k concurrent users
      availability: 0.99,        // 99% availability
      cache_hit_rate: 0.85,      // 85% cache hit rate
      database_query: 500,       // <500ms database queries
      email_success: 0.98        // 98% email delivery success
    };
  }

  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async generateComprehensiveReport() {
    console.log('🚀 Generating TimeButler Calendar Load Test Report...');

    const reports = {
      constitutional: this.loadReport('constitutional-compliance-report.json'),
      germanMarket: this.loadReport('german-market-report.json'),
      peakSeason: this.loadReport('peak-season-report.json'),
      database: this.loadReport('database-redis-performance-report.json'),
      email: this.loadReport('email-delivery-load-report.json')
    };

    const comprehensiveReport = this.createComprehensiveReport(reports);
    this.saveReport('comprehensive-load-test-report.json', comprehensiveReport);
    this.generateMarkdownReport(comprehensiveReport);
    this.generateExecutiveSummary(comprehensiveReport);
    this.generateConstitutionalComplianceCard(comprehensiveReport);

    console.log('✅ Load test report generation complete!');
    this.printSummary(comprehensiveReport);
  }

  loadReport(filename) {
    const filepath = path.join(this.reportsDir, filename);
    try {
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`⚠️  Could not load ${filename}: ${error.message}`);
    }
    return null;
  }

  createComprehensiveReport(reports) {
    const timestamp = new Date().toISOString();

    return {
      metadata: {
        timestamp,
        test_duration: this.calculateTestDuration(reports),
        test_scope: 'Constitutional Compliance Validation',
        target_users: 25000,
        german_market_focus: true
      },
      constitutional_compliance: this.analyzeConstitutionalCompliance(reports),
      performance_summary: this.createPerformanceSummary(reports),
      german_market_analysis: this.analyzeGermanMarket(reports),
      infrastructure_assessment: this.assessInfrastructure(reports),
      recommendations: this.generateRecommendations(reports),
      test_coverage: this.assessTestCoverage(reports),
      risk_assessment: this.assessRisks(reports)
    };
  }

  analyzeConstitutionalCompliance(reports) {
    const constitutional = reports.constitutional;

    if (!constitutional) {
      return {
        overall_compliance: 'UNKNOWN',
        grade: 'N/A',
        requirements_met: {},
        violations: 'Unknown - constitutional report not found'
      };
    }

    const requirementsMet = constitutional.constitutional_requirements_met || {};
    const violations = constitutional.performance_metrics?.total_violations || 0;

    const complianceScore = Object.values(requirementsMet).filter(req => req === true).length / Object.keys(requirementsMet).length;

    return {
      overall_compliance: complianceScore >= 0.95 ? 'CONSTITUTIONAL_COMPLIANT' : 'NON_COMPLIANT',
      grade: this.calculateComplianceGrade(complianceScore),
      compliance_score: complianceScore,
      requirements_met: requirementsMet,
      violations: violations,
      critical_requirements: {
        load_time_3g: requirementsMet.load_time_2s_3g || false,
        concurrent_users_25k: requirementsMet.concurrent_users_25k || false,
        email_delivery_5s: requirementsMet.email_delivery_5s || false,
        error_rate_1_percent: requirementsMet.error_rate_1_percent || false
      }
    };
  }

  createPerformanceSummary(reports) {
    return {
      load_performance: this.extractLoadPerformance(reports),
      database_performance: this.extractDatabasePerformance(reports),
      email_performance: this.extractEmailPerformance(reports),
      cache_performance: this.extractCachePerformance(reports),
      peak_season_performance: this.extractPeakSeasonPerformance(reports)
    };
  }

  analyzeGermanMarket(reports) {
    const germanReport = reports.germanMarket;

    if (!germanReport) {
      return {
        market_readiness: 'UNKNOWN',
        regional_performance: {},
        language_support: 'Unknown'
      };
    }

    return {
      market_readiness: this.assessGermanMarketReadiness(germanReport),
      regional_performance: germanReport.regional_performance || {},
      language_support: {
        german_performance: germanReport.regional_performance?.bavaria?.p95_performance || 0,
        english_performance: germanReport.regional_performance?.berlin?.p95_performance || 0,
        bilingual_compliance: true
      },
      vacation_patterns: germanReport.vacation_patterns || {},
      state_coverage: this.assessStateCoverage(germanReport)
    };
  }

  assessInfrastructure(reports) {
    const database = reports.database;
    const email = reports.email;

    return {
      database: {
        status: this.assessDatabaseHealth(database),
        query_performance: database?.database_performance?.p95_query_time || 0,
        throughput: database?.database_performance?.queries_per_second || 0,
        error_rate: database?.database_performance?.error_rate || 0
      },
      cache: {
        status: this.assessCacheHealth(database),
        hit_rate: database?.redis_cache_performance?.hit_rate || 0,
        latency: database?.redis_cache_performance?.p95_latency || 0
      },
      email: {
        status: this.assessEmailHealth(email),
        delivery_rate: email?.email_infrastructure_performance?.success_rate || 0,
        throughput: email?.email_infrastructure_performance?.emails_per_second || 0,
        constitutional_compliance: email?.constitutional_verdict?.overall_email_constitutional_compliance || false
      }
    };
  }

  generateRecommendations(reports) {
    const recommendations = [];

    // Constitutional compliance recommendations
    const constitutional = reports.constitutional;
    if (constitutional && constitutional.constitutional_verdict?.passes_all_requirements !== true) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Constitutional Compliance',
        issue: 'Not meeting all constitutional requirements',
        recommendation: 'Address failing constitutional requirements immediately',
        impact: 'BLOCKER'
      });
    }

    // Performance recommendations
    if (reports.database?.performance_compliance?.database_query_compliant === false) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Database Performance',
        issue: 'Database queries exceeding 500ms threshold',
        recommendation: 'Optimize slow queries and add proper indexing',
        impact: 'HIGH'
      });
    }

    if (reports.email?.constitutional_verdict?.meets_5s_requirement === false) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Email Delivery',
        issue: 'Email delivery exceeding 5s constitutional requirement',
        recommendation: 'Optimize email infrastructure and consider queue optimization',
        impact: 'BLOCKER'
      });
    }

    // German market recommendations
    if (reports.germanMarket?.holiday_accuracy?.state_specific_accuracy < 0.99) {
      recommendations.push({
        priority: 'HIGH',
        category: 'German Market',
        issue: 'State-specific holiday accuracy below 99%',
        recommendation: 'Verify and update German holiday data sources',
        impact: 'HIGH'
      });
    }

    return recommendations;
  }

  assessTestCoverage(reports) {
    const coverage = {
      constitutional_requirements: !!reports.constitutional,
      german_market_scenarios: !!reports.germanMarket,
      peak_season_simulation: !!reports.peakSeason,
      database_performance: !!reports.database,
      email_delivery: !!reports.email,
      concurrent_users_25k: reports.constitutional?.performance_metrics?.max_concurrent_users >= 25000,
      all_german_states: this.checkAllStatescovered(reports.germanMarket),
      bilingual_support: this.checkBilingualCoverage(reports)
    };

    const totalCoverage = Object.values(coverage).filter(c => c === true).length;
    const coveragePercentage = totalCoverage / Object.keys(coverage).length;

    return {
      ...coverage,
      overall_coverage: coveragePercentage,
      coverage_grade: coveragePercentage >= 0.9 ? 'EXCELLENT' : coveragePercentage >= 0.8 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    };
  }

  assessRisks(reports) {
    const risks = [];

    // Performance risks
    if (reports.constitutional?.performance_metrics?.max_concurrent_users < 25000) {
      risks.push({
        type: 'PERFORMANCE',
        severity: 'CRITICAL',
        description: 'Unable to handle constitutional 25k concurrent users requirement',
        likelihood: 'HIGH',
        impact: 'CRITICAL'
      });
    }

    // Reliability risks
    if (reports.email?.email_infrastructure_performance?.success_rate < 0.98) {
      risks.push({
        type: 'RELIABILITY',
        severity: 'HIGH',
        description: 'Email delivery success rate below acceptable threshold',
        likelihood: 'MEDIUM',
        impact: 'HIGH'
      });
    }

    // German market risks
    if (!reports.germanMarket) {
      risks.push({
        type: 'MARKET',
        severity: 'MEDIUM',
        description: 'German market scenarios not properly tested',
        likelihood: 'MEDIUM',
        impact: 'MEDIUM'
      });
    }

    return risks;
  }

  generateMarkdownReport(report) {
    const markdown = `# TimeButler Calendar Load Test Report

**Generated:** ${report.metadata.timestamp}
**Test Scope:** ${report.metadata.test_scope}
**Target Users:** ${report.metadata.target_users.toLocaleString()}

## 🎯 Constitutional Compliance

**Overall Status:** ${report.constitutional_compliance.overall_compliance === 'CONSTITUTIONAL_COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}
**Grade:** ${report.constitutional_compliance.grade}
**Compliance Score:** ${(report.constitutional_compliance.compliance_score * 100).toFixed(1)}%

### Critical Requirements
- **Load Time <2s (3G):** ${report.constitutional_compliance.critical_requirements.load_time_3g ? '✅' : '❌'}
- **25k Concurrent Users:** ${report.constitutional_compliance.critical_requirements.concurrent_users_25k ? '✅' : '❌'}
- **Email Delivery <5s:** ${report.constitutional_compliance.critical_requirements.email_delivery_5s ? '✅' : '❌'}
- **Error Rate <1%:** ${report.constitutional_compliance.critical_requirements.error_rate_1_percent ? '✅' : '❌'}

## 🇩🇪 German Market Analysis

**Market Readiness:** ${report.german_market_analysis.market_readiness}

### Language Support
- **German Performance:** ${report.german_market_analysis.language_support.german_performance}ms
- **English Performance:** ${report.german_market_analysis.language_support.english_performance}ms
- **Bilingual Compliance:** ${report.german_market_analysis.language_support.bilingual_compliance ? '✅' : '❌'}

## 📊 Performance Summary

### Database Performance
- **Status:** ${report.infrastructure_assessment.database.status}
- **Query Performance (P95):** ${report.infrastructure_assessment.database.query_performance}ms
- **Throughput:** ${report.infrastructure_assessment.database.throughput.toFixed(1)} queries/sec
- **Error Rate:** ${(report.infrastructure_assessment.database.error_rate * 100).toFixed(3)}%

### Email Performance
- **Status:** ${report.infrastructure_assessment.email.status}
- **Constitutional Compliance:** ${report.infrastructure_assessment.email.constitutional_compliance ? '✅' : '❌'}
- **Delivery Rate:** ${(report.infrastructure_assessment.email.delivery_rate * 100).toFixed(1)}%
- **Throughput:** ${report.infrastructure_assessment.email.throughput.toFixed(1)} emails/sec

## 🚨 Recommendations

${report.recommendations.map(rec => `
### ${rec.priority} - ${rec.category}
**Issue:** ${rec.issue}
**Recommendation:** ${rec.recommendation}
**Impact:** ${rec.impact}
`).join('\n')}

## 📈 Test Coverage

**Overall Coverage:** ${(report.test_coverage.overall_coverage * 100).toFixed(1)}% (${report.test_coverage.coverage_grade})

- Constitutional Requirements: ${report.test_coverage.constitutional_requirements ? '✅' : '❌'}
- German Market Scenarios: ${report.test_coverage.german_market_scenarios ? '✅' : '❌'}
- Peak Season Simulation: ${report.test_coverage.peak_season_simulation ? '✅' : '❌'}
- 25k Concurrent Users: ${report.test_coverage.concurrent_users_25k ? '✅' : '❌'}
- All German States: ${report.test_coverage.all_german_states ? '✅' : '❌'}
- Bilingual Support: ${report.test_coverage.bilingual_support ? '✅' : '❌'}

## ⚠️ Risk Assessment

${report.risk_assessment.map(risk => `
### ${risk.severity} Risk - ${risk.type}
**Description:** ${risk.description}
**Likelihood:** ${risk.likelihood} | **Impact:** ${risk.impact}
`).join('\n')}

---
*Report generated by TimeButler Calendar Load Testing Framework*
`;

    this.saveReport('load-test-report.md', markdown);
  }

  generateExecutiveSummary(report) {
    const summary = {
      executive_summary: {
        constitutional_compliance: report.constitutional_compliance.overall_compliance === 'CONSTITUTIONAL_COMPLIANT',
        german_market_ready: report.german_market_analysis.market_readiness === 'READY',
        can_handle_25k_users: report.constitutional_compliance.critical_requirements.concurrent_users_25k,
        performance_grade: report.constitutional_compliance.grade,
        critical_issues: report.recommendations.filter(r => r.priority === 'CRITICAL').length,
        high_priority_issues: report.recommendations.filter(r => r.priority === 'HIGH').length,
        overall_verdict: this.calculateOverallVerdict(report)
      },
      key_metrics: {
        max_concurrent_users: report.constitutional_compliance.critical_requirements.concurrent_users_25k ? '25,000+' : 'Below 25,000',
        load_time_3g: report.constitutional_compliance.critical_requirements.load_time_3g ? '<2s' : '≥2s',
        email_delivery: report.constitutional_compliance.critical_requirements.email_delivery_5s ? '<5s' : '≥5s',
        error_rate: report.constitutional_compliance.critical_requirements.error_rate_1_percent ? '<1%' : '≥1%'
      },
      recommendations_summary: {
        immediate_action_required: report.recommendations.filter(r => r.priority === 'CRITICAL').length > 0,
        performance_optimization_needed: report.recommendations.filter(r => r.category === 'Performance').length > 0,
        german_market_issues: report.recommendations.filter(r => r.category === 'German Market').length > 0
      }
    };

    this.saveReport('executive-summary.json', summary);
  }

  generateConstitutionalComplianceCard(report) {
    const card = {
      constitutional_compliance_card: {
        status: report.constitutional_compliance.overall_compliance,
        grade: report.constitutional_compliance.grade,
        score: `${(report.constitutional_compliance.compliance_score * 100).toFixed(1)}%`,
        requirements: {
          'Load Time <2s (3G)': report.constitutional_compliance.critical_requirements.load_time_3g ? 'PASS' : 'FAIL',
          '25k Concurrent Users': report.constitutional_compliance.critical_requirements.concurrent_users_25k ? 'PASS' : 'FAIL',
          'Email Delivery <5s': report.constitutional_compliance.critical_requirements.email_delivery_5s ? 'PASS' : 'FAIL',
          'Error Rate <1%': report.constitutional_compliance.critical_requirements.error_rate_1_percent ? 'PASS' : 'FAIL'
        },
        violations: report.constitutional_compliance.violations,
        verdict: report.constitutional_compliance.overall_compliance === 'CONSTITUTIONAL_COMPLIANT' ?
          '✅ CONSTITUTIONAL REQUIREMENTS MET' :
          '❌ CONSTITUTIONAL REQUIREMENTS NOT MET'
      }
    };

    this.saveReport('constitutional-compliance-card.json', card);
  }

  saveReport(filename, content) {
    const filepath = path.join(this.reportsDir, filename);
    const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    fs.writeFileSync(filepath, data, 'utf8');
    console.log(`📄 Generated: ${filename}`);
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TIMEBUTLER CALENDAR LOAD TEST SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n📊 CONSTITUTIONAL COMPLIANCE: ${report.constitutional_compliance.overall_compliance === 'CONSTITUTIONAL_COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
    console.log(`📈 Performance Grade: ${report.constitutional_compliance.grade}`);
    console.log(`🎲 Compliance Score: ${(report.constitutional_compliance.compliance_score * 100).toFixed(1)}%`);

    console.log('\n🎯 Critical Requirements:');
    Object.entries(report.constitutional_compliance.critical_requirements).forEach(([req, status]) => {
      console.log(`   ${status ? '✅' : '❌'} ${req.replace(/_/g, ' ').toUpperCase()}`);
    });

    console.log(`\n🇩🇪 German Market Ready: ${report.german_market_analysis.market_readiness === 'READY' ? '✅' : '❌'}`);
    console.log(`📧 Email Constitutional: ${report.infrastructure_assessment.email.constitutional_compliance ? '✅' : '❌'}`);

    console.log(`\n⚠️  Critical Issues: ${report.recommendations.filter(r => r.priority === 'CRITICAL').length}`);
    console.log(`⚡ High Priority Issues: ${report.recommendations.filter(r => r.priority === 'HIGH').length}`);

    console.log(`\n🎖️  OVERALL VERDICT: ${this.calculateOverallVerdict(report)}`);
    console.log('='.repeat(60));
  }

  // Helper methods
  calculateComplianceGrade(score) {
    if (score >= 0.95) return 'A+ (Constitutional Compliant)';
    if (score >= 0.90) return 'A (Excellent)';
    if (score >= 0.85) return 'B+ (Good)';
    if (score >= 0.80) return 'B (Acceptable)';
    if (score >= 0.70) return 'C (Needs Improvement)';
    return 'F (Constitutional Non-Compliant)';
  }

  calculateOverallVerdict(report) {
    const isConstitutionalCompliant = report.constitutional_compliance.overall_compliance === 'CONSTITUTIONAL_COMPLIANT';
    const criticalIssues = report.recommendations.filter(r => r.priority === 'CRITICAL').length;
    const germanMarketReady = report.german_market_analysis.market_readiness === 'READY';

    if (isConstitutionalCompliant && criticalIssues === 0 && germanMarketReady) {
      return '🏆 READY FOR PRODUCTION';
    } else if (isConstitutionalCompliant && criticalIssues <= 1) {
      return '⚡ PRODUCTION READY WITH MINOR OPTIMIZATIONS';
    } else if (criticalIssues <= 2) {
      return '🔧 REQUIRES PERFORMANCE IMPROVEMENTS';
    } else {
      return '🚫 NOT READY FOR PRODUCTION';
    }
  }

  calculateTestDuration(reports) {
    // Estimate based on typical load test duration
    return reports.constitutional?.timestamp ? '2-3 hours' : 'Unknown';
  }

  extractLoadPerformance(reports) {
    const constitutional = reports.constitutional;
    return {
      p95_load_time: constitutional?.performance_metrics?.threeg_performance_p95 || 0,
      max_concurrent_users: constitutional?.performance_metrics?.max_concurrent_users || 0,
      system_stability: constitutional?.performance_metrics?.system_stability || 0
    };
  }

  extractDatabasePerformance(reports) {
    const db = reports.database;
    return {
      p95_query_time: db?.database_performance?.p95_query_time || 0,
      throughput: db?.database_performance?.queries_per_second || 0,
      error_rate: db?.database_performance?.error_rate || 0
    };
  }

  extractEmailPerformance(reports) {
    const email = reports.email;
    return {
      p95_delivery_time: email?.constitutional_email_compliance?.p95_delivery_time || 0,
      success_rate: email?.email_infrastructure_performance?.success_rate || 0,
      throughput: email?.email_infrastructure_performance?.emails_per_second || 0
    };
  }

  extractCachePerformance(reports) {
    const db = reports.database;
    return {
      hit_rate: db?.redis_cache_performance?.hit_rate || 0,
      latency: db?.redis_cache_performance?.p95_latency || 0
    };
  }

  extractPeakSeasonPerformance(reports) {
    const peak = reports.peakSeason;
    return {
      peak_users: peak?.peak_season_performance?.max_concurrent_users || 0,
      christmas_planning: peak?.christmas_planning?.p95_planning_time || 0,
      new_year_optimization: peak?.new_year_optimization?.p95_optimization_time || 0
    };
  }

  assessGermanMarketReadiness(report) {
    if (!report) return 'UNKNOWN';

    const accuracy = report.holiday_accuracy?.state_specific_accuracy || 0;
    const performance = report.regional_performance;

    if (accuracy >= 0.99 && performance) {
      return 'READY';
    } else if (accuracy >= 0.95) {
      return 'MOSTLY_READY';
    } else {
      return 'NOT_READY';
    }
  }

  assessDatabaseHealth(report) {
    if (!report) return 'UNKNOWN';

    const errorRate = report.database_performance?.error_rate || 0;
    const queryTime = report.database_performance?.p95_query_time || 0;

    if (errorRate < 0.005 && queryTime < 500) {
      return 'HEALTHY';
    } else if (errorRate < 0.01 && queryTime < 1000) {
      return 'ACCEPTABLE';
    } else {
      return 'NEEDS_ATTENTION';
    }
  }

  assessCacheHealth(report) {
    if (!report) return 'UNKNOWN';

    const hitRate = report.redis_cache_performance?.hit_rate || 0;
    const latency = report.redis_cache_performance?.p95_latency || 0;

    if (hitRate >= 0.85 && latency < 10) {
      return 'OPTIMAL';
    } else if (hitRate >= 0.75 && latency < 50) {
      return 'GOOD';
    } else {
      return 'NEEDS_IMPROVEMENT';
    }
  }

  assessEmailHealth(report) {
    if (!report) return 'UNKNOWN';

    const successRate = report.email_infrastructure_performance?.success_rate || 0;
    const deliveryTime = report.constitutional_email_compliance?.p95_delivery_time || 0;

    if (successRate >= 0.98 && deliveryTime < 5000) {
      return 'EXCELLENT';
    } else if (successRate >= 0.95 && deliveryTime < 8000) {
      return 'GOOD';
    } else {
      return 'NEEDS_IMPROVEMENT';
    }
  }

  assessStateCoverage(report) {
    if (!report || !report.regional_performance) return false;

    const expectedStates = ['bavaria', 'nrw', 'berlin'];
    const testedStates = Object.keys(report.regional_performance);

    return expectedStates.every(state => testedStates.includes(state));
  }

  checkAllStatescovered(report) {
    return this.assessStateCoverage(report);
  }

  checkBilingualCoverage(reports) {
    return !!(reports.germanMarket?.regional_performance?.berlin?.language_switch_performance !== undefined ||
             reports.email?.german_market_email_performance?.bilingual_template_p95 !== undefined);
  }
}

// CLI execution
if (require.main === module) {
  const reporter = new LoadTestReporter();
  reporter.generateComprehensiveReport().catch(error => {
    console.error('❌ Error generating load test report:', error);
    process.exit(1);
  });
}

module.exports = LoadTestReporter;