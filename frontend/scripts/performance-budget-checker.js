#!/usr/bin/env node

/**
 * Performance Budget Checker for TimeButler Calendar
 * Constitutional requirement: <200KB gzipped bundles, Lighthouse score >90
 * Validates build artifacts against performance budgets
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');
const { execSync } = require('child_process');

// Constitutional performance budgets
const PERFORMANCE_BUDGETS = {
  // Bundle size budgets (constitutional: <200KB gzipped)
  totalGzipped: 204800,        // 200KB total gzipped
  javascriptGzipped: 102400,   // 100KB JS gzipped
  cssGzipped: 51200,           // 50KB CSS gzipped
  imagesTotal: 51200,          // 50KB images

  // Individual file budgets
  mainJsGzipped: 81920,        // 80KB main.js gzipped
  vendorJsGzipped: 61440,      // 60KB vendor.js gzipped
  mainCssGzipped: 20480,       // 20KB main.css gzipped

  // Lighthouse scores (constitutional: >90)
  lighthousePerformance: 90,
  lighthouseAccessibility: 90,
  lighthouseBestPractices: 90,
  lighthouseSeo: 90,

  // Core Web Vitals (constitutional)
  largestContentfulPaint: 2000,  // <2s LCP on 3G
  firstInputDelay: 100,          // <100ms FID
  cumulativeLayoutShift: 0.1,    // <0.1 CLS
};

class PerformanceBudgetChecker {
  constructor() {
    this.buildDir = path.join(process.cwd(), '.next');
    this.staticDir = path.join(this.buildDir, 'static');
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  /**
   * Run complete performance budget check
   */
  async run() {
    console.log('🚀 Starting Performance Budget Check...');
    console.log('Constitutional Requirements: <200KB gzipped, Lighthouse >90\n');

    try {
      // Check if build exists
      if (!fs.existsSync(this.buildDir)) {
        throw new Error('Build directory not found. Run "npm run build" first.');
      }

      // Check bundle sizes
      await this.checkBundleSizes();

      // Check Lighthouse scores
      await this.checkLighthouseScores();

      // Generate report
      this.generateReport();

      // Exit with appropriate code
      process.exit(this.results.failed.length > 0 ? 1 : 0);

    } catch (error) {
      console.error('❌ Performance Budget Check Failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check bundle sizes against budgets
   */
  async checkBundleSizes() {
    console.log('📊 Checking Bundle Sizes...');

    try {
      // Analyze Next.js build
      const buildManifest = this.readBuildManifest();
      const chunkSizes = await this.analyzeChunks();

      // Check total gzipped size
      const totalGzipped = chunkSizes.javascript.gzipped + chunkSizes.css.gzipped;
      this.checkBudget(
        'Total Bundle Size (Gzipped)',
        totalGzipped,
        PERFORMANCE_BUDGETS.totalGzipped,
        'bytes',
        true // Constitutional requirement
      );

      // Check JavaScript budget
      this.checkBudget(
        'JavaScript Bundle (Gzipped)',
        chunkSizes.javascript.gzipped,
        PERFORMANCE_BUDGETS.javascriptGzipped,
        'bytes'
      );

      // Check CSS budget
      this.checkBudget(
        'CSS Bundle (Gzipped)',
        chunkSizes.css.gzipped,
        PERFORMANCE_BUDGETS.cssGzipped,
        'bytes'
      );

      // Check individual large chunks
      for (const [chunkName, chunkData] of Object.entries(chunkSizes.chunks)) {
        if (chunkData.gzipped > 51200) { // Alert for chunks >50KB
          this.results.warnings.push({
            check: `Large Chunk: ${chunkName}`,
            value: chunkData.gzipped,
            budget: 51200,
            unit: 'bytes',
            message: `Chunk "${chunkName}" is ${this.formatBytes(chunkData.gzipped)} gzipped`,
          });
        }
      }

      console.log('✅ Bundle size analysis complete\n');

    } catch (error) {
      console.error('❌ Bundle size check failed:', error.message);
      this.results.failed.push({
        check: 'Bundle Size Analysis',
        error: error.message,
      });
    }
  }

  /**
   * Analyze Next.js chunks and calculate sizes
   */
  async analyzeChunks() {
    const chunkSizes = {
      javascript: { raw: 0, gzipped: 0 },
      css: { raw: 0, gzipped: 0 },
      chunks: {},
    };

    // Find all static files
    const staticFiles = this.findStaticFiles(this.staticDir);

    for (const filePath of staticFiles) {
      const relativePath = path.relative(this.staticDir, filePath);
      const content = fs.readFileSync(filePath);
      const gzippedContent = gzipSync(content);

      const fileSize = {
        raw: content.length,
        gzipped: gzippedContent.length,
      };

      // Categorize by file type
      if (filePath.endsWith('.js')) {
        chunkSizes.javascript.raw += fileSize.raw;
        chunkSizes.javascript.gzipped += fileSize.gzipped;
        chunkSizes.chunks[relativePath] = fileSize;
      } else if (filePath.endsWith('.css')) {
        chunkSizes.css.raw += fileSize.raw;
        chunkSizes.css.gzipped += fileSize.gzipped;
        chunkSizes.chunks[relativePath] = fileSize;
      }
    }

    return chunkSizes;
  }

  /**
   * Find all static files recursively
   */
  findStaticFiles(dir) {
    let files = [];

    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files = files.concat(this.findStaticFiles(fullPath));
      } else if (stat.isFile() && (entry.endsWith('.js') || entry.endsWith('.css'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Read Next.js build manifest
   */
  readBuildManifest() {
    const manifestPath = path.join(this.buildDir, 'build-manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Build manifest not found');
    }
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  }

  /**
   * Check Lighthouse scores
   */
  async checkLighthouseScores() {
    console.log('🔍 Checking Lighthouse Scores...');

    try {
      // Check if Lighthouse report exists
      const reportPath = path.join(process.cwd(), 'lighthouse-report.json');

      if (!fs.existsSync(reportPath)) {
        console.log('⚠️  No Lighthouse report found. Run "npm run lighthouse:local" first.');
        this.results.warnings.push({
          check: 'Lighthouse Scores',
          message: 'No Lighthouse report found. Run lighthouse manually to verify constitutional compliance.',
        });
        return;
      }

      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      const categories = report.categories;

      // Check each category against constitutional requirements
      this.checkBudget(
        'Lighthouse Performance Score',
        Math.round(categories.performance.score * 100),
        PERFORMANCE_BUDGETS.lighthousePerformance,
        'score',
        true // Constitutional requirement
      );

      this.checkBudget(
        'Lighthouse Accessibility Score',
        Math.round(categories.accessibility.score * 100),
        PERFORMANCE_BUDGETS.lighthouseAccessibility,
        'score',
        true // Constitutional requirement
      );

      this.checkBudget(
        'Lighthouse Best Practices Score',
        Math.round(categories['best-practices'].score * 100),
        PERFORMANCE_BUDGETS.lighthouseBestPractices,
        'score',
        true // Constitutional requirement
      );

      this.checkBudget(
        'Lighthouse SEO Score',
        Math.round(categories.seo.score * 100),
        PERFORMANCE_BUDGETS.lighthouseSeo,
        'score',
        true // Constitutional requirement
      );

      // Check Core Web Vitals from audits
      const audits = report.audits;

      if (audits['largest-contentful-paint']) {
        this.checkBudget(
          'Largest Contentful Paint',
          Math.round(audits['largest-contentful-paint'].numericValue),
          PERFORMANCE_BUDGETS.largestContentfulPaint,
          'ms',
          true // Constitutional requirement
        );
      }

      if (audits['first-input-delay']) {
        this.checkBudget(
          'First Input Delay',
          Math.round(audits['first-input-delay'].numericValue),
          PERFORMANCE_BUDGETS.firstInputDelay,
          'ms',
          true // Constitutional requirement
        );
      }

      if (audits['cumulative-layout-shift']) {
        this.checkBudget(
          'Cumulative Layout Shift',
          audits['cumulative-layout-shift'].numericValue,
          PERFORMANCE_BUDGETS.cumulativeLayoutShift,
          'score',
          true // Constitutional requirement
        );
      }

      console.log('✅ Lighthouse score analysis complete\n');

    } catch (error) {
      console.error('❌ Lighthouse check failed:', error.message);
      this.results.failed.push({
        check: 'Lighthouse Analysis',
        error: error.message,
      });
    }
  }

  /**
   * Check a value against budget
   */
  checkBudget(name, value, budget, unit, isConstitutional = false) {
    const passed = unit === 'score' ? value >= budget : value <= budget;
    const result = {
      check: name,
      value,
      budget,
      unit,
      passed,
      constitutional: isConstitutional,
    };

    if (passed) {
      this.results.passed.push(result);
      const mark = isConstitutional ? '🏛️ ' : '✅ ';
      console.log(
        `${mark}${name}: ${this.formatValue(value, unit)} (budget: ${this.formatValue(budget, unit)})`
      );
    } else {
      this.results.failed.push(result);
      const mark = isConstitutional ? '🚨 ' : '❌ ';
      const exceedsBy = unit === 'score' ? budget - value : value - budget;
      console.log(
        `${mark}${name}: ${this.formatValue(value, unit)} (budget: ${this.formatValue(budget, unit)}, exceeds by: ${this.formatValue(exceedsBy, unit)})`
      );
    }
  }

  /**
   * Format value for display
   */
  formatValue(value, unit) {
    switch (unit) {
      case 'bytes':
        return this.formatBytes(value);
      case 'ms':
        return `${value}ms`;
      case 'score':
        return value.toString();
      default:
        return value.toString();
    }
  }

  /**
   * Format bytes with appropriate units
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n📋 Performance Budget Report');
    console.log('='.repeat(50));

    // Constitutional compliance summary
    const constitutionalFailures = this.results.failed.filter(r => r.constitutional);
    const constitutionalPasses = this.results.passed.filter(r => r.constitutional);

    console.log('\n🏛️  CONSTITUTIONAL COMPLIANCE:');
    if (constitutionalFailures.length === 0) {
      console.log('✅ ALL CONSTITUTIONAL REQUIREMENTS MET');
      console.log(`   - Passed ${constitutionalPasses.length} constitutional checks`);
    } else {
      console.log('❌ CONSTITUTIONAL VIOLATIONS DETECTED');
      constitutionalFailures.forEach(failure => {
        console.log(`   - ${failure.check}: FAILED`);
      });
    }

    // Overall summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);

    // Detailed failures
    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILURES:');
      this.results.failed.forEach(failure => {
        if (failure.error) {
          console.log(`   - ${failure.check}: ${failure.error}`);
        } else {
          const exceedsBy = failure.unit === 'score' ? failure.budget - failure.value : failure.value - failure.budget;
          console.log(
            `   - ${failure.check}: ${this.formatValue(failure.value, failure.unit)} ` +
            `(exceeds budget by ${this.formatValue(exceedsBy, failure.unit)})`
          );
        }
      });
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(warning => {
        console.log(`   - ${warning.check}: ${warning.message || 'Check required'}`);
      });
    }

    // Recommendations
    if (this.results.failed.length > 0 || this.results.warnings.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');

      if (this.results.failed.some(f => f.check.includes('Bundle Size'))) {
        console.log('   - Use dynamic imports to reduce bundle size');
        console.log('   - Enable tree shaking and dead code elimination');
        console.log('   - Consider code splitting by routes');
      }

      if (this.results.failed.some(f => f.check.includes('Lighthouse'))) {
        console.log('   - Optimize images and use modern formats (WebP)');
        console.log('   - Minimize render-blocking resources');
        console.log('   - Implement proper caching strategies');
      }

      if (constitutionalFailures.length > 0) {
        console.log('   - 🚨 URGENT: Constitutional violations must be fixed before deployment');
        console.log('   - Review TimeButler Calendar Constitution v1.1.0 requirements');
      }
    }

    console.log('\n' + '='.repeat(50));
  }
}

// Run the checker
const checker = new PerformanceBudgetChecker();
checker.run().catch(error => {
  console.error('❌ Performance Budget Checker crashed:', error);
  process.exit(1);
});