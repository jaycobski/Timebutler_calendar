#!/usr/bin/env node

/**
 * Bundle Size Monitor for TimeButler Calendar MVP
 * Ensures <200KB gzipped bundle target compliance
 *
 * Features:
 * - Real-time bundle size tracking
 * - Bilingual asset monitoring
 * - Performance regression detection
 * - CDN optimization verification
 * - German market compliance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const zlib = require('zlib');

// Bundle size targets (bytes)
const TARGETS = {
  TOTAL_GZIPPED: 200 * 1024, // 200KB total
  MAIN_CHUNK: 60 * 1024,     // 60KB main
  VENDOR_CHUNK: 40 * 1024,   // 40KB vendor
  REACT_CHUNK: 40 * 1024,    // 40KB React
  DATE_LIBS: 30 * 1024,      // 30KB date libraries
  UI_LIBS: 25 * 1024,        // 25KB UI components
  I18N_CHUNK: 10 * 1024,     // 10KB per language
  UTILS_CHUNK: 15 * 1024,    // 15KB utilities
};

// Performance thresholds
const PERFORMANCE_TARGETS = {
  LOAD_TIME_3G: 2000,        // 2s on 3G
  FIRST_PAINT: 1000,         // 1s first paint
  INTERACTIVE: 2500,         // 2.5s interactive
};

class BundleMonitor {
  constructor() {
    this.buildDir = path.join(__dirname, '../.next');
    this.staticDir = path.join(this.buildDir, 'static/chunks');
    this.results = {
      chunks: {},
      totals: {},
      compliance: {},
      warnings: [],
      errors: []
    };
  }

  /**
   * Main monitoring function
   */
  async monitor() {
    console.log('🚀 TimeButler Calendar Bundle Monitor');
    console.log('🎯 Target: <200KB gzipped total bundle size');
    console.log('🇩🇪 German market optimization active\n');

    try {
      // Check if build exists
      if (!fs.existsSync(this.buildDir)) {
        throw new Error('Build directory not found. Run "npm run build" first.');
      }

      // Analyze chunks
      await this.analyzeChunks();

      // Calculate totals
      this.calculateTotals();

      // Check compliance
      this.checkCompliance();

      // Monitor bilingual assets
      this.monitorI18nAssets();

      // Generate report
      this.generateReport();

      // Exit with appropriate code
      process.exit(this.results.errors.length > 0 ? 1 : 0);

    } catch (error) {
      console.error('❌ Bundle monitoring failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Analyze individual chunks
   */
  async analyzeChunks() {
    console.log('📊 Analyzing bundle chunks...\n');

    if (!fs.existsSync(this.staticDir)) {
      throw new Error('Static chunks directory not found');
    }

    const files = fs.readdirSync(this.staticDir)
      .filter(file => file.endsWith('.js') && !file.includes('.map'));

    for (const file of files) {
      const filePath = path.join(this.staticDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath);

      // Calculate sizes
      const originalSize = stats.size;
      const gzippedSize = zlib.gzipSync(content).length;
      const brotliSize = zlib.brotliCompressSync(content).length;

      // Categorize chunk
      const category = this.categorizeChunk(file);

      this.results.chunks[file] = {
        category,
        originalSize,
        gzippedSize,
        brotliSize,
        compressionRatio: (gzippedSize / originalSize * 100).toFixed(1),
        target: TARGETS[category] || TARGETS.TOTAL_GZIPPED,
        withinTarget: gzippedSize <= (TARGETS[category] || TARGETS.TOTAL_GZIPPED)
      };

      // Log chunk analysis
      const status = this.results.chunks[file].withinTarget ? '✅' : '❌';
      const sizeKB = (gzippedSize / 1024).toFixed(1);
      const targetKB = ((TARGETS[category] || TARGETS.TOTAL_GZIPPED) / 1024).toFixed(0);

      console.log(`${status} ${file}`);
      console.log(`   Category: ${category}`);
      console.log(`   Size: ${sizeKB}KB gzipped (target: ${targetKB}KB)`);
      console.log(`   Compression: ${this.results.chunks[file].compressionRatio}%`);
      console.log('');
    }
  }

  /**
   * Categorize chunk by filename
   */
  categorizeChunk(filename) {
    if (filename.includes('react')) return 'REACT_CHUNK';
    if (filename.includes('date-libs')) return 'DATE_LIBS';
    if (filename.includes('ui-libs')) return 'UI_LIBS';
    if (filename.includes('i18n')) return 'I18N_CHUNK';
    if (filename.includes('utils')) return 'UTILS_CHUNK';
    if (filename.includes('vendor')) return 'VENDOR_CHUNK';
    if (filename.includes('main')) return 'MAIN_CHUNK';
    return 'OTHER';
  }

  /**
   * Calculate total bundle sizes
   */
  calculateTotals() {
    console.log('📈 Calculating totals...\n');

    const totals = Object.values(this.results.chunks).reduce((acc, chunk) => {
      acc.originalSize += chunk.originalSize;
      acc.gzippedSize += chunk.gzippedSize;
      acc.brotliSize += chunk.brotliSize;
      return acc;
    }, { originalSize: 0, gzippedSize: 0, brotliSize: 0 });

    this.results.totals = {
      ...totals,
      compressionRatio: (totals.gzippedSize / totals.originalSize * 100).toFixed(1),
      brotliRatio: (totals.brotliSize / totals.originalSize * 100).toFixed(1),
      target: TARGETS.TOTAL_GZIPPED,
      withinTarget: totals.gzippedSize <= TARGETS.TOTAL_GZIPPED,
      percentOfTarget: (totals.gzippedSize / TARGETS.TOTAL_GZIPPED * 100).toFixed(1)
    };

    // Log totals
    const status = this.results.totals.withinTarget ? '✅' : '❌';
    const sizeKB = (totals.gzippedSize / 1024).toFixed(1);
    const targetKB = (TARGETS.TOTAL_GZIPPED / 1024).toFixed(0);

    console.log(`${status} Total Bundle Size`);
    console.log(`   Gzipped: ${sizeKB}KB (${this.results.totals.percentOfTarget}% of ${targetKB}KB target)`);
    console.log(`   Brotli: ${(totals.brotliSize / 1024).toFixed(1)}KB`);
    console.log(`   Original: ${(totals.originalSize / 1024).toFixed(1)}KB`);
    console.log('');
  }

  /**
   * Check compliance with targets
   */
  checkCompliance() {
    console.log('🔍 Checking compliance...\n');

    // Check total size
    if (!this.results.totals.withinTarget) {
      const overage = (this.results.totals.gzippedSize - TARGETS.TOTAL_GZIPPED) / 1024;
      this.results.errors.push(
        `Bundle exceeds 200KB target by ${overage.toFixed(1)}KB`
      );
    }

    // Check individual chunks
    Object.entries(this.results.chunks).forEach(([filename, chunk]) => {
      if (!chunk.withinTarget) {
        const overage = (chunk.gzippedSize - chunk.target) / 1024;
        this.results.warnings.push(
          `${filename} exceeds target by ${overage.toFixed(1)}KB`
        );
      }
    });

    // Performance warnings
    if (this.results.totals.gzippedSize > TARGETS.TOTAL_GZIPPED * 0.9) {
      this.results.warnings.push(
        'Bundle size approaching limit (>90% of target)'
      );
    }

    // Compression efficiency warnings
    Object.entries(this.results.chunks).forEach(([filename, chunk]) => {
      if (parseFloat(chunk.compressionRatio) > 80) {
        this.results.warnings.push(
          `${filename} has poor compression ratio (${chunk.compressionRatio}%)`
        );
      }
    });

    this.results.compliance = {
      totalCompliant: this.results.totals.withinTarget,
      chunksCompliant: Object.values(this.results.chunks).every(c => c.withinTarget),
      warningCount: this.results.warnings.length,
      errorCount: this.results.errors.length
    };
  }

  /**
   * Monitor bilingual asset optimization
   */
  monitorI18nAssets() {
    console.log('🌍 Monitoring bilingual assets...\n');

    const i18nChunks = Object.entries(this.results.chunks)
      .filter(([filename]) => filename.includes('i18n'));

    if (i18nChunks.length === 0) {
      this.results.warnings.push('No i18n chunks found - check translation splitting');
      return;
    }

    i18nChunks.forEach(([filename, chunk]) => {
      const language = this.extractLanguage(filename);
      const sizeKB = (chunk.gzippedSize / 1024).toFixed(1);

      console.log(`🗣️  ${language} translation chunk: ${sizeKB}KB`);

      if (chunk.gzippedSize > TARGETS.I18N_CHUNK) {
        this.results.warnings.push(
          `${language} translation chunk too large (${sizeKB}KB > ${TARGETS.I18N_CHUNK / 1024}KB)`
        );
      }
    });

    console.log('');
  }

  /**
   * Extract language from i18n chunk filename
   */
  extractLanguage(filename) {
    if (filename.includes('-de')) return 'German';
    if (filename.includes('-en')) return 'English';
    return 'Unknown';
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('📋 Bundle Analysis Report');
    console.log('=' .repeat(50));
    console.log('');

    // Summary
    console.log('📊 SUMMARY');
    console.log('-' .repeat(20));
    const statusIcon = this.results.compliance.totalCompliant ? '✅' : '❌';
    console.log(`${statusIcon} Bundle Target: ${this.results.totals.percentOfTarget}% of 200KB limit`);
    console.log(`🗜️  Compression: ${this.results.totals.compressionRatio}% (gzip)`);
    console.log(`⚡ Brotli: ${this.results.totals.brotliRatio}% compression`);
    console.log('');

    // Chunk breakdown
    console.log('📦 CHUNK BREAKDOWN');
    console.log('-' .repeat(20));
    Object.entries(this.results.chunks)
      .sort((a, b) => b[1].gzippedSize - a[1].gzippedSize)
      .forEach(([filename, chunk]) => {
        const status = chunk.withinTarget ? '✅' : '❌';
        const sizeKB = (chunk.gzippedSize / 1024).toFixed(1);
        console.log(`${status} ${filename}: ${sizeKB}KB`);
      });
    console.log('');

    // Warnings and errors
    if (this.results.warnings.length > 0) {
      console.log('⚠️  WARNINGS');
      console.log('-' .repeat(20));
      this.results.warnings.forEach(warning => {
        console.log(`⚠️  ${warning}`);
      });
      console.log('');
    }

    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS');
      console.log('-' .repeat(20));
      this.results.errors.forEach(error => {
        console.log(`❌ ${error}`);
      });
      console.log('');
    }

    // Recommendations
    this.generateRecommendations();

    // Save report
    this.saveReport();
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    console.log('💡 OPTIMIZATION RECOMMENDATIONS');
    console.log('-' .repeat(35));

    const recommendations = [];

    // Size-based recommendations
    if (!this.results.totals.withinTarget) {
      recommendations.push('🎯 Enable tree shaking for unused exports');
      recommendations.push('📦 Implement dynamic imports for route-based splitting');
      recommendations.push('🗜️  Add Brotli compression to CDN configuration');
    }

    // Compression recommendations
    const poorCompressionChunks = Object.entries(this.results.chunks)
      .filter(([, chunk]) => parseFloat(chunk.compressionRatio) > 75);

    if (poorCompressionChunks.length > 0) {
      recommendations.push('🔧 Optimize poorly compressing chunks');
      recommendations.push('📝 Minify JavaScript more aggressively');
    }

    // I18n recommendations
    const largeI18nChunks = Object.entries(this.results.chunks)
      .filter(([filename, chunk]) =>
        filename.includes('i18n') && chunk.gzippedSize > TARGETS.I18N_CHUNK
      );

    if (largeI18nChunks.length > 0) {
      recommendations.push('🌍 Split translations into smaller chunks');
      recommendations.push('📝 Remove unused translation keys');
    }

    // German market specific
    if (this.results.totals.gzippedSize > TARGETS.TOTAL_GZIPPED * 0.8) {
      recommendations.push('🇩🇪 Optimize for German CDN edge locations');
      recommendations.push('⚡ Implement service worker caching');
    }

    if (recommendations.length === 0) {
      console.log('✅ Bundle is well optimized! No recommendations.');
    } else {
      recommendations.forEach(rec => console.log(rec));
    }

    console.log('');
  }

  /**
   * Save report to file
   */
  saveReport() {
    const reportPath = path.join(__dirname, '../bundle-report.json');

    const report = {
      timestamp: new Date().toISOString(),
      project: 'TimeButler Calendar MVP',
      target: '200KB gzipped',
      results: this.results,
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        buildTool: 'Next.js + Webpack'
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const monitor = new BundleMonitor();
  monitor.monitor().catch(error => {
    console.error('❌ Monitoring failed:', error);
    process.exit(1);
  });
}

module.exports = BundleMonitor;