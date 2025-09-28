/**
 * Performance Dashboard Component for TimeButler Calendar
 * Constitutional compliance monitoring dashboard for administrators
 * Displays real-time performance metrics and historical data
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { performanceMonitor, type PerformanceMetrics } from '@/lib/performance-monitor';

interface PerformanceTrend {
  timestamp: number;
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  score: number;
}

interface ConstitutionalCompliance {
  isCompliant: boolean;
  violations: Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'critical';
  }>;
  score: number;
  lastChecked: number;
}

interface DashboardProps {
  /** Show detailed metrics breakdown */
  showDetails?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Historical data points to display */
  historyPoints?: number;
}

export function PerformanceDashboard({
  showDetails = true,
  refreshInterval = 5000,
  historyPoints = 50,
}: DashboardProps) {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [compliance, setCompliance] = useState<ConstitutionalCompliance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

  // Constitutional thresholds
  const thresholds = {
    lcp: 2000,    // <2s on 3G (constitutional)
    fid: 100,     // <100ms (constitutional)
    cls: 0.1,     // <0.1 (constitutional)
    fcp: 1500,    // <1.5s target
    score: 90,    // >90 Lighthouse score (constitutional)
  };

  /**
   * Calculate Lighthouse-style performance score
   */
  const calculateScore = useCallback((metrics: PerformanceMetrics): number => {
    const scores = {
      lcp: metrics.lcp ? Math.max(0, 100 - ((metrics.lcp - 1200) / 3000) * 100) : null,
      fid: metrics.fid ? Math.max(0, 100 - ((metrics.fid - 50) / 250) * 100) : null,
      cls: metrics.cls ? Math.max(0, 100 - (metrics.cls / 0.25) * 100) : null,
      fcp: metrics.fcp ? Math.max(0, 100 - ((metrics.fcp - 900) / 2100) * 100) : null,
    };

    const validScores = Object.values(scores).filter(score => score !== null) as number[];
    return validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : 0;
  }, []);

  /**
   * Check constitutional compliance
   */
  const checkCompliance = useCallback((metrics: PerformanceMetrics): ConstitutionalCompliance => {
    const violations = [];

    if (metrics.lcp && metrics.lcp > thresholds.lcp) {
      violations.push({
        metric: 'LCP',
        value: metrics.lcp,
        threshold: thresholds.lcp,
        severity: metrics.lcp > thresholds.lcp * 1.5 ? 'critical' : 'warning' as const,
      });
    }

    if (metrics.fid && metrics.fid > thresholds.fid) {
      violations.push({
        metric: 'FID',
        value: metrics.fid,
        threshold: thresholds.fid,
        severity: metrics.fid > thresholds.fid * 1.5 ? 'critical' : 'warning' as const,
      });
    }

    if (metrics.cls && metrics.cls > thresholds.cls) {
      violations.push({
        metric: 'CLS',
        value: metrics.cls,
        threshold: thresholds.cls,
        severity: metrics.cls > thresholds.cls * 1.5 ? 'critical' : 'warning' as const,
      });
    }

    const score = calculateScore(metrics);

    return {
      isCompliant: violations.length === 0 && score >= thresholds.score,
      violations,
      score,
      lastChecked: Date.now(),
    };
  }, [calculateScore, thresholds]);

  /**
   * Update metrics and trends
   */
  const updateMetrics = useCallback(() => {
    const metrics = performanceMonitor.getMetrics();
    setCurrentMetrics(metrics);

    if (metrics.lcp || metrics.fid || metrics.cls || metrics.fcp) {
      const score = calculateScore(metrics);
      const newTrend: PerformanceTrend = {
        timestamp: Date.now(),
        lcp: metrics.lcp || 0,
        fid: metrics.fid || 0,
        cls: metrics.cls || 0,
        fcp: metrics.fcp || 0,
        score,
      };

      setTrends(prev => [...prev.slice(-historyPoints + 1), newTrend]);
      setCompliance(checkCompliance(metrics));
    }

    setIsLoading(false);
  }, [calculateScore, checkCompliance, historyPoints]);

  // Initialize and setup auto-refresh
  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [updateMetrics, refreshInterval]);

  /**
   * Format metric value for display
   */
  const formatMetric = (value: number | undefined, unit: 'ms' | 'score' | ''): string => {
    if (!value) return '--';
    if (unit === 'ms') return `${Math.round(value)}${unit}`;
    if (unit === 'score') return Math.round(value).toString();
    return value.toFixed(3);
  };

  /**
   * Get metric color based on constitutional thresholds
   */
  const getMetricColor = (metric: string, value: number | undefined): string => {
    if (!value) return 'text-gray-400';

    const isGood = (() => {
      switch (metric) {
        case 'lcp': return value <= thresholds.lcp;
        case 'fid': return value <= thresholds.fid;
        case 'cls': return value <= thresholds.cls;
        case 'fcp': return value <= thresholds.fcp;
        case 'score': return value >= thresholds.score;
        default: return true;
      }
    })();

    const isWarning = (() => {
      switch (metric) {
        case 'lcp': return value > thresholds.lcp && value <= thresholds.lcp * 1.5;
        case 'fid': return value > thresholds.fid && value <= thresholds.fid * 1.5;
        case 'cls': return value > thresholds.cls && value <= thresholds.cls * 1.5;
        case 'fcp': return value > thresholds.fcp && value <= thresholds.fcp * 1.5;
        case 'score': return value < thresholds.score && value >= thresholds.score * 0.8;
        default: return false;
      }
    })();

    if (isGood) return 'text-green-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Get trend direction for a metric
   */
  const getTrendDirection = (metric: keyof PerformanceTrend): 'up' | 'down' | 'stable' => {
    if (trends.length < 2) return 'stable';

    const recent = trends.slice(-5);
    const current = recent[recent.length - 1]?.[metric] || 0;
    const previous = recent[0]?.[metric] || 0;

    const diff = current - previous;
    const threshold = metric === 'score' ? 5 : (metric === 'cls' ? 0.02 : 50);

    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Performance Dashboard
            </h2>
            <p className="text-sm text-gray-600">
              Constitutional compliance monitoring
            </p>
          </div>

          {/* Constitutional Compliance Status */}
          {compliance && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              compliance.isCompliant
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {compliance.isCompliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
            </div>
          )}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* LCP */}
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              <span className={getMetricColor('lcp', currentMetrics?.lcp)}>
                {formatMetric(currentMetrics?.lcp, 'ms')}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-1">LCP</div>
            <div className="text-xs text-gray-400">
              Constitutional: &lt;{thresholds.lcp}ms
            </div>
            {trends.length > 1 && (
              <div className="text-xs mt-1">
                {getTrendDirection('lcp') === 'up' && <span className="text-red-500">↑</span>}
                {getTrendDirection('lcp') === 'down' && <span className="text-green-500">↓</span>}
                {getTrendDirection('lcp') === 'stable' && <span className="text-gray-400">→</span>}
              </div>
            )}
          </div>

          {/* FID */}
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              <span className={getMetricColor('fid', currentMetrics?.fid)}>
                {formatMetric(currentMetrics?.fid, 'ms')}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-1">FID</div>
            <div className="text-xs text-gray-400">
              Constitutional: &lt;{thresholds.fid}ms
            </div>
            {trends.length > 1 && (
              <div className="text-xs mt-1">
                {getTrendDirection('fid') === 'up' && <span className="text-red-500">↑</span>}
                {getTrendDirection('fid') === 'down' && <span className="text-green-500">↓</span>}
                {getTrendDirection('fid') === 'stable' && <span className="text-gray-400">→</span>}
              </div>
            )}
          </div>

          {/* CLS */}
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              <span className={getMetricColor('cls', currentMetrics?.cls)}>
                {formatMetric(currentMetrics?.cls, '')}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-1">CLS</div>
            <div className="text-xs text-gray-400">
              Constitutional: &lt;{thresholds.cls}
            </div>
            {trends.length > 1 && (
              <div className="text-xs mt-1">
                {getTrendDirection('cls') === 'up' && <span className="text-red-500">↑</span>}
                {getTrendDirection('cls') === 'down' && <span className="text-green-500">↓</span>}
                {getTrendDirection('cls') === 'stable' && <span className="text-gray-400">→</span>}
              </div>
            )}
          </div>

          {/* Overall Score */}
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              <span className={getMetricColor('score', compliance?.score)}>
                {Math.round(compliance?.score || 0)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-1">Score</div>
            <div className="text-xs text-gray-400">
              Constitutional: &gt;{thresholds.score}
            </div>
            {trends.length > 1 && (
              <div className="text-xs mt-1">
                {getTrendDirection('score') === 'up' && <span className="text-green-500">↑</span>}
                {getTrendDirection('score') === 'down' && <span className="text-red-500">↓</span>}
                {getTrendDirection('score') === 'stable' && <span className="text-gray-400">→</span>}
              </div>
            )}
          </div>
        </div>

        {/* Constitutional Violations */}
        {compliance?.violations && compliance.violations.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-semibold text-red-800 mb-2">
              🚨 Constitutional Violations
            </h3>
            <div className="space-y-1">
              {compliance.violations.map((violation, index) => (
                <div key={index} className="text-sm text-red-700">
                  <span className="font-medium">{violation.metric}:</span>{' '}
                  {formatMetric(violation.value, violation.metric === 'CLS' ? '' : 'ms')} exceeds{' '}
                  {formatMetric(violation.threshold, violation.metric === 'CLS' ? '' : 'ms')}{' '}
                  <span className={`px-1 py-0.5 rounded text-xs ${
                    violation.severity === 'critical'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {violation.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Metrics */}
        {showDetails && currentMetrics && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Detailed Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">First Contentful Paint:</span>
                  <span className={getMetricColor('fcp', currentMetrics.fcp)}>
                    {formatMetric(currentMetrics.fcp, 'ms')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Time to First Byte:</span>
                  <span>{formatMetric(currentMetrics.ttfb, 'ms')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">DOM Content Loaded:</span>
                  <span>{formatMetric(currentMetrics.domContentLoaded, 'ms')}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Load Complete:</span>
                  <span>{formatMetric(currentMetrics.loadComplete, 'ms')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Connection Type:</span>
                  <span>{currentMetrics.connection?.effectiveType || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Language:</span>
                  <span>{currentMetrics.language}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance History Chart (simplified) */}
        {trends.length > 5 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Performance Trend (Last {trends.length} measurements)
            </h3>
            <div className="h-20 bg-gray-50 rounded flex items-end justify-between px-2 py-1">
              {trends.slice(-20).map((trend, index) => (
                <div key={index} className="flex flex-col items-center space-y-1">
                  <div
                    className={`w-2 rounded-t ${
                      trend.score >= thresholds.score
                        ? 'bg-green-500'
                        : trend.score >= thresholds.score * 0.8
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ height: `${(trend.score / 100) * 60}px` }}
                  />
                  <div className="text-xs text-gray-400">
                    {Math.round(trend.score)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-4 mt-4 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>
              Last updated: {new Date(compliance?.lastChecked || Date.now()).toLocaleTimeString()}
            </span>
            <span>
              Constitutional Compliance: {compliance?.isCompliant ? 'ACTIVE' : 'VIOLATED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;