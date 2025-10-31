/**
 * Simple RUM analytics for deployment
 */

export const rumAnalytics = {
  trackEvent: (category: string, action: string, label?: string, metadata?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      // Simple console logging for now - can be enhanced later
      console.log('Analytics:', { category, action, label, metadata });
    }
  },
  destroy: () => {
    // Cleanup method - no-op for now
    // Can be extended if needed for cleanup
  }
};