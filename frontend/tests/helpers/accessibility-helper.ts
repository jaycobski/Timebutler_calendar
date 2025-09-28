/**
 * Accessibility Testing Helper
 * Constitutional Requirements:
 * - WCAG 2.1 Level AA compliance validation
 * - Screen reader compatibility testing
 * - Keyboard navigation validation
 * - Color contrast verification
 * - Progressive enhancement testing
 */

import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface AccessibilityTestOptions {
  includeTags?: string[];
  excludeTags?: string[];
  rules?: Record<string, any>;
  disableRules?: string[];
  locale?: string;
  reportPath?: string;
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string;
  }>;
}

export interface AccessibilityReport {
  url: string;
  timestamp: string;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  wcag_compliance: {
    level_aa: boolean;
    issues_count: number;
    critical_issues: number;
    serious_issues: number;
  };
  constitutional_compliance: {
    screen_reader_compatible: boolean;
    keyboard_navigation: boolean;
    color_contrast: boolean;
    progressive_enhancement: boolean;
  };
}

/**
 * Comprehensive accessibility testing for WCAG 2.1 Level AA compliance
 */
export async function validateAccessibility(
  page: Page,
  options: AccessibilityTestOptions = {}
): Promise<AccessibilityReport> {
  const {
    includeTags = ['wcag2a', 'wcag2aa', 'wcag21aa'],
    excludeTags = [],
    rules = {},
    disableRules = [],
    locale = 'de-DE',
    reportPath
  } = options;

  // Configure axe for German market and WCAG 2.1 Level AA
  const axeBuilder = new AxeBuilder({ page })
    .withTags(includeTags)
    .exclude(excludeTags)
    .disableRules(disableRules)
    .configure({
      locale: locale,
      rules: {
        // Constitutional requirement: WCAG 2.1 Level AA color contrast
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },

        // German market requirements
        'html-has-lang': { enabled: true },
        'valid-lang': { enabled: true },

        // Screen reader compatibility
        'aria-labels': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-valid-attr': { enabled: true },

        // Keyboard navigation
        'keyboard': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'tabindex': { enabled: true },

        // Progressive enhancement
        'noscript': { enabled: true },
        ...rules
      }
    });

  // Run axe accessibility analysis
  const axeResults = await axeBuilder.analyze();

  // Create comprehensive report
  const report: AccessibilityReport = {
    url: page.url(),
    timestamp: new Date().toISOString(),
    violations: axeResults.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact as any,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary || ''
      }))
    })),
    passes: axeResults.passes.length,
    incomplete: axeResults.incomplete.length,
    inapplicable: axeResults.inapplicable.length,
    wcag_compliance: {
      level_aa: axeResults.violations.length === 0,
      issues_count: axeResults.violations.length,
      critical_issues: axeResults.violations.filter(v => v.impact === 'critical').length,
      serious_issues: axeResults.violations.filter(v => v.impact === 'serious').length
    },
    constitutional_compliance: {
      screen_reader_compatible: !axeResults.violations.some(v =>
        ['aria-labels', 'aria-roles', 'image-alt', 'label'].includes(v.id)
      ),
      keyboard_navigation: !axeResults.violations.some(v =>
        ['keyboard', 'focus-order-semantics', 'tabindex'].includes(v.id)
      ),
      color_contrast: !axeResults.violations.some(v =>
        ['color-contrast', 'color-contrast-enhanced'].includes(v.id)
      ),
      progressive_enhancement: !axeResults.violations.some(v =>
        ['noscript'].includes(v.id)
      )
    }
  };

  // Save report if path provided
  if (reportPath) {
    await saveAccessibilityReport(report, reportPath);
  }

  return report;
}

/**
 * Test keyboard navigation for accessibility compliance
 */
export async function testKeyboardNavigation(page: Page): Promise<{
  passed: boolean;
  issues: string[];
  tabOrder: string[];
}> {
  const issues: string[] = [];
  const tabOrder: string[] = [];

  try {
    // Focus on first interactive element
    await page.keyboard.press('Tab');

    let previousElement = null;
    let currentElement = await page.locator(':focus').first();
    let tabCount = 0;
    const maxTabs = 50; // Prevent infinite loops

    while (tabCount < maxTabs) {
      if (await currentElement.count() === 0) {
        issues.push('No focusable element found during keyboard navigation');
        break;
      }

      const tagName = await currentElement.evaluate(el => el.tagName);
      const ariaLabel = await currentElement.getAttribute('aria-label');
      const id = await currentElement.getAttribute('id');
      const className = await currentElement.getAttribute('class');

      // Build element identifier
      let elementId = tagName;
      if (ariaLabel) elementId += `[aria-label="${ariaLabel}"]`;
      if (id) elementId += `[id="${id}"]`;
      if (className) elementId += `.${className.split(' ')[0]}`;

      tabOrder.push(elementId);

      // Check if element is visible
      const isVisible = await currentElement.isVisible();
      if (!isVisible) {
        issues.push(`Focused element is not visible: ${elementId}`);
      }

      // Check if element has proper focus indicator
      const hasOutline = await currentElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || styles.boxShadow !== 'none';
      });

      if (!hasOutline) {
        issues.push(`Element lacks visible focus indicator: ${elementId}`);
      }

      previousElement = currentElement;
      await page.keyboard.press('Tab');

      const newElement = await page.locator(':focus').first();

      // Check if we've looped back to start or reached end
      if (await newElement.count() === 0 ||
          await newElement.evaluate(el => el === document.body)) {
        break;
      }

      currentElement = newElement;
      tabCount++;
    }

    // Test reverse tab navigation
    await page.keyboard.press('Shift+Tab');
    const reverseElement = await page.locator(':focus').first();

    if (await reverseElement.count() > 0 && previousElement) {
      const isSame = await reverseElement.evaluate((el, prev) => el === prev,
        await previousElement.elementHandle());

      if (!isSame) {
        issues.push('Reverse tab navigation does not work correctly');
      }
    }

  } catch (error) {
    issues.push(`Keyboard navigation test failed: ${error.message}`);
  }

  return {
    passed: issues.length === 0,
    issues,
    tabOrder
  };
}

/**
 * Test screen reader compatibility
 */
export async function testScreenReaderCompatibility(page: Page): Promise<{
  passed: boolean;
  issues: string[];
  landmarks: string[];
  headingStructure: Array<{ level: number; text: string }>;
}> {
  const issues: string[] = [];

  // Test semantic landmarks
  const landmarks = await page.evaluate(() => {
    const landmarkElements = document.querySelectorAll('main, nav, aside, section, article, header, footer, [role]');
    return Array.from(landmarkElements).map(el => {
      const tagName = el.tagName.toLowerCase();
      const role = el.getAttribute('role');
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledby = el.getAttribute('aria-labelledby');

      let identifier = role || tagName;
      if (ariaLabel) identifier += ` "${ariaLabel}"`;
      if (ariaLabelledby) identifier += ` (labelledby: ${ariaLabelledby})`;

      return identifier;
    });
  });

  if (landmarks.length === 0) {
    issues.push('No semantic landmarks found - screen readers need structural navigation');
  }

  // Test heading structure
  const headingStructure = await page.evaluate(() => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(headings).map(heading => ({
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent?.trim() || ''
    }));
  });

  // Validate heading hierarchy
  if (headingStructure.length === 0) {
    issues.push('No headings found - screen readers need heading navigation');
  } else {
    const h1Count = headingStructure.filter(h => h.level === 1).length;
    if (h1Count === 0) {
      issues.push('No H1 heading found - page should have exactly one H1');
    } else if (h1Count > 1) {
      issues.push(`Multiple H1 headings found (${h1Count}) - should have exactly one`);
    }

    // Check for skipped heading levels
    for (let i = 1; i < headingStructure.length; i++) {
      const current = headingStructure[i].level;
      const previous = headingStructure[i - 1].level;

      if (current > previous + 1) {
        issues.push(`Heading level skipped: H${previous} followed by H${current}`);
      }
    }
  }

  // Test alt text for images
  const imagesWithoutAlt = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    return Array.from(images).filter(img =>
      !img.hasAttribute('alt') ||
      (img.getAttribute('alt') === '' && !img.hasAttribute('role'))
    ).length;
  });

  if (imagesWithoutAlt > 0) {
    issues.push(`${imagesWithoutAlt} images without proper alt text`);
  }

  // Test form labels
  const unlabeledInputs = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, select, textarea');
    return Array.from(inputs).filter(input => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                      input.closest('label') ||
                      input.hasAttribute('aria-label') ||
                      input.hasAttribute('aria-labelledby');
      return !hasLabel && input.type !== 'hidden';
    }).length;
  });

  if (unlabeledInputs > 0) {
    issues.push(`${unlabeledInputs} form inputs without proper labels`);
  }

  return {
    passed: issues.length === 0,
    issues,
    landmarks,
    headingStructure
  };
}

/**
 * Test color contrast for WCAG 2.1 Level AA compliance
 */
export async function testColorContrast(page: Page): Promise<{
  passed: boolean;
  issues: string[];
  contrastRatios: Array<{
    element: string;
    foreground: string;
    background: string;
    ratio: number;
    minimumRequired: number;
    passed: boolean;
  }>;
}> {
  const contrastResults = await page.evaluate(() => {
    // Simple color contrast checking implementation
    function getLuminance(r: number, g: number, b: number): number {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function getContrastRatio(color1: number[], color2: number[]): number {
      const lum1 = getLuminance(color1[0], color1[1], color1[2]);
      const lum2 = getLuminance(color2[0], color2[1], color2[2]);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    }

    function parseColor(color: string): number[] | null {
      // Simple RGB extraction - in real implementation, use more robust parsing
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
    }

    const textElements = document.querySelectorAll('*');
    const results: any[] = [];

    Array.from(textElements).forEach(element => {
      const el = element as HTMLElement;
      if (el.textContent && el.textContent.trim()) {
        const styles = window.getComputedStyle(el);
        const foreground = parseColor(styles.color);
        const background = parseColor(styles.backgroundColor);

        if (foreground && background) {
          const ratio = getContrastRatio(foreground, background);
          const fontSize = parseInt(styles.fontSize);
          const fontWeight = styles.fontWeight;
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
          const minimumRequired = isLargeText ? 3.0 : 4.5; // WCAG 2.1 Level AA requirements

          results.push({
            element: el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ')[0]}` : ''),
            foreground: styles.color,
            background: styles.backgroundColor,
            ratio: Math.round(ratio * 100) / 100,
            minimumRequired,
            passed: ratio >= minimumRequired
          });
        }
      }
    });

    return results;
  });

  const issues = contrastResults
    .filter(result => !result.passed)
    .map(result =>
      `${result.element}: contrast ratio ${result.ratio} is below required ${result.minimumRequired}`
    );

  return {
    passed: issues.length === 0,
    issues,
    contrastRatios: contrastResults
  };
}

/**
 * Save accessibility report to file
 */
async function saveAccessibilityReport(report: AccessibilityReport, reportPath: string): Promise<void> {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    // Ensure directory exists
    const dir = path.dirname(reportPath);
    await fs.mkdir(dir, { recursive: true });

    // Save JSON report
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate human-readable report
    const readableReport = generateReadableAccessibilityReport(report);
    const readablePath = reportPath.replace('.json', '.md');
    await fs.writeFile(readablePath, readableReport);

  } catch (error) {
    console.warn('Warning: Could not save accessibility report:', error.message);
  }
}

/**
 * Generate human-readable accessibility report
 */
function generateReadableAccessibilityReport(report: AccessibilityReport): string {
  return `
# Accessibility Test Report

**URL**: ${report.url}
**Generated**: ${report.timestamp}

## WCAG 2.1 Level AA Compliance

${report.wcag_compliance.level_aa ? '✅ **COMPLIANT**' : '❌ **NON-COMPLIANT**'}

- **Total Issues**: ${report.wcag_compliance.issues_count}
- **Critical Issues**: ${report.wcag_compliance.critical_issues}
- **Serious Issues**: ${report.wcag_compliance.serious_issues}

## Constitutional Compliance Status

- ${report.constitutional_compliance.screen_reader_compatible ? '✅' : '❌'} Screen Reader Compatible
- ${report.constitutional_compliance.keyboard_navigation ? '✅' : '❌'} Keyboard Navigation
- ${report.constitutional_compliance.color_contrast ? '✅' : '❌'} Color Contrast (WCAG AA)
- ${report.constitutional_compliance.progressive_enhancement ? '✅' : '❌'} Progressive Enhancement

## Test Results Summary

- **Passed Tests**: ${report.passes}
- **Failed Tests**: ${report.violations.length}
- **Incomplete Tests**: ${report.incomplete}
- **Inapplicable Tests**: ${report.inapplicable}

${report.violations.length > 0 ? `
## Violations Found

${report.violations.map(violation => `
### ${violation.id} (${violation.impact})

**Description**: ${violation.description}
**Help**: ${violation.help}
**Learn More**: [${violation.helpUrl}](${violation.helpUrl})

**Affected Elements**:
${violation.nodes.map(node => `- \`${node.target.join(' ')}\``).join('\n')}
`).join('\n')}
` : ''}

---
*Generated by TimeButler Calendar E2E Accessibility Testing*
`;
}

/**
 * Complete accessibility test suite for German market
 */
export async function runCompleteAccessibilityTest(
  page: Page,
  options: AccessibilityTestOptions = {}
): Promise<{
  axeReport: AccessibilityReport;
  keyboardTest: Awaited<ReturnType<typeof testKeyboardNavigation>>;
  screenReaderTest: Awaited<ReturnType<typeof testScreenReaderCompatibility>>;
  colorContrastTest: Awaited<ReturnType<typeof testColorContrast>>;
  overallCompliance: boolean;
}> {
  // Run all accessibility tests
  const [axeReport, keyboardTest, screenReaderTest, colorContrastTest] = await Promise.all([
    validateAccessibility(page, options),
    testKeyboardNavigation(page),
    testScreenReaderCompatibility(page),
    testColorContrast(page)
  ]);

  // Determine overall compliance
  const overallCompliance =
    axeReport.wcag_compliance.level_aa &&
    keyboardTest.passed &&
    screenReaderTest.passed &&
    colorContrastTest.passed;

  return {
    axeReport,
    keyboardTest,
    screenReaderTest,
    colorContrastTest,
    overallCompliance
  };
}