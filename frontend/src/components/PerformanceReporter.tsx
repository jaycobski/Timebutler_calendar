/**
 * Performance Reporter Component for TimeButler Calendar
 * Provides real-time performance monitoring and constitutional compliance reporting
 * Integrates with Core Web Vitals and custom performance budgets
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { performanceMonitor, type PerformanceMetrics } from '@/lib/performance-monitor';

interface PerformanceAlert {
  id: string;
  type: 'budget-exceeded' | 'poor-vitals' | 'network-slow';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: number;
}

interface PerformanceReporterProps {
  /** Enable development mode with visible performance overlay */
  developmentMode?: boolean;
  /** Custom performance thresholds */
  customBudgets?: Partial<{
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  }>;
  /** Callback for performance alerts */
  onAlert?: (alert: PerformanceAlert) => void;
}

export function PerformanceReporter({
  developmentMode = process.env.NODE_ENV === 'development',
  customBudgets = {},
  onAlert,
}: PerformanceReporterProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Constitutional performance budgets (can be overridden)
  const budgets = {
    lcp: 2000,    // <2s LCP on 3G (constitutional)
    fid: 100,     // <100ms FID (constitutional)
    cls: 0.1,     // <0.1 CLS (constitutional)
    fcp: 1500,    // <1.5s FCP target
    ttfb: 600,    // <600ms TTFB target
    ...customBudgets,
  };

  /**
   * Generate performance alert
   */
  const generateAlert = useCallback((
    type: PerformanceAlert['type'],
    metric: string,
    value: number,
    threshold: number,
    message: string
  ): PerformanceAlert => {
    const severity: 'warning' | 'critical' = value > threshold * 1.5 ? 'critical' : 'warning';

    return {
      id: `${type}-${metric}-${Date.now()}`,
      type,
      message,
      metric,
      value,
      threshold,
      severity,
      timestamp: Date.now(),
    };
  }, []);

  /**
   * Check metrics against constitutional requirements
   */
  const checkConstitutionalCompliance = useCallback((currentMetrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    // Check LCP (Constitutional: <2s on 3G)
    if (currentMetrics.lcp && currentMetrics.lcp > budgets.lcp) {
      const alert = generateAlert(
        'budget-exceeded',
        'lcp',
        currentMetrics.lcp,
        budgets.lcp,
        `Largest Contentful Paint (${Math.round(currentMetrics.lcp)}ms) exceeds constitutional requirement of ${budgets.lcp}ms`
      );
      newAlerts.push(alert);
    }

    // Check FID (Constitutional: <100ms)
    if (currentMetrics.fid && currentMetrics.fid > budgets.fid) {
      const alert = generateAlert(
        'budget-exceeded',
        'fid',
        currentMetrics.fid,
        budgets.fid,
        `First Input Delay (${Math.round(currentMetrics.fid)}ms) exceeds constitutional requirement of ${budgets.fid}ms`
      );
      newAlerts.push(alert);
    }

    // Check CLS (Constitutional: <0.1)
    if (currentMetrics.cls && currentMetrics.cls > budgets.cls) {
      const alert = generateAlert(
        'budget-exceeded',
        'cls',
        currentMetrics.cls,
        budgets.cls,
        `Cumulative Layout Shift (${currentMetrics.cls.toFixed(3)}) exceeds constitutional requirement of ${budgets.cls}`
      );
      newAlerts.push(alert);
    }

    // Check FCP
    if (currentMetrics.fcp && currentMetrics.fcp > budgets.fcp) {
      const alert = generateAlert(
        'budget-exceeded',
        'fcp',
        currentMetrics.fcp,
        budgets.fcp,
        `First Contentful Paint (${Math.round(currentMetrics.fcp)}ms) exceeds target of ${budgets.fcp}ms`
      );
      newAlerts.push(alert);
    }

    // Check TTFB
    if (currentMetrics.ttfb && currentMetrics.ttfb > budgets.ttfb) {
      const alert = generateAlert(
        'budget-exceeded',
        'ttfb',
        currentMetrics.ttfb,
        budgets.ttfb,
        `Time to First Byte (${Math.round(currentMetrics.ttfb)}ms) exceeds target of ${budgets.ttfb}ms`
      );
      newAlerts.push(alert);
    }

    // Check for slow network conditions
    if (currentMetrics.connection?.effectiveType === 'slow-2g' ||
        currentMetrics.connection?.effectiveType === '2g') {
      const alert = generateAlert(
        'network-slow',
        'connection',
        0,
        0,
        `Slow network detected (${currentMetrics.connection.effectiveType}). Performance may be impacted.`
      );
      newAlerts.push(alert);
    }

    return newAlerts;
  }, [budgets, generateAlert]);

  /**
   * Update metrics and check compliance
   */
  const updateMetrics = useCallback(() => {
    const currentMetrics = performanceMonitor.getMetrics();
    setMetrics(currentMetrics);

    const newAlerts = checkConstitutionalCompliance(currentMetrics);
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
      newAlerts.forEach(alert => onAlert?.(alert));
    }
  }, [checkConstitutionalCompliance, onAlert]);

  /**
   * Calculate Lighthouse-style scores (0-100)
   */
  const calculateScores = useCallback((currentMetrics: PerformanceMetrics) => {
    const scores = {
      lcp: currentMetrics.lcp ? Math.max(0, 100 - ((currentMetrics.lcp - 1200) / 3000) * 100) : null,
      fid: currentMetrics.fid ? Math.max(0, 100 - ((currentMetrics.fid - 50) / 250) * 100) : null,
      cls: currentMetrics.cls ? Math.max(0, 100 - (currentMetrics.cls / 0.25) * 100) : null,
      fcp: currentMetrics.fcp ? Math.max(0, 100 - ((currentMetrics.fcp - 900) / 2100) * 100) : null,
    };

    // Calculate overall performance score (weighted average)
    const validScores = Object.values(scores).filter(score => score !== null) as number[];
    const overallScore = validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : null;

    return { ...scores, overall: overallScore };
  }, []);

  /**
   * Get score color based on constitutional requirements
   */
  const getScoreColor = (score: number | null): string => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-600';  // Constitutional compliance
    if (score >= 75) return 'text-yellow-600'; // Warning
    return 'text-red-600';                     // Critical
  };

  /**
   * Format metric value for display
   */
  const formatMetric = (value: number | undefined, unit: string): string => {
    if (!value) return '--';
    if (unit === 'ms') return `${Math.round(value)}${unit}`;
    if (unit === 'score') return Math.round(value).toString();
    return value.toFixed(3);
  };

  // Initialize monitoring
  useEffect(() => {
    updateMetrics();

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateMetrics]);

  // Keyboard shortcut to toggle visibility in development mode
  useEffect(() => {
    if (!developmentMode) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [developmentMode]);

  // Don't render in production unless explicitly enabled
  if (!developmentMode && !isVisible) return null;

  const scores = metrics ? calculateScores(metrics) : null;

  return (
    <>
      {/* Performance Overlay */}
      {(developmentMode || isVisible) && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm text-sm font-mono">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close performance monitor"
            >
              ×
            </button>
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>LCP:</span>
              <span className={getScoreColor(scores?.lcp)}>
                {formatMetric(metrics?.lcp, 'ms')}
                {scores?.lcp && ` (${Math.round(scores.lcp)})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>FID:</span>
              <span className={getScoreColor(scores?.fid)}>
                {formatMetric(metrics?.fid, 'ms')}
                {scores?.fid && ` (${Math.round(scores.fid)})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>CLS:</span>
              <span className={getScoreColor(scores?.cls)}>
                {formatMetric(metrics?.cls, '')}
                {scores?.cls && ` (${Math.round(scores.cls)})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>FCP:</span>
              <span className={getScoreColor(scores?.fcp)}>
                {formatMetric(metrics?.fcp, 'ms')}
                {scores?.fcp && ` (${Math.round(scores.fcp)})`}
              </span>
            </div>

            {/* Overall Score */}
            {scores?.overall && (
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Overall:</span>
                  <span className={getScoreColor(scores.overall)}>
                    {Math.round(scores.overall)}
                    {scores.overall >= 90 ? ' ✓' : scores.overall >= 75 ? ' ⚠' : ' ✗'}
                  </span>
                </div>
              </div>
            )}

            {/* Network Info */}
            {metrics?.connection && (
              <div className="border-t pt-2 mt-2 text-xs">
                <div>Network: {metrics.connection.effectiveType}</div>
                <div>RTT: {metrics.connection.rtt}ms</div>
              </div>
            )}
          </div>

          {/* Constitutional Compliance Status */}
          <div className="border-t pt-2 mt-2 text-xs">
            <div className="font-semibold">Constitutional Compliance:</div>
            <div className={scores?.overall && scores.overall >= 90 ? 'text-green-600' : 'text-red-600'}>
              {scores?.overall && scores.overall >= 90 ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
            </div>
          </div>
        </div>
      )}

      {/* Alert Notifications */}
      {alerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {alerts.slice(-3).map((alert) => (
            <div
              key={alert.id}
              className={`max-w-md p-3 rounded-lg shadow-lg ${
                alert.severity === 'critical'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">
                    {alert.severity === 'critical' ? '🚨' : '⚠️'} Performance Alert
                  </div>
                  <div className="text-sm mt-1">{alert.message}</div>
                </div>
                <button
                  onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Development mode toggle button */}
      {developmentMode && !isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-4 right-4 z-40 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm hover:bg-blue-700"
          title="Show Performance Monitor (Ctrl+Shift+P)"
        >
          ⚡ Perf
        </button>
      )}
    </>
  );
}

export default PerformanceReporter;