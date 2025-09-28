/**
 * TimeButler Calendar MVP - Error Rate Monitoring and Alerting
 * Real-time monitoring for constitutional compliance during load testing
 */

const fs = require('fs');
const path = require('path');

class ErrorRateMonitor {
  constructor() {
    this.monitoringDir = path.join(__dirname, '../monitoring');
    this.alertsDir = path.join(__dirname, '../alerts');
    this.constitutional = {
      error_rate_threshold: 0.01,    // 1% max error rate
      response_time_threshold: 2000, // 2s max load time on 3G
      email_delivery_threshold: 5000, // 5s max email delivery
      concurrent_users_min: 25000    // 25k min concurrent users
    };
    this.alertsActive = new Set();
    this.metrics = this.initializeMetrics();

    this.ensureDirectories();
    this.startMonitoring();
  }

  ensureDirectories() {
    [this.monitoringDir, this.alertsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  initializeMetrics() {
    return {
      error_count: 0,
      total_requests: 0,
      response_times: [],
      email_delivery_times: [],
      concurrent_users: 0,
      constitutional_violations: [],
      start_time: Date.now(),
      last_updated: Date.now()
    };
  }

  startMonitoring() {
    console.log('🔍 Starting TimeButler Constitutional Error Rate Monitor...');

    // Monitor k6 output files
    this.watchK6Output();

    // Start periodic health checks
    setInterval(() => this.performHealthCheck(), 5000); // Every 5 seconds

    // Start constitutional compliance monitoring
    setInterval(() => this.checkConstitutionalCompliance(), 10000); // Every 10 seconds

    // Generate monitoring reports
    setInterval(() => this.generateMonitoringReport(), 30000); // Every 30 seconds
  }

  watchK6Output() {
    // Watch for k6 output files and parse metrics
    const reportsDir = path.join(__dirname, '../reports');

    if (fs.existsSync(reportsDir)) {
      fs.watch(reportsDir, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          this.processK6Report(path.join(reportsDir, filename));
        }
      });
    }
  }

  processK6Report(filepath) {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const report = JSON.parse(content);

      this.updateMetrics(report);
      this.checkAlerts(report);

    } catch (error) {
      console.error(`Error processing report ${filepath}:`, error.message);
    }
  }

  updateMetrics(report) {
    // Update error metrics
    if (report.constitutional_compliance) {
      this.metrics.error_count += report.constitutional_compliance.total_failures || 0;
      this.metrics.total_requests += report.performance_metrics?.total_requests || 0;
    }

    // Update response times
    if (report.constitutional_compliance?.p95_delivery_time) {
      this.metrics.response_times.push(report.constitutional_compliance.p95_delivery_time);
    }

    // Update email delivery times
    if (report.constitutional_email_compliance?.p95_delivery_time) {
      this.metrics.email_delivery_times.push(report.constitutional_email_compliance.p95_delivery_time);
    }

    // Update concurrent users
    if (report.performance_metrics?.max_concurrent_users) {
      this.metrics.concurrent_users = Math.max(
        this.metrics.concurrent_users,
        report.performance_metrics.max_concurrent_users
      );
    }

    this.metrics.last_updated = Date.now();
  }

  checkAlerts(report) {
    const alerts = [];

    // Constitutional error rate alert
    const currentErrorRate = this.calculateCurrentErrorRate();
    if (currentErrorRate > this.constitutional.error_rate_threshold) {
      alerts.push({
        type: 'CONSTITUTIONAL_VIOLATION',
        severity: 'CRITICAL',
        metric: 'error_rate',
        current_value: currentErrorRate,
        threshold: this.constitutional.error_rate_threshold,
        message: `Error rate ${(currentErrorRate * 100).toFixed(2)}% exceeds constitutional limit of 1%`
      });
    }

    // Response time alert
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > this.constitutional.response_time_threshold) {
      alerts.push({
        type: 'CONSTITUTIONAL_VIOLATION',
        severity: 'CRITICAL',
        metric: 'response_time',
        current_value: avgResponseTime,
        threshold: this.constitutional.response_time_threshold,
        message: `Average response time ${avgResponseTime}ms exceeds constitutional limit of 2000ms`
      });
    }

    // Email delivery alert
    const avgEmailDelivery = this.calculateAverageEmailDelivery();
    if (avgEmailDelivery > this.constitutional.email_delivery_threshold) {
      alerts.push({
        type: 'CONSTITUTIONAL_VIOLATION',
        severity: 'CRITICAL',
        metric: 'email_delivery',
        current_value: avgEmailDelivery,
        threshold: this.constitutional.email_delivery_threshold,
        message: `Average email delivery ${avgEmailDelivery}ms exceeds constitutional limit of 5000ms`
      });
    }

    // Concurrent users alert
    if (this.metrics.concurrent_users < this.constitutional.concurrent_users_min) {
      alerts.push({
        type: 'CONSTITUTIONAL_VIOLATION',
        severity: 'HIGH',
        metric: 'concurrent_users',
        current_value: this.metrics.concurrent_users,
        threshold: this.constitutional.concurrent_users_min,
        message: `Concurrent users ${this.metrics.concurrent_users} below constitutional requirement of 25,000`
      });
    }

    // Process new alerts
    alerts.forEach(alert => this.processAlert(alert));
  }

  processAlert(alert) {
    const alertKey = `${alert.type}_${alert.metric}`;

    if (!this.alertsActive.has(alertKey)) {
      this.alertsActive.add(alertKey);
      this.triggerAlert(alert);
      this.saveAlert(alert);
    }
  }

  triggerAlert(alert) {
    const timestamp = new Date().toISOString();

    console.log('\n' + '🚨'.repeat(20));
    console.log(`🚨 CONSTITUTIONAL VIOLATION ALERT - ${alert.severity}`);
    console.log('🚨'.repeat(20));
    console.log(`⏰ Time: ${timestamp}`);
    console.log(`📊 Metric: ${alert.metric.toUpperCase()}`);
    console.log(`📈 Current: ${alert.current_value}`);
    console.log(`🎯 Threshold: ${alert.threshold}`);
    console.log(`💬 Message: ${alert.message}`);
    console.log('🚨'.repeat(20) + '\n');

    // Send notifications (in production, this would integrate with alerting systems)
    this.sendNotification(alert);
  }

  sendNotification(alert) {
    // Simulate notification system
    const notification = {
      timestamp: new Date().toISOString(),
      alert_type: alert.type,
      severity: alert.severity,
      metric: alert.metric,
      message: alert.message,
      value: alert.current_value,
      threshold: alert.threshold,
      environment: 'load_testing',
      service: 'timebutler_calendar_mvp'
    };

    // In production, integrate with:
    // - Slack/Teams notifications
    // - PagerDuty
    // - Email alerts
    // - SMS alerts for critical issues

    console.log('📧 Notification sent:', notification.message);
  }

  saveAlert(alert) {
    const alertFile = path.join(this.alertsDir, `alert_${Date.now()}.json`);
    const alertData = {
      ...alert,
      timestamp: new Date().toISOString(),
      test_metrics: {
        total_requests: this.metrics.total_requests,
        error_count: this.metrics.error_count,
        concurrent_users: this.metrics.concurrent_users,
        test_duration_ms: Date.now() - this.metrics.start_time
      }
    };

    fs.writeFileSync(alertFile, JSON.stringify(alertData, null, 2));
  }

  performHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      constitutional_compliance: {
        error_rate: this.calculateCurrentErrorRate(),
        response_time: this.calculateAverageResponseTime(),
        email_delivery: this.calculateAverageEmailDelivery(),
        concurrent_users: this.metrics.concurrent_users
      },
      alerts_active: Array.from(this.alertsActive),
      test_duration: Date.now() - this.metrics.start_time,
      last_updated: this.metrics.last_updated
    };

    // Determine overall health
    const errorRate = healthStatus.constitutional_compliance.error_rate;
    const responseTime = healthStatus.constitutional_compliance.response_time;
    const emailDelivery = healthStatus.constitutional_compliance.email_delivery;
    const concurrentUsers = healthStatus.constitutional_compliance.concurrent_users;

    if (errorRate > this.constitutional.error_rate_threshold ||
        responseTime > this.constitutional.response_time_threshold ||
        emailDelivery > this.constitutional.email_delivery_threshold ||
        concurrentUsers < this.constitutional.concurrent_users_min) {
      healthStatus.status = 'constitutional_violation';
    } else if (this.alertsActive.size > 0) {
      healthStatus.status = 'degraded';
    }

    // Save health check
    const healthFile = path.join(this.monitoringDir, 'health_check.json');
    fs.writeFileSync(healthFile, JSON.stringify(healthStatus, null, 2));

    // Log health status
    if (healthStatus.status !== 'healthy') {
      console.log(`⚠️  Health Status: ${healthStatus.status.toUpperCase()}`);
    }
  }

  checkConstitutionalCompliance() {
    const compliance = {
      timestamp: new Date().toISOString(),
      error_rate_compliant: this.calculateCurrentErrorRate() <= this.constitutional.error_rate_threshold,
      response_time_compliant: this.calculateAverageResponseTime() <= this.constitutional.response_time_threshold,
      email_delivery_compliant: this.calculateAverageEmailDelivery() <= this.constitutional.email_delivery_threshold,
      concurrent_users_compliant: this.metrics.concurrent_users >= this.constitutional.concurrent_users_min,
      overall_compliant: false
    };

    compliance.overall_compliant =
      compliance.error_rate_compliant &&
      compliance.response_time_compliant &&
      compliance.email_delivery_compliant &&
      compliance.concurrent_users_compliant;

    // Save compliance check
    const complianceFile = path.join(this.monitoringDir, 'constitutional_compliance.json');
    fs.writeFileSync(complianceFile, JSON.stringify(compliance, null, 2));

    // Log compliance status
    if (!compliance.overall_compliant) {
      console.log(`🏛️  Constitutional Compliance: ${compliance.overall_compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
      console.log('   Requirements Status:');
      console.log(`   - Error Rate: ${compliance.error_rate_compliant ? '✅' : '❌'}`);
      console.log(`   - Response Time: ${compliance.response_time_compliant ? '✅' : '❌'}`);
      console.log(`   - Email Delivery: ${compliance.email_delivery_compliant ? '✅' : '❌'}`);
      console.log(`   - Concurrent Users: ${compliance.concurrent_users_compliant ? '✅' : '❌'}`);
    }
  }

  generateMonitoringReport() {
    const report = {
      timestamp: new Date().toISOString(),
      test_duration_minutes: (Date.now() - this.metrics.start_time) / 60000,
      current_metrics: {
        error_rate: this.calculateCurrentErrorRate(),
        total_requests: this.metrics.total_requests,
        error_count: this.metrics.error_count,
        avg_response_time: this.calculateAverageResponseTime(),
        avg_email_delivery: this.calculateAverageEmailDelivery(),
        max_concurrent_users: this.metrics.concurrent_users
      },
      constitutional_status: {
        error_rate_threshold: this.constitutional.error_rate_threshold,
        response_time_threshold: this.constitutional.response_time_threshold,
        email_delivery_threshold: this.constitutional.email_delivery_threshold,
        concurrent_users_min: this.constitutional.concurrent_users_min
      },
      alerts_summary: {
        total_alerts: this.alertsActive.size,
        active_alerts: Array.from(this.alertsActive),
        critical_alerts: Array.from(this.alertsActive).filter(alert => alert.includes('CRITICAL')).length
      },
      performance_trends: {
        error_rate_trend: this.calculateErrorRateTrend(),
        response_time_trend: this.calculateResponseTimeTrend(),
        email_delivery_trend: this.calculateEmailDeliveryTrend()
      }
    };

    // Save monitoring report
    const reportFile = path.join(this.monitoringDir, `monitoring_report_${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Save latest report
    const latestReportFile = path.join(this.monitoringDir, 'latest_monitoring_report.json');
    fs.writeFileSync(latestReportFile, JSON.stringify(report, null, 2));

    // Log key metrics every minute
    if (Math.floor(Date.now() / 60000) % 1 === 0) {
      console.log('\n📊 MONITORING REPORT');
      console.log(`⏱️  Test Duration: ${report.test_duration_minutes.toFixed(1)} minutes`);
      console.log(`📈 Requests: ${report.current_metrics.total_requests}`);
      console.log(`❌ Errors: ${report.current_metrics.error_count} (${(report.current_metrics.error_rate * 100).toFixed(2)}%)`);
      console.log(`⚡ Response Time: ${report.current_metrics.avg_response_time.toFixed(1)}ms`);
      console.log(`📧 Email Delivery: ${report.current_metrics.avg_email_delivery.toFixed(1)}ms`);
      console.log(`👥 Max Users: ${report.current_metrics.max_concurrent_users}`);
      console.log(`🚨 Active Alerts: ${report.alerts_summary.total_alerts}`);
    }
  }

  // Calculation methods
  calculateCurrentErrorRate() {
    return this.metrics.total_requests > 0 ?
      this.metrics.error_count / this.metrics.total_requests : 0;
  }

  calculateAverageResponseTime() {
    const times = this.metrics.response_times;
    return times.length > 0 ?
      times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  calculateAverageEmailDelivery() {
    const times = this.metrics.email_delivery_times;
    return times.length > 0 ?
      times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  calculateErrorRateTrend() {
    // Simple trend calculation - in production, use more sophisticated analysis
    const recent = this.metrics.response_times.slice(-10);
    const older = this.metrics.response_times.slice(-20, -10);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, time) => sum + time, 0) / recent.length;
    const olderAvg = older.reduce((sum, time) => sum + time, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  calculateResponseTimeTrend() {
    return this.calculateErrorRateTrend(); // Same logic for now
  }

  calculateEmailDeliveryTrend() {
    return this.calculateErrorRateTrend(); // Same logic for now
  }

  // Cleanup and shutdown
  shutdown() {
    console.log('🛑 Shutting down Error Rate Monitor...');

    // Generate final report
    const finalReport = {
      timestamp: new Date().toISOString(),
      test_summary: {
        total_duration_minutes: (Date.now() - this.metrics.start_time) / 60000,
        total_requests: this.metrics.total_requests,
        total_errors: this.metrics.error_count,
        final_error_rate: this.calculateCurrentErrorRate(),
        max_concurrent_users: this.metrics.concurrent_users,
        constitutional_violations: this.metrics.constitutional_violations.length
      },
      constitutional_compliance_summary: {
        error_rate_compliant: this.calculateCurrentErrorRate() <= this.constitutional.error_rate_threshold,
        response_time_compliant: this.calculateAverageResponseTime() <= this.constitutional.response_time_threshold,
        email_delivery_compliant: this.calculateAverageEmailDelivery() <= this.constitutional.email_delivery_threshold,
        concurrent_users_compliant: this.metrics.concurrent_users >= this.constitutional.concurrent_users_min
      },
      alerts_summary: {
        total_alerts_triggered: this.alertsActive.size,
        final_active_alerts: Array.from(this.alertsActive)
      }
    };

    const finalReportFile = path.join(this.monitoringDir, 'final_monitoring_report.json');
    fs.writeFileSync(finalReportFile, JSON.stringify(finalReport, null, 2));

    console.log('✅ Final monitoring report saved');
    console.log(`📊 Test Summary: ${finalReport.test_summary.total_requests} requests, ${finalReport.test_summary.total_errors} errors`);
    console.log(`🏛️  Constitutional Compliance: ${Object.values(finalReport.constitutional_compliance_summary).every(c => c) ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  if (global.errorMonitor) {
    global.errorMonitor.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (global.errorMonitor) {
    global.errorMonitor.shutdown();
  }
  process.exit(0);
});

// CLI execution
if (require.main === module) {
  global.errorMonitor = new ErrorRateMonitor();

  console.log('Press Ctrl+C to stop monitoring...');

  // Keep the process running
  setInterval(() => {}, 1000);
}

module.exports = ErrorRateMonitor;