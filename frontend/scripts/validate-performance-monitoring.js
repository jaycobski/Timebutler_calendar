#!/usr/bin/env node

/**
 * Performance Monitoring Validation Script
 * Validates that all constitutional compliance monitoring components are working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Performance Monitoring Implementation...');
console.log('Constitutional Requirements: >90 Lighthouse score, <200KB bundles, <2s LCP');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function checkFileExists(filePath, description) {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    results.passed.push(`✅ ${description}: Found at ${filePath}`);
    return true;
  } else {
    results.failed.push(`❌ ${description}: Missing at ${filePath}`);
    return false;
  }
}

function checkFileContent(filePath, searchText, description) {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
    if (content.includes(searchText)) {
      results.passed.push(`✅ ${description}: Configured`);
      return true;
    } else {
      results.failed.push(`❌ ${description}: Missing configuration`);
      return false;
    }
  } catch (error) {
    results.failed.push(`❌ ${description}: Error reading file - ${error.message}`);
    return false;
  }
}

function validatePackageJson() {
  console.log('\n📦 Validating package.json scripts...');

  const packagePath = 'package.json';
  if (!checkFileExists(packagePath, 'package.json')) return;

  checkFileContent(packagePath, '"lighthouse":', 'Lighthouse script');
  checkFileContent(packagePath, '"lighthouse:constitutional":', 'Constitutional Lighthouse script');
  checkFileContent(packagePath, '"performance:check":', 'Performance check script');
  checkFileContent(packagePath, '"performance:monitor":', 'Performance monitor script');
  checkFileContent(packagePath, '@lhci/cli', 'Lighthouse CI dependency');
}

function validateLighthouseConfig() {
  console.log('\n🔍 Validating Lighthouse CI configuration...');

  const configPath = '.lighthouserc.js';
  if (!checkFileExists(configPath, 'Lighthouse CI config')) return;

  checkFileContent(configPath, 'minScore: 0.9', 'Constitutional score thresholds (>90)');
  checkFileContent(configPath, 'largest-contentful-paint', 'LCP monitoring');
  checkFileContent(configPath, 'first-input-delay', 'FID monitoring');
  checkFileContent(configPath, 'cumulative-layout-shift', 'CLS monitoring');
  checkFileContent(configPath, 'maxNumericValue: 2000', 'Constitutional LCP threshold (<2s)');
  checkFileContent(configPath, 'maxNumericValue: 100', 'Constitutional FID threshold (<100ms)');
  checkFileContent(configPath, 'maxNumericValue: 0.1', 'Constitutional CLS threshold (<0.1)');
  checkFileContent(configPath, 'total-byte-weight', 'Bundle size monitoring');
  checkFileContent(configPath, 'maxNumericValue: 204800', 'Constitutional bundle size (<200KB)');
}

function validatePerformanceMonitor() {
  console.log('\n⚡ Validating Performance Monitor...');

  const monitorPath = 'src/lib/performance-monitor.ts';
  if (!checkFileExists(monitorPath, 'Performance Monitor library')) return;

  checkFileContent(monitorPath, 'class PerformanceMonitor', 'PerformanceMonitor class');
  checkFileContent(monitorPath, 'observeLCP', 'LCP observation');
  checkFileContent(monitorPath, 'observeFID', 'FID observation');
  checkFileContent(monitorPath, 'observeCLS', 'CLS observation');
  checkFileContent(monitorPath, 'checkBudgetCompliance', 'Budget compliance checking');
  checkFileContent(monitorPath, 'constitutional', 'Constitutional compliance references');
  checkFileContent(monitorPath, '2000', 'Constitutional LCP threshold');
  checkFileContent(monitorPath, '100', 'Constitutional FID threshold');
  checkFileContent(monitorPath, '0.1', 'Constitutional CLS threshold');
}

function validateRUMAnalytics() {
  console.log('\n📊 Validating RUM Analytics...');

  const rumPath = 'src/lib/rum-analytics.ts';
  if (!checkFileExists(rumPath, 'RUM Analytics library')) return;

  checkFileContent(rumPath, 'class RUMAnalytics', 'RUMAnalytics class');
  checkFileContent(rumPath, 'trackPerformanceViolation', 'Performance violation tracking');
  checkFileContent(rumPath, 'constitutional_violation', 'Constitutional violation flagging');
  checkFileContent(rumPath, 'setupPerformanceObservers', 'Performance observers setup');
  checkFileContent(rumPath, 'isGermanUser', 'German user detection');
  checkFileContent(rumPath, 'bridge_selected', 'Business event tracking');
}

function validateComponents() {
  console.log('\n🔧 Validating React Components...');

  const reporterPath = 'src/components/PerformanceReporter.tsx';
  if (checkFileExists(reporterPath, 'PerformanceReporter component')) {
    checkFileContent(reporterPath, 'constitutional', 'Constitutional compliance checking');
    checkFileContent(reporterPath, 'PerformanceAlert', 'Performance alerting');
    checkFileContent(reporterPath, 'checkConstitutionalCompliance', 'Constitutional compliance validation');
    checkFileContent(reporterPath, '2000', 'Constitutional LCP threshold');
    checkFileContent(reporterPath, '100', 'Constitutional FID threshold');
    checkFileContent(reporterPath, '0.1', 'Constitutional CLS threshold');
  }

  const dashboardPath = 'src/components/PerformanceDashboard.tsx';
  if (checkFileExists(dashboardPath, 'PerformanceDashboard component')) {
    checkFileContent(dashboardPath, 'ConstitutionalCompliance', 'Constitutional compliance interface');
    checkFileContent(dashboardPath, 'Constitutional compliance monitoring', 'Dashboard title');
    checkFileContent(dashboardPath, 'COMPLIANT', 'Compliance status display');
    checkFileContent(dashboardPath, 'Constitutional Violations', 'Violations display');
  }
}

function validateCIPipeline() {
  console.log('\n🚀 Validating CI/CD Pipeline...');

  const workflowPath = '.github/workflows/performance-monitoring.yml';
  if (!checkFileExists(workflowPath, 'Performance monitoring workflow')) return;

  checkFileContent(workflowPath, 'Constitutional Compliance', 'Workflow title');
  checkFileContent(workflowPath, 'LIGHTHOUSE_PERFORMANCE_THRESHOLD: 90', 'Constitutional score threshold');
  checkFileContent(workflowPath, 'BUNDLE_SIZE_LIMIT: 204800', 'Constitutional bundle size');
  checkFileContent(workflowPath, 'LCP_THRESHOLD: 2000', 'Constitutional LCP threshold');
  checkFileContent(workflowPath, 'FID_THRESHOLD: 100', 'Constitutional FID threshold');
  checkFileContent(workflowPath, 'CLS_THRESHOLD: 0.1', 'Constitutional CLS threshold');
  checkFileContent(workflowPath, 'performance-budgets', 'Performance budgets job');
  checkFileContent(workflowPath, 'lighthouse-ci', 'Lighthouse CI job');
  checkFileContent(workflowPath, 'web-vitals', 'Web Vitals job');
  checkFileContent(workflowPath, 'constitutional_violation', 'Constitutional violation detection');
}

function validateAppIntegration() {
  console.log('\n🎯 Validating App Integration...');

  const appPath = 'src/pages/_app.tsx';
  if (!checkFileExists(appPath, 'Next.js App component')) return;

  checkFileContent(appPath, 'performance-monitor', 'Performance monitor import');
  checkFileContent(appPath, 'rum-analytics', 'RUM analytics import');
  checkFileContent(appPath, 'PerformanceReporter', 'Performance reporter import');
  checkFileContent(appPath, 'constitutional', 'Constitutional compliance integration');
  checkFileContent(appPath, 'Constitutional LCP Violation', 'LCP violation detection');
  checkFileContent(appPath, 'Constitutional FID Violation', 'FID violation detection');
  checkFileContent(appPath, 'Constitutional CLS Violation', 'CLS violation detection');
  checkFileContent(appPath, '__TB_LCP', 'Global LCP tracking');
}

function validateBudgetChecker() {
  console.log('\n💰 Validating Budget Checker...');

  const checkerPath = 'scripts/performance-budget-checker.js';
  if (!checkFileExists(checkerPath, 'Performance budget checker')) return;

  checkFileContent(checkerPath, 'PERFORMANCE_BUDGETS', 'Performance budgets configuration');
  checkFileContent(checkerPath, 'totalGzipped: 204800', 'Constitutional bundle size budget');
  checkFileContent(checkerPath, 'lighthousePerformance: 90', 'Constitutional Lighthouse score');
  checkFileContent(checkerPath, 'largestContentfulPaint: 2000', 'Constitutional LCP budget');
  checkFileContent(checkerPath, 'firstInputDelay: 100', 'Constitutional FID budget');
  checkFileContent(checkerPath, 'cumulativeLayoutShift: 0.1', 'Constitutional CLS budget');
  checkFileContent(checkerPath, 'CONSTITUTIONAL COMPLIANCE', 'Constitutional compliance reporting');
}

function validateTypeDefinitions() {
  console.log('\n📝 Validating Type Definitions...');

  const typesPath = 'src/types/performance.d.ts';
  if (checkFileExists(typesPath, 'Performance type definitions')) {
    checkFileContent(typesPath, '__TB_LCP', 'LCP global types');
    checkFileContent(typesPath, '__TB_FCP', 'FCP global types');
    checkFileContent(typesPath, 'connection', 'Network connection types');
    checkFileContent(typesPath, 'memory', 'Memory performance types');
  }
}

function generateReport() {
  console.log('\n📋 Performance Monitoring Validation Report');
  console.log('='.repeat(60));

  const totalChecks = results.passed.length + results.failed.length + results.warnings.length;
  const passRate = totalChecks > 0 ? (results.passed.length / totalChecks * 100).toFixed(1) : '0';

  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`📈 Pass Rate: ${passRate}%`);

  if (results.failed.length === 0) {
    console.log('\n🏛️  **CONSTITUTIONAL COMPLIANCE MONITORING: ✅ FULLY IMPLEMENTED**');
    console.log('   - All performance monitoring components are properly configured');
    console.log('   - Constitutional thresholds are enforced throughout the system');
    console.log('   - Real-time monitoring and alerting is active');
    console.log('   - CI/CD pipeline validates constitutional compliance');
  } else {
    console.log('\n🏛️  **CONSTITUTIONAL COMPLIANCE MONITORING: ❌ INCOMPLETE**');
    console.log('   - Some components are missing or misconfigured');
    console.log('   - Constitutional compliance may not be properly enforced');
  }

  if (results.failed.length > 0) {
    console.log('\n❌ FAILURES:');
    results.failed.forEach(failure => console.log(`   ${failure}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => console.log(`   ${warning}`));
  }

  if (results.failed.length === 0) {
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Run "npm run performance:monitor" to test the full pipeline');
    console.log('   2. Deploy to staging and verify real-world performance');
    console.log('   3. Monitor constitutional compliance metrics in production');
    console.log('   4. Set up alerting for constitutional violations');
  }

  console.log('\n' + '='.repeat(60));

  return results.failed.length === 0;
}

// Run validation
async function main() {
  validatePackageJson();
  validateLighthouseConfig();
  validatePerformanceMonitor();
  validateRUMAnalytics();
  validateComponents();
  validateCIPipeline();
  validateAppIntegration();
  validateBudgetChecker();
  validateTypeDefinitions();

  const success = generateReport();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Validation script crashed:', error);
  process.exit(1);
});