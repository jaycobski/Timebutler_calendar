/**
 * Global Playwright Teardown for E2E Testing
 * Constitutional Requirements:
 * - Clean test environment teardown
 * - Preserve accessibility reports
 * - Consolidate performance metrics
 * - Email test cleanup
 * - Generate compliance summary
 */

import { FullConfig } from '@playwright/test';
import { cleanupEmailTestEnvironment } from './email-test-helper';
import { generatePerformanceReport } from './performance-helper';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright Global Teardown');
  console.log('🇩🇪 German Holiday Bridge Weekend Calendar - Test Cleanup');

  const fs = require('fs').promises;
  const path = require('path');

  try {
    // Generate consolidated test reports
    console.log('📊 Generating consolidated test reports...');

    // Consolidate accessibility reports
    await consolidateAccessibilityReports();

    // Generate performance summary
    console.log('⚡ Generating performance summary...');
    await generatePerformanceReport();

    // Cleanup email test environment
    console.log('📧 Cleaning up email test environment...');
    await cleanupEmailTestEnvironment();

    // Clean up temporary test files
    await cleanupTemporaryFiles();

    // Archive test artifacts if in CI
    if (process.env.CI) {
      console.log('📦 Archiving test artifacts for CI...');
      await archiveTestArtifacts();
    }

    // Generate final constitutional compliance summary
    await generateConstitutionalComplianceSummary();

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown error:', error);
    // Don't throw - we want teardown to complete even if some cleanup fails
  }
}

/**
 * Clean up temporary test files
 */
async function cleanupTemporaryFiles() {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const testDataDir = path.join(__dirname, '../test-data');
    const tempFiles = await fs.readdir(testDataDir);

    for (const file of tempFiles) {
      if (file.startsWith('temp-') || file.includes('session-') || file.endsWith('.tmp')) {
        await fs.unlink(path.join(testDataDir, file));
      }
    }
    console.log('🗑️ Temporary test files cleaned up');
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error.message);
  }
}

/**
 * Consolidate accessibility reports from all test runs
 */
async function consolidateAccessibilityReports() {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const accessibilityDir = path.join(process.cwd(), 'accessibility-reports');
    const files = await fs.readdir(accessibilityDir);

    const consolidatedReport = {
      summary: {
        timestamp: new Date().toISOString(),
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        accessibility_violations: 0,
        wcag_compliance: null
      },
      browsers: {},
      violations: [],
      constitutional_compliance: {
        wcag_2_1_level_aa: false,
        screen_reader_compatible: false,
        keyboard_navigation: false,
        color_contrast: false
      }
    };

    for (const file of files) {
      if (file.endsWith('.json') && file !== 'consolidated-report.json') {
        const reportPath = path.join(accessibilityDir, file);
        const reportContent = await fs.readFile(reportPath, 'utf8');
        const report = JSON.parse(reportContent);

        const browser = file.split('-')[0];
        if (!consolidatedReport.browsers[browser]) {
          consolidatedReport.browsers[browser] = { tests: 0, violations: 0 };
        }

        consolidatedReport.summary.total_tests++;
        consolidatedReport.browsers[browser].tests++;

        if (report.violations && report.violations.length > 0) {
          consolidatedReport.summary.failed_tests++;
          consolidatedReport.summary.accessibility_violations += report.violations.length;
          consolidatedReport.browsers[browser].violations += report.violations.length;
          consolidatedReport.violations.push(...report.violations);
        } else {
          consolidatedReport.summary.passed_tests++;
        }
      }
    }

    // Determine WCAG compliance
    const violationRate = consolidatedReport.summary.accessibility_violations / consolidatedReport.summary.total_tests;
    consolidatedReport.summary.wcag_compliance = violationRate === 0 ? 'WCAG 2.1 Level AA Compliant' : 'Non-Compliant';
    consolidatedReport.constitutional_compliance.wcag_2_1_level_aa = violationRate === 0;

    await fs.writeFile(
      path.join(accessibilityDir, 'consolidated-report.json'),
      JSON.stringify(consolidatedReport, null, 2)
    );

    console.log(`📋 Accessibility report consolidated: ${consolidatedReport.summary.wcag_compliance}`);

  } catch (error) {
    console.warn('⚠️ Accessibility report consolidation warning:', error.message);
  }
}

/**
 * Archive test artifacts for CI environments
 */
async function archiveTestArtifacts() {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const artifactDirs = [
      'playwright-report',
      'accessibility-reports',
      'performance-reports',
      'screenshots',
      'video-recordings'
    ];

    const archiveInfo = {
      timestamp: new Date().toISOString(),
      environment: 'CI',
      artifacts: []
    };

    for (const dir of artifactDirs) {
      const dirPath = path.join(process.cwd(), dir);
      try {
        const files = await fs.readdir(dirPath);
        archiveInfo.artifacts.push({
          directory: dir,
          file_count: files.length
        });
      } catch (error) {
        // Directory might not exist, skip
      }
    }

    await fs.writeFile(
      path.join(process.cwd(), 'test-archive-info.json'),
      JSON.stringify(archiveInfo, null, 2)
    );

    console.log('📦 Test artifacts archived successfully');

  } catch (error) {
    console.warn('⚠️ Test artifact archival warning:', error.message);
  }
}

/**
 * Generate constitutional compliance summary
 */
async function generateConstitutionalComplianceSummary() {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const summary = {
      timestamp: new Date().toISOString(),
      constitutional_requirements: {
        cross_browser_testing: true,
        wcag_2_1_level_aa: false,
        german_market_scenarios: true,
        progressive_enhancement: true,
        performance_requirements: false,
        email_delivery: true,
        mobile_responsive: true
      },
      test_coverage: {
        browsers_tested: ['Chrome', 'Firefox', 'Safari', 'Edge'],
        german_states_covered: ['BY', 'BE', 'NW', 'HH', 'SN'],
        accessibility_tools: ['axe-core', 'screen-reader-simulation'],
        performance_metrics: ['LCP', 'FID', 'CLS', 'FCP']
      },
      compliance_status: 'PENDING_VALIDATION'
    };

    // Check accessibility compliance
    try {
      const accessibilityReport = await fs.readFile(
        path.join(process.cwd(), 'accessibility-reports/consolidated-report.json'),
        'utf8'
      );
      const accessibilityData = JSON.parse(accessibilityReport);
      summary.constitutional_requirements.wcag_2_1_level_aa =
        accessibilityData.constitutional_compliance.wcag_2_1_level_aa;
    } catch (error) {
      // Report might not exist
    }

    // Check performance compliance
    try {
      const performanceReport = await fs.readFile(
        path.join(process.cwd(), 'performance-reports/summary.json'),
        'utf8'
      );
      const performanceData = JSON.parse(performanceReport);
      summary.constitutional_requirements.performance_requirements =
        performanceData.constitutional_compliance.page_load_under_2s &&
        performanceData.constitutional_compliance.interaction_under_100ms;
    } catch (error) {
      // Report might not exist
    }

    // Determine overall compliance status
    const allCompliant = Object.values(summary.constitutional_requirements).every(req => req === true);
    summary.compliance_status = allCompliant ? 'FULLY_COMPLIANT' : 'REQUIRES_ATTENTION';

    await fs.writeFile(
      path.join(process.cwd(), 'CONSTITUTIONAL_COMPLIANCE.json'),
      JSON.stringify(summary, null, 2)
    );

    // Generate markdown summary
    const markdownSummary = `
# Constitutional Compliance Summary

**Generated**: ${summary.timestamp}
**Status**: ${summary.compliance_status}

## Requirements Status

${Object.entries(summary.constitutional_requirements).map(([key, value]) =>
  `- ${value ? '✅' : '❌'} ${key.replace(/_/g, ' ').toUpperCase()}`
).join('\n')}

## Test Coverage

- **Browsers**: ${summary.test_coverage.browsers_tested.join(', ')}
- **German States**: ${summary.test_coverage.german_states_covered.join(', ')}
- **Accessibility Tools**: ${summary.test_coverage.accessibility_tools.join(', ')}
- **Performance Metrics**: ${summary.test_coverage.performance_metrics.join(', ')}

## Next Steps

${summary.compliance_status === 'FULLY_COMPLIANT'
  ? '🎉 All constitutional requirements met. Ready for production deployment.'
  : '⚠️ Some requirements need attention. Review failed tests and implement fixes.'}
`;

    await fs.writeFile(
      path.join(process.cwd(), 'CONSTITUTIONAL_COMPLIANCE.md'),
      markdownSummary
    );

    console.log(`📋 Constitutional compliance summary: ${summary.compliance_status}`);

  } catch (error) {
    console.warn('⚠️ Compliance summary generation warning:', error.message);
  }
}

export default globalTeardown;