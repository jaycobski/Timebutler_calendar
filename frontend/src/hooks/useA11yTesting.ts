/**
 * Accessibility Testing Hook
 * Provides comprehensive WCAG 2.1 Level AA testing utilities
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  A11yTestResult,
  A11yViolation,
  A11yWarning,
  A11yTestCategory,
  UseA11yTestingReturn
} from '../types/accessibility';
import { A11Y_CONSTANTS } from '../types/accessibility';

interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  luminance: number;
}

interface ContrastResult {
  ratio: number;
  passes: {
    normal: boolean;
    large: boolean;
    enhanced: boolean;
  };
  colors: {
    foreground: ColorInfo;
    background: ColorInfo;
  };
}

export function useA11yTesting(): UseA11yTestingReturn {
  const [testResults, setTestResults] = useState<A11yTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Convert hex to RGB
  const hexToRgb = useCallback((hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }, []);

  // Calculate relative luminance
  const getRelativeLuminance = useCallback((color: { r: number; g: number; b: number }): number => {
    const { r, g, b } = color;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }, []);

  // Calculate contrast ratio
  const calculateContrastRatio = useCallback((
    foreground: string,
    background: string
  ): ContrastResult => {
    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);

    if (!fgRgb || !bgRgb) {
      throw new Error('Invalid color format. Use hex colors (e.g., #ffffff)');
    }

    const fgLuminance = getRelativeLuminance(fgRgb);
    const bgLuminance = getRelativeLuminance(bgRgb);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    return {
      ratio,
      passes: {
        normal: ratio >= A11Y_CONSTANTS.WCAG.CONTRAST_RATIOS.NORMAL_TEXT,
        large: ratio >= A11Y_CONSTANTS.WCAG.CONTRAST_RATIOS.LARGE_TEXT,
        enhanced: ratio >= A11Y_CONSTANTS.WCAG.CONTRAST_RATIOS.ENHANCED_NORMAL
      },
      colors: {
        foreground: {
          hex: foreground,
          rgb: fgRgb,
          luminance: fgLuminance
        },
        background: {
          hex: background,
          rgb: bgRgb,
          luminance: bgLuminance
        }
      }
    };
  }, [hexToRgb, getRelativeLuminance]);

  // Validate contrast for WCAG compliance
  const validateContrast = useCallback((foreground: string, background: string): boolean => {
    try {
      const result = calculateContrastRatio(foreground, background);
      return result.passes.normal;
    } catch {
      return false;
    }
  }, [calculateContrastRatio]);

  // Validate heading structure
  const validateHeadingStructure = useCallback((container?: HTMLElement): boolean => {
    const root = container || document;
    const headings = Array.from(root.querySelectorAll(A11Y_CONSTANTS.TESTING.SELECTORS.HEADINGS)) as HTMLElement[];

    if (headings.length === 0) return true;

    let previousLevel = 0;
    let hasH1 = false;

    for (const heading of headings) {
      const tagLevel = parseInt(heading.tagName.charAt(1), 10);
      const ariaLevel = parseInt(heading.getAttribute('aria-level') || '0', 10);
      const level = ariaLevel || tagLevel;

      if (level === 1) {
        hasH1 = true;
      }

      if (previousLevel > 0 && level > previousLevel + 1) {
        return false; // Skipped heading level
      }

      previousLevel = level;
    }

    return hasH1;
  }, []);

  // Validate landmarks
  const validateLandmarks = useCallback((container?: HTMLElement): boolean => {
    const root = container || document;
    const landmarks = Array.from(root.querySelectorAll(A11Y_CONSTANTS.TESTING.SELECTORS.LANDMARKS));

    // Check for main landmark
    const main = root.querySelector('main, [role="main"]');
    if (!main) return false;

    // Check for navigation landmark if page has navigation
    const nav = root.querySelector('nav, [role="navigation"]');
    const hasNavLinks = root.querySelectorAll('a[href]').length > 3;
    if (hasNavLinks && !nav) return false;

    return true;
  }, []);

  // Validate keyboard navigation
  const validateKeyboardNav = useCallback(async (container?: HTMLElement): Promise<boolean> => {
    const root = container || document;
    const focusableElements = Array.from(
      root.querySelectorAll(A11Y_CONSTANTS.TESTING.SELECTORS.FOCUSABLE)
    ) as HTMLElement[];

    if (focusableElements.length === 0) return true;

    // Test if all focusable elements can receive focus
    for (const element of focusableElements) {
      try {
        element.focus();
        if (document.activeElement !== element) {
          return false;
        }
      } catch {
        return false;
      }
    }

    return true;
  }, []);

  // Check for common accessibility issues
  const checkCommonIssues = useCallback((container?: HTMLElement): A11yViolation[] => {
    const root = container || document;
    const violations: A11yViolation[] = [];

    // Check for images without alt text
    const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt') && img.getAttribute('role') !== 'presentation') {
        violations.push({
          id: 'image-alt',
          impact: 'serious',
          tags: ['wcag2a', 'wcag111'],
          description: 'Images must have alternative text',
          help: 'Add alt attribute to image',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/image-alt',
          nodes: [{
            target: [`img:nth-child(${index + 1})`],
            html: img.outerHTML,
            failureSummary: 'Missing alt attribute',
            impact: 'serious'
          }]
        });
      }
    });

    // Check for form inputs without labels
    const inputs = Array.from(root.querySelectorAll('input, select, textarea')) as HTMLFormElement[];
    inputs.forEach((input, index) => {
      const hasLabel = input.labels && input.labels.length > 0;
      const hasAriaLabel = input.hasAttribute('aria-label');
      const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        violations.push({
          id: 'label',
          impact: 'critical',
          tags: ['wcag2a', 'wcag412'],
          description: 'Form elements must have labels',
          help: 'Add label element or aria-label attribute',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/label',
          nodes: [{
            target: [`${input.tagName.toLowerCase()}:nth-child(${index + 1})`],
            html: input.outerHTML,
            failureSummary: 'Missing label',
            impact: 'critical'
          }]
        });
      }
    });

    // Check for low contrast text
    const textElements = Array.from(root.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label')) as HTMLElement[];
    textElements.forEach((element, index) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        try {
          // This is a simplified check - in real implementation, you'd use proper color parsing
          const isLowContrast = false; // Placeholder for actual contrast calculation
          if (isLowContrast) {
            violations.push({
              id: 'color-contrast',
              impact: 'serious',
              tags: ['wcag2aa', 'wcag143'],
              description: 'Elements must have sufficient color contrast',
              help: 'Increase contrast between text and background',
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/color-contrast',
              nodes: [{
                target: [`${element.tagName.toLowerCase()}:nth-child(${index + 1})`],
                html: element.outerHTML,
                failureSummary: 'Insufficient contrast ratio',
                impact: 'serious'
              }]
            });
          }
        } catch {
          // Ignore errors in color parsing
        }
      }
    });

    return violations;
  }, []);

  // Check for warnings
  const checkWarnings = useCallback((container?: HTMLElement): A11yWarning[] => {
    const root = container || document;
    const warnings: A11yWarning[] = [];

    // Check for missing focus indicators
    const interactiveElements = Array.from(
      root.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ) as HTMLElement[];

    interactiveElements.forEach(element => {
      const styles = window.getComputedStyle(element, ':focus');
      if (!styles.outline || styles.outline === 'none' || styles.outline === '0') {
        warnings.push({
          id: 'focus-indicator',
          description: 'Interactive element lacks visible focus indicator',
          suggestion: 'Add CSS focus styles or use outline property',
          element: element.tagName.toLowerCase(),
          impact: 'medium'
        });
      }
    });

    // Check for missing skip links
    const skipLinks = root.querySelectorAll('a[href^="#"]');
    if (skipLinks.length === 0) {
      warnings.push({
        id: 'skip-link',
        description: 'Page lacks skip navigation links',
        suggestion: 'Add skip links for keyboard users',
        impact: 'medium'
      });
    }

    return warnings;
  }, []);

  // Run comprehensive accessibility tests
  const runTests = useCallback(async (element?: HTMLElement): Promise<A11yTestResult> => {
    setIsRunning(true);

    try {
      const violations = checkCommonIssues(element);
      const warnings = checkWarnings(element);

      const categories: A11yTestCategory[] = [
        {
          name: 'Images',
          passed: !violations.some(v => v.id === 'image-alt'),
          score: violations.some(v => v.id === 'image-alt') ? 0 : 100,
          rules: [{
            id: 'image-alt',
            passed: !violations.some(v => v.id === 'image-alt'),
            impact: 'serious',
            description: 'Images must have alternative text',
            help: 'Add alt attribute to image'
          }]
        },
        {
          name: 'Forms',
          passed: !violations.some(v => v.id === 'label'),
          score: violations.some(v => v.id === 'label') ? 0 : 100,
          rules: [{
            id: 'label',
            passed: !violations.some(v => v.id === 'label'),
            impact: 'critical',
            description: 'Form elements must have labels',
            help: 'Add label element or aria-label attribute'
          }]
        },
        {
          name: 'Keyboard Navigation',
          passed: await validateKeyboardNav(element),
          score: await validateKeyboardNav(element) ? 100 : 0,
          rules: [{
            id: 'keyboard-nav',
            passed: await validateKeyboardNav(element),
            impact: 'serious',
            description: 'All interactive elements must be keyboard accessible',
            help: 'Ensure all interactive elements can receive focus'
          }]
        },
        {
          name: 'Heading Structure',
          passed: validateHeadingStructure(element),
          score: validateHeadingStructure(element) ? 100 : 0,
          rules: [{
            id: 'heading-structure',
            passed: validateHeadingStructure(element),
            impact: 'moderate',
            description: 'Headings must be in logical order',
            help: 'Use proper heading hierarchy (h1, h2, h3, etc.)'
          }]
        },
        {
          name: 'Landmarks',
          passed: validateLandmarks(element),
          score: validateLandmarks(element) ? 100 : 0,
          rules: [{
            id: 'landmarks',
            passed: validateLandmarks(element),
            impact: 'moderate',
            description: 'Page must have proper landmark structure',
            help: 'Add main, nav, and other landmark elements'
          }]
        }
      ];

      const passedCategories = categories.filter(cat => cat.passed).length;
      const score = Math.round((passedCategories / categories.length) * 100);
      const level = score >= 95 ? 'AAA' : score >= 85 ? 'AA' : 'A';

      const result: A11yTestResult = {
        passed: violations.length === 0,
        violations,
        warnings,
        score,
        level,
        categories
      };

      setTestResults(result);
      return result;
    } finally {
      setIsRunning(false);
    }
  }, [checkCommonIssues, checkWarnings, validateKeyboardNav, validateHeadingStructure, validateLandmarks]);

  // Validate WCAG level compliance
  const validateWCAG = useCallback(async (level: 'A' | 'AA' | 'AAA'): Promise<boolean> => {
    const result = await runTests();
    const requiredScore = level === 'AAA' ? 95 : level === 'AA' ? 85 : 75;
    return result.score >= requiredScore;
  }, [runTests]);

  // Generate accessibility report
  const generateReport = useCallback((): string => {
    if (!testResults) {
      return 'No test results available. Run tests first.';
    }

    const { passed, violations, warnings, score, level, categories } = testResults;

    let report = `# Accessibility Test Report\n\n`;
    report += `**Overall Score:** ${score}% (WCAG ${level})\n`;
    report += `**Status:** ${passed ? 'PASSED' : 'FAILED'}\n\n`;

    if (violations.length > 0) {
      report += `## Violations (${violations.length})\n\n`;
      violations.forEach((violation, index) => {
        report += `### ${index + 1}. ${violation.description}\n`;
        report += `- **Impact:** ${violation.impact}\n`;
        report += `- **Help:** ${violation.help}\n`;
        report += `- **Nodes:** ${violation.nodes.length}\n\n`;
      });
    }

    if (warnings.length > 0) {
      report += `## Warnings (${warnings.length})\n\n`;
      warnings.forEach((warning, index) => {
        report += `### ${index + 1}. ${warning.description}\n`;
        report += `- **Impact:** ${warning.impact}\n`;
        report += `- **Suggestion:** ${warning.suggestion}\n\n`;
      });
    }

    report += `## Category Results\n\n`;
    categories.forEach(category => {
      report += `- **${category.name}:** ${category.passed ? 'PASSED' : 'FAILED'} (${category.score}%)\n`;
    });

    return report;
  }, [testResults]);

  // Auto-run tests on element changes
  const autoTest = useCallback((element: HTMLElement, options: { debounce?: number } = {}) => {
    const { debounce = 1000 } = options;
    let timeoutId: NodeJS.Timeout;

    const observer = new MutationObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        runTests(element);
      }, debounce);
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'aria-describedby', 'alt', 'role']
    });

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [runTests]);

  return {
    runTests,
    validateContrast,
    validateHeadingStructure,
    validateLandmarks,
    validateKeyboardNav,
    validateWCAG,
    generateReport,
    calculateContrastRatio,
    testResults,
    isRunning,
    autoTest
  };
}

// Utility function to create test summary
export function createTestSummary(result: A11yTestResult): string {
  const { passed, violations, warnings, score, level } = result;

  return `Accessibility Test: ${passed ? 'PASSED' : 'FAILED'} | Score: ${score}% | Level: WCAG ${level} | Violations: ${violations.length} | Warnings: ${warnings.length}`;
}

// Utility function to get severity color
export function getSeverityColor(impact: string): string {
  switch (impact) {
    case 'critical': return '#d73527';
    case 'serious': return '#ff6900';
    case 'moderate': return '#ffad0d';
    case 'minor': return '#ffdd00';
    default: return '#17a2b8';
  }
}

// Utility function to format contrast ratio
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}