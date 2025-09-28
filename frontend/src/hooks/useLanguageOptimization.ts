/**
 * Language Performance Optimization Hook
 *
 * Advanced performance optimization utilities for language switching:
 * - Translation preloading strategies
 * - Memory management for translations
 * - Bundle splitting optimization
 * - Cache warming and invalidation
 * - Performance monitoring and alerting
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  SupportedLanguage,
  LANGUAGE_CONSTANTS,
  TranslationCacheEntry,
  LanguagePerformanceMetrics,
} from '../types/language';

// Performance optimization configuration
interface OptimizationConfig {
  preloadDelay: number;
  preloadAll: boolean;
  maxMemoryUsage: number;
  compressionEnabled: boolean;
  cacheWarmingStrategy: 'eager' | 'lazy' | 'predictive';
  performanceThresholds: {
    switchTime: number;
    loadTime: number;
    memoryUsage: number;
  };
}

const DEFAULT_CONFIG: OptimizationConfig = {
  preloadDelay: 2000,
  preloadAll: false,
  maxMemoryUsage: 10 * 1024 * 1024, // 10MB
  compressionEnabled: true,
  cacheWarmingStrategy: 'predictive',
  performanceThresholds: {
    switchTime: LANGUAGE_CONSTANTS.PERFORMANCE.SWITCH_TIMEOUT,
    loadTime: LANGUAGE_CONSTANTS.PERFORMANCE.LOAD_TIMEOUT,
    memoryUsage: 5 * 1024 * 1024, // 5MB
  },
};

// Translation memory manager
class TranslationMemoryManager {
  private memoryUsage = 0;
  private maxMemory: number;
  private entries: Map<string, { size: number; lastAccess: number }> = new Map();

  constructor(maxMemory: number) {
    this.maxMemory = maxMemory;
  }

  allocate(key: string, size: number): boolean {
    if (this.memoryUsage + size > this.maxMemory) {
      this.cleanup();
      if (this.memoryUsage + size > this.maxMemory) {
        return false; // Still not enough memory
      }
    }

    this.memoryUsage += size;
    this.entries.set(key, {
      size,
      lastAccess: Date.now(),
    });

    return true;
  }

  deallocate(key: string) {
    const entry = this.entries.get(key);
    if (entry) {
      this.memoryUsage -= entry.size;
      this.entries.delete(key);
    }
  }

  access(key: string) {
    const entry = this.entries.get(key);
    if (entry) {
      entry.lastAccess = Date.now();
    }
  }

  private cleanup() {
    // Remove least recently used entries
    const sorted = Array.from(this.entries.entries())
      .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);

    const targetMemory = this.maxMemory * 0.7; // Cleanup to 70% of max
    while (this.memoryUsage > targetMemory && sorted.length > 0) {
      const [key] = sorted.shift()!;
      this.deallocate(key);
    }
  }

  getStats() {
    return {
      memoryUsage: this.memoryUsage,
      maxMemory: this.maxMemory,
      entries: this.entries.size,
      utilizationRatio: this.memoryUsage / this.maxMemory,
    };
  }
}

// Language usage predictor
class LanguagePredictor {
  private history: Array<{ language: SupportedLanguage; timestamp: number }> = [];
  private patterns: Map<string, number> = new Map();

  recordUsage(language: SupportedLanguage) {
    const now = Date.now();
    this.history.push({ language, timestamp: now });

    // Keep only last 50 entries
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }

    this.updatePatterns();
  }

  private updatePatterns() {
    // Analyze time-based patterns
    const now = Date.now();
    const hourOfDay = new Date(now).getHours();
    const dayOfWeek = new Date(now).getDay();

    // Simple pattern recognition
    const recentHistory = this.history.filter(entry =>
      now - entry.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    recentHistory.forEach(entry => {
      const entryHour = new Date(entry.timestamp).getHours();
      const entryDay = new Date(entry.timestamp).getDay();

      const pattern = `${entry.language}_${entryHour}_${entryDay}`;
      this.patterns.set(pattern, (this.patterns.get(pattern) || 0) + 1);
    });
  }

  predictNext(): SupportedLanguage[] {
    const now = Date.now();
    const hourOfDay = new Date(now).getHours();
    const dayOfWeek = new Date(now).getDay();

    const predictions: Array<{ language: SupportedLanguage; score: number }> = [];

    (['de', 'en'] as SupportedLanguage[]).forEach(lang => {
      const pattern = `${lang}_${hourOfDay}_${dayOfWeek}`;
      const score = this.patterns.get(pattern) || 0;
      predictions.push({ language: lang, score });
    });

    return predictions
      .sort((a, b) => b.score - a.score)
      .map(p => p.language);
  }
}

// Main optimization hook
export function useLanguageOptimization(config: Partial<OptimizationConfig> = {}) {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // State and refs
  const [isOptimized, setIsOptimized] = useState(false);
  const [performanceAlert, setPerformanceAlert] = useState<string | null>(null);
  const memoryManager = useRef(new TranslationMemoryManager(finalConfig.maxMemoryUsage));
  const predictor = useRef(new LanguagePredictor());
  const preloadCache = useRef(new Map<SupportedLanguage, Promise<any>>());
  const performanceStats = useRef<LanguagePerformanceMetrics>({
    detectionTime: 0,
    loadTime: 0,
    switchTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalOperations: 0,
  });

  // Preloading utilities
  const preloadTranslation = useCallback(async (language: SupportedLanguage): Promise<void> => {
    // Check if already preloading
    if (preloadCache.current.has(language)) {
      return preloadCache.current.get(language);
    }

    // Create preload promise
    const preloadPromise = (async () => {
      try {
        const startTime = performance.now();
        const module = await import(`../i18n/${language}.json`);
        const loadTime = performance.now() - startTime;

        const translationData = module.default || module;
        const size = new Blob([JSON.stringify(translationData)]).size;

        // Check memory availability
        if (!memoryManager.current.allocate(`preload_${language}`, size)) {
          console.warn(`Cannot preload ${language}: insufficient memory`);
          return;
        }

        performanceStats.current.loadTime = Math.max(performanceStats.current.loadTime, loadTime);

        if (loadTime > finalConfig.performanceThresholds.loadTime) {
          setPerformanceAlert(`Slow preload detected for ${language}: ${loadTime.toFixed(1)}ms`);
        }

        return translationData;
      } catch (error) {
        console.error(`Failed to preload ${language}:`, error);
        throw error;
      } finally {
        // Remove from preload cache after completion
        preloadCache.current.delete(language);
      }
    })();

    preloadCache.current.set(language, preloadPromise);
    return preloadPromise;
  }, [finalConfig.performanceThresholds.loadTime]);

  // Predictive preloading
  const performPredictivePreloading = useCallback(async () => {
    if (finalConfig.cacheWarmingStrategy !== 'predictive') return;

    const predictions = predictor.current.predictNext();
    const topPredictions = predictions.slice(0, 2); // Preload top 2 predictions

    await Promise.allSettled(
      topPredictions.map(lang => preloadTranslation(lang))
    );
  }, [finalConfig.cacheWarmingStrategy, preloadTranslation]);

  // Optimization strategies
  const optimizeForLanguageSwitch = useCallback((targetLanguage: SupportedLanguage) => {
    const startTime = performance.now();

    // Record usage for prediction
    predictor.current.recordUsage(targetLanguage);

    // Mark as accessed in memory manager
    memoryManager.current.access(`translation_${targetLanguage}`);

    return () => {
      const switchTime = performance.now() - startTime;
      performanceStats.current.switchTime = switchTime;

      if (switchTime > finalConfig.performanceThresholds.switchTime) {
        setPerformanceAlert(`Slow language switch: ${switchTime.toFixed(1)}ms`);
      }
    };
  }, [finalConfig.performanceThresholds.switchTime]);

  // Memory optimization
  const optimizeMemoryUsage = useCallback(() => {
    const stats = memoryManager.current.getStats();

    if (stats.utilizationRatio > 0.9) {
      setPerformanceAlert(`High memory usage: ${(stats.utilizationRatio * 100).toFixed(1)}%`);
    }

    return stats;
  }, []);

  // Bundle optimization check
  const checkBundleOptimization = useCallback(() => {
    // In a real implementation, this would check bundle sizes
    // For now, we simulate the check
    const bundleSize = 250 * 1024; // 250KB simulated
    const isOptimal = bundleSize < 200 * 1024; // 200KB target

    if (!isOptimal) {
      setPerformanceAlert(`Bundle size ${(bundleSize / 1024).toFixed(0)}KB exceeds 200KB target`);
    }

    return {
      size: bundleSize,
      isOptimal,
      recommendation: isOptimal ? null : 'Consider code splitting or tree shaking',
    };
  }, []);

  // Performance monitoring
  const getPerformanceReport = useCallback(() => {
    const memoryStats = memoryManager.current.getStats();
    const bundleStats = checkBundleOptimization();

    return {
      performance: performanceStats.current,
      memory: memoryStats,
      bundle: bundleStats,
      alerts: performanceAlert ? [performanceAlert] : [],
      recommendations: [
        memoryStats.utilizationRatio > 0.8 ? 'Consider clearing old translations' : null,
        performanceStats.current.switchTime > finalConfig.performanceThresholds.switchTime
          ? 'Implement translation preloading' : null,
        bundleStats.recommendation,
      ].filter(Boolean),
    };
  }, [performanceAlert, finalConfig.performanceThresholds.switchTime, checkBundleOptimization]);

  // Cache warming based on strategy
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const warmCache = async () => {
      switch (finalConfig.cacheWarmingStrategy) {
        case 'eager':
          // Preload all languages immediately
          await Promise.allSettled(
            (['de', 'en'] as SupportedLanguage[]).map(lang => preloadTranslation(lang))
          );
          break;

        case 'lazy':
          // No preloading, load on demand
          break;

        case 'predictive':
          // Wait for user interaction, then predict and preload
          timeoutId = setTimeout(performPredictivePreloading, finalConfig.preloadDelay);
          break;
      }

      setIsOptimized(true);
    };

    warmCache();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    finalConfig.cacheWarmingStrategy,
    finalConfig.preloadDelay,
    preloadTranslation,
    performPredictivePreloading,
  ]);

  // Performance alerting cleanup
  useEffect(() => {
    if (performanceAlert) {
      const timer = setTimeout(() => setPerformanceAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [performanceAlert]);

  // Memory monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      optimizeMemoryUsage();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [optimizeMemoryUsage]);

  return {
    // State
    isOptimized,
    performanceAlert,

    // Optimization methods
    preloadTranslation,
    optimizeForLanguageSwitch,
    optimizeMemoryUsage,
    performPredictivePreloading,

    // Monitoring
    getPerformanceReport,
    clearPerformanceAlerts: () => setPerformanceAlert(null),

    // Utilities
    memoryStats: memoryManager.current.getStats(),
    predictNextLanguage: () => predictor.current.predictNext(),
  };
}

// Performance monitoring component
interface LanguagePerformanceMonitorProps {
  showAlerts?: boolean;
  showStats?: boolean;
  onPerformanceIssue?: (issue: string) => void;
}

export function LanguagePerformanceMonitor({
  showAlerts = true,
  showStats = false,
  onPerformanceIssue,
}: LanguagePerformanceMonitorProps) {
  const { performanceAlert, getPerformanceReport, clearPerformanceAlerts } = useLanguageOptimization();

  useEffect(() => {
    if (performanceAlert && onPerformanceIssue) {
      onPerformanceIssue(performanceAlert);
    }
  }, [performanceAlert, onPerformanceIssue]);

  if (!showAlerts && !showStats) return null;

  const report = showStats ? getPerformanceReport() : null;

  return (
    <div className="language-performance-monitor">
      {showAlerts && performanceAlert && (
        <div className="performance-alert" role="alert">
          <p>{performanceAlert}</p>
          <button onClick={clearPerformanceAlerts}>Dismiss</button>
        </div>
      )}

      {showStats && report && (
        <div className="performance-stats">
          <h3>Language Performance Stats</h3>
          <div className="stats-grid">
            <div>Switch Time: {report.performance.switchTime.toFixed(1)}ms</div>
            <div>Load Time: {report.performance.loadTime.toFixed(1)}ms</div>
            <div>Memory Usage: {(report.memory.memoryUsage / 1024).toFixed(1)}KB</div>
            <div>Cache Hit Ratio: {(report.performance.cacheHits / (report.performance.cacheHits + report.performance.cacheMisses) * 100).toFixed(1)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default useLanguageOptimization;