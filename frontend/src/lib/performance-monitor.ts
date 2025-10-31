/**
 * Simple performance monitor for deployment
 */

export const performanceMonitor = {
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.mark(name);
      } catch (e) {
        // Silently fail in environments without performance API
      }
    }
  },
  measure: (name: string, start: string, end: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, start, end);
      } catch (e) {
        // Silently fail
      }
    }
  },
  destroy: () => {
    // Cleanup method - no-op for now
    // Can be extended if needed for cleanup
  }
};