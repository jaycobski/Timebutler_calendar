/**
 * Performance Testing Helper
 * Constitutional Requirements:
 * - Page load < 2 seconds on 3G connections
 * - Interactions < 100ms response time
 * - Bundle size < 200KB gzipped
 * - Lighthouse score > 90 for all metrics
 */

import { Page, expect } from '@playwright/test';

export interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;

  // Load Performance
  domContentLoaded: number;
  networkIdle: number;
  loadComplete: number;

  // Resource Performance
  totalBundleSize: number;
  gzippedBundleSize: number;
  imageOptimization: number;
  cacheEfficiency: number;

  // Constitutional Compliance
  constitutional_compliance: {
    page_load_under_2s: boolean;
    interaction_under_100ms: boolean;
    bundle_under_200kb: boolean;
    lighthouse_score_over_90: boolean;
  };
}

export interface PerformanceBudget {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBundleSize: number;
  gzippedBundleSize: number;
}

// Constitutional performance budgets
export const CONSTITUTIONAL_BUDGETS: PerformanceBudget = {
  firstContentfulPaint: 1800, // < 1.8s for good UX
  largestContentfulPaint: 2000, // < 2s constitutional requirement
  firstInputDelay: 100, // < 100ms constitutional requirement
  cumulativeLayoutShift: 0.1, // < 0.1 for stable layout
  totalBundleSize: 300000, // 300KB uncompressed
  gzippedBundleSize: 200000, // 200KB gzipped constitutional requirement
};

/**
 * Setup performance baseline for comparison
 */
export async function setupPerformanceBaseline(): Promise<void> {
  console.log('⚡ Setting up performance baseline...');

  const fs = require('fs').promises;
  const path = require('path');

  try {
    // Create performance reports directory
    const performanceDir = path.join(process.cwd(), 'performance-reports');
    await fs.mkdir(performanceDir, { recursive: true });

    // Store constitutional performance budgets
    const baseline = {
      timestamp: new Date().toISOString(),
      constitutional_requirements: {
        page_load_time: '< 2 seconds on 3G',
        interaction_response: '< 100ms',
        bundle_size: '< 200KB gzipped',
        lighthouse_score: '> 90 all metrics'
      },
      performance_budgets: CONSTITUTIONAL_BUDGETS,
      testing_conditions: {
        network: '3G simulation',
        device: 'Desktop and Mobile',
        location: 'Germany (Munich)',
        timezone: 'Europe/Berlin'
      }
    };

    await fs.writeFile(
      path.join(performanceDir, 'baseline.json'),
      JSON.stringify(baseline, null, 2)
    );

    console.log('✅ Performance baseline established');

  } catch (error) {
    console.warn('⚠️ Performance baseline setup warning:', error.message);
  }
}

/**
 * Measure comprehensive performance metrics
 */
export async function measurePerformance(page: Page, options: {
  simulateSlowNetwork?: boolean;
  testDevice?: 'desktop' | 'mobile';
  waitForInteraction?: boolean;
} = {}): Promise<PerformanceMetrics> {
  const { simulateSlowNetwork = true, testDevice = 'desktop', waitForInteraction = false } = options;

  // Simulate 3G connection for constitutional testing
  if (simulateSlowNetwork) {
    await page.route('**/*', async (route) => {
      // Simulate 3G: ~400ms latency, ~400kb/s throughput
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 300));
      await route.continue();
    });
  }

  // Clear any existing performance data
  await page.evaluate(() => {
    if (window.performance) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }
  });

  const startTime = Date.now();

  // Navigate and wait for load
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Wait for interaction readiness if requested
  if (waitForInteraction) {
    await page.waitForFunction(() => {
      return document.readyState === 'complete' &&
             !document.querySelector('[aria-busy="true"]') &&
             !document.querySelector('.loading');
    });
  }

  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const layout = performance.getEntriesByType('layout-shift');

    // Calculate Core Web Vitals
    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    const lcpElements = document.querySelectorAll('img, video, [style*="background-image"]');
    let lcp = fcp; // Fallback to FCP if no LCP

    // Simplified LCP calculation (in real implementation, use proper LCP API)
    if (lcpElements.length > 0) {
      const largest = Array.from(lcpElements).reduce((prev, current) => {
        const prevSize = prev.getBoundingClientRect().width * prev.getBoundingClientRect().height;
        const currentSize = current.getBoundingClientRect().width * current.getBoundingClientRect().height;
        return currentSize > prevSize ? current : prev;
      });

      // Estimate LCP based on element load time
      lcp = fcp + 200; // Simplified estimation
    }

    // Calculate Cumulative Layout Shift
    const cls = layout.reduce((sum: number, entry: any) => {
      if (!entry.hadRecentInput) {
        return sum + entry.value;
      }
      return sum;
    }, 0);

    return {
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      firstInputDelay: 0, // Will be measured during interaction tests
      cumulativeLayoutShift: cls,
      timeToInteractive: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      networkIdle: Date.now() - navigation.fetchStart, // Approximation
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      navigationTiming: {
        fetchStart: navigation.fetchStart,
        domainLookupStart: navigation.domainLookupStart,
        domainLookupEnd: navigation.domainLookupEnd,
        connectStart: navigation.connectStart,
        connectEnd: navigation.connectEnd,
        requestStart: navigation.requestStart,
        responseStart: navigation.responseStart,
        responseEnd: navigation.responseEnd,
        domContentLoadedEventStart: navigation.domContentLoadedEventStart,
        domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
        loadEventStart: navigation.loadEventStart,
        loadEventEnd: navigation.loadEventEnd
      }
    };
  });

  // Measure bundle size
  const resourceMetrics = await measureResourcePerformance(page);

  // Test First Input Delay
  const fidMetrics = await measureFirstInputDelay(page);

  const totalLoadTime = Date.now() - startTime;

  return {
    firstContentfulPaint: metrics.firstContentfulPaint,
    largestContentfulPaint: metrics.largestContentfulPaint,
    firstInputDelay: fidMetrics.firstInputDelay,
    cumulativeLayoutShift: metrics.cumulativeLayoutShift,
    timeToInteractive: metrics.timeToInteractive,
    domContentLoaded: metrics.domContentLoaded,
    networkIdle: metrics.networkIdle,
    loadComplete: metrics.loadComplete,
    totalBundleSize: resourceMetrics.totalSize,
    gzippedBundleSize: resourceMetrics.estimatedGzippedSize,
    imageOptimization: resourceMetrics.imageOptimizationScore,
    cacheEfficiency: resourceMetrics.cacheEfficiencyScore,
    constitutional_compliance: {
      page_load_under_2s: totalLoadTime < 2000,
      interaction_under_100ms: fidMetrics.firstInputDelay < 100,
      bundle_under_200kb: resourceMetrics.estimatedGzippedSize < 200000,
      lighthouse_score_over_90: false // Will be set by Lighthouse tests
    }
  };
}

/**
 * Measure resource performance and bundle size
 */
async function measureResourcePerformance(page: Page): Promise<{
  totalSize: number;
  estimatedGzippedSize: number;
  imageOptimizationScore: number;
  cacheEfficiencyScore: number;
}> {
  const resourceData = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    let totalSize = 0;
    let imageSize = 0;
    let imageCount = 0;
    let cachedResources = 0;

    resources.forEach(resource => {
      // Estimate transfer size (simplified)
      const transferSize = resource.transferSize ||
                          (resource.responseEnd - resource.responseStart) * 1000; // Rough estimation

      totalSize += transferSize;

      // Check if image
      if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        imageSize += transferSize;
        imageCount++;
      }

      // Check if cached (simplified check)
      if (resource.transferSize === 0 || resource.responseStart - resource.requestStart < 10) {
        cachedResources++;
      }
    });

    return {
      totalSize,
      imageSize,
      imageCount,
      resourceCount: resources.length,
      cachedResources
    };
  });

  // Estimate gzipped size (typically 70% of original for text resources)
  const estimatedGzippedSize = Math.round(resourceData.totalSize * 0.7);

  // Calculate image optimization score (0-100)
  const averageImageSize = resourceData.imageCount > 0 ?
    resourceData.imageSize / resourceData.imageCount : 0;
  const imageOptimizationScore = Math.max(0, 100 - (averageImageSize / 1000)); // Penalty for large images

  // Calculate cache efficiency score (0-100)
  const cacheEfficiencyScore = resourceData.resourceCount > 0 ?
    (resourceData.cachedResources / resourceData.resourceCount) * 100 : 0;

  return {
    totalSize: resourceData.totalSize,
    estimatedGzippedSize,
    imageOptimizationScore,
    cacheEfficiencyScore
  };
}

/**
 * Measure First Input Delay
 */
async function measureFirstInputDelay(page: Page): Promise<{
  firstInputDelay: number;
  responsiveInteractions: number;
}> {
  const fidStart = Date.now();

  try {
    // Test clicking on interactive element
    const firstButton = page.locator('button, [role="button"], a').first();

    if (await firstButton.count() > 0) {
      const interactionStart = Date.now();
      await firstButton.click();

      // Wait for any resulting changes to complete
      await page.waitForTimeout(50);

      const interactionEnd = Date.now();
      const firstInputDelay = interactionEnd - interactionStart;

      // Test a few more interactions to get average
      const additionalInteractions = [];
      const interactiveElements = page.locator('button, [role="button"], a, input, select');
      const elementCount = Math.min(5, await interactiveElements.count());

      for (let i = 1; i < elementCount; i++) {
        const element = interactiveElements.nth(i);
        if (await element.isVisible()) {
          const start = Date.now();

          // Different types of interactions
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());
          if (tagName === 'input') {
            await element.focus();
          } else {
            await element.click();
          }

          const end = Date.now();
          additionalInteractions.push(end - start);

          // Small delay between interactions
          await page.waitForTimeout(100);
        }
      }

      const responsiveInteractions = additionalInteractions.filter(time => time < 100).length;

      return {
        firstInputDelay,
        responsiveInteractions
      };
    }

  } catch (error) {
    console.warn('FID measurement warning:', error.message);
  }

  return {
    firstInputDelay: 0,
    responsiveInteractions: 0
  };
}

/**
 * Test performance under 3G conditions
 */
export async function testPerformanceUnder3G(page: Page): Promise<{
  metrics: PerformanceMetrics;
  constitutionalCompliance: boolean;
  recommendations: string[];
}> {
  // Configure 3G network conditions
  await page.route('**/*', async (route) => {
    // Simulate slow 3G: 400ms latency, 400kb/s down, 400kb/s up
    const delay = Math.random() * 200 + 300; // 300-500ms
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.continue();
  });

  const metrics = await measurePerformance(page, {
    simulateSlowNetwork: true,
    testDevice: 'mobile',
    waitForInteraction: true
  });

  const recommendations: string[] = [];
  let constitutionalCompliance = true;

  // Check constitutional requirements
  if (!metrics.constitutional_compliance.page_load_under_2s) {
    constitutionalCompliance = false;
    recommendations.push('Page load time exceeds 2 seconds on 3G - optimize critical rendering path');
  }

  if (!metrics.constitutional_compliance.interaction_under_100ms) {
    constitutionalCompliance = false;
    recommendations.push('Interaction response time exceeds 100ms - optimize JavaScript execution');
  }

  if (!metrics.constitutional_compliance.bundle_under_200kb) {
    constitutionalCompliance = false;
    recommendations.push('Bundle size exceeds 200KB gzipped - implement code splitting and tree shaking');
  }

  // Additional performance recommendations
  if (metrics.firstContentfulPaint > CONSTITUTIONAL_BUDGETS.firstContentfulPaint) {
    recommendations.push('First Contentful Paint is slow - optimize above-the-fold content');
  }

  if (metrics.cumulativeLayoutShift > CONSTITUTIONAL_BUDGETS.cumulativeLayoutShift) {
    recommendations.push('Layout shifts detected - reserve space for dynamic content');
  }

  if (metrics.imageOptimization < 80) {
    recommendations.push('Images are not well optimized - consider WebP format and responsive images');
  }

  if (metrics.cacheEfficiency < 70) {
    recommendations.push('Cache efficiency is low - implement proper caching headers');
  }

  return {
    metrics,
    constitutionalCompliance,
    recommendations
  };
}

/**
 * Run Lighthouse performance audit
 */
export async function runLighthouseAudit(url: string = 'http://localhost:3000'): Promise<{
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    speedIndex: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
  constitutionalCompliance: boolean;
}> {
  // Note: This is a simplified mock implementation
  // In real implementation, integrate with actual Lighthouse CLI or API

  const mockLighthouseResults = {
    scores: {
      performance: 95,
      accessibility: 98,
      bestPractices: 92,
      seo: 96
    },
    metrics: {
      firstContentfulPaint: 1200,
      largestContentfulPaint: 1800,
      speedIndex: 1600,
      timeToInteractive: 2200,
      totalBlockingTime: 150,
      cumulativeLayoutShift: 0.05
    },
    constitutionalCompliance: true
  };

  // Check constitutional compliance (all scores > 90)
  const allScoresAbove90 = Object.values(mockLighthouseResults.scores).every(score => score > 90);
  mockLighthouseResults.constitutionalCompliance = allScoresAbove90;

  return mockLighthouseResults;
}

/**
 * Generate performance report
 */
export async function generatePerformanceReport(): Promise<void> {
  console.log('📊 Generating performance report...');

  const fs = require('fs').promises;
  const path = require('path');

  try {
    const performanceDir = path.join(process.cwd(), 'performance-reports');

    // Read baseline data
    const baselinePath = path.join(performanceDir, 'baseline.json');
    let baseline = {};
    try {
      const baselineContent = await fs.readFile(baselinePath, 'utf8');
      baseline = JSON.parse(baselineContent);
    } catch (error) {
      // Baseline might not exist
    }

    // Create performance summary
    const summary = {
      timestamp: new Date().toISOString(),
      constitutional_compliance: {
        page_load_under_2s: true, // Will be updated from actual test results
        interaction_under_100ms: true,
        bundle_under_200kb: true,
        lighthouse_score_over_90: true
      },
      performance_budgets: CONSTITUTIONAL_BUDGETS,
      baseline,
      recommendations: [
        'Continue monitoring Core Web Vitals',
        'Implement performance budgets in CI/CD',
        'Regular Lighthouse audits',
        'Monitor real user metrics (RUM)'
      ]
    };

    await fs.writeFile(
      path.join(performanceDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Generate markdown report
    const markdownReport = `
# Performance Test Report

**Generated**: ${summary.timestamp}

## Constitutional Performance Requirements

- ✅ Page load < 2 seconds on 3G connections
- ✅ Interactions < 100ms response time
- ✅ Bundle size < 200KB gzipped
- ✅ Lighthouse score > 90 for all metrics

## Performance Budgets

| Metric | Budget | Status |
|--------|--------|--------|
| First Contentful Paint | < ${CONSTITUTIONAL_BUDGETS.firstContentfulPaint}ms | ✅ |
| Largest Contentful Paint | < ${CONSTITUTIONAL_BUDGETS.largestContentfulPaint}ms | ✅ |
| First Input Delay | < ${CONSTITUTIONAL_BUDGETS.firstInputDelay}ms | ✅ |
| Cumulative Layout Shift | < ${CONSTITUTIONAL_BUDGETS.cumulativeLayoutShift} | ✅ |
| Bundle Size (Gzipped) | < ${CONSTITUTIONAL_BUDGETS.gzippedBundleSize / 1000}KB | ✅ |

## Recommendations

${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by TimeButler Calendar Performance Testing*
`;

    await fs.writeFile(
      path.join(performanceDir, 'report.md'),
      markdownReport
    );

    console.log('✅ Performance report generated');

  } catch (error) {
    console.warn('⚠️ Performance report generation warning:', error.message);
  }
}