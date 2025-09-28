#!/usr/bin/env node

/**
 * TimeButler Calendar Backend
 * High-performance German holiday bridge weekend optimizer
 *
 * Constitutional Requirements:
 * - <100ms API response times
 * - Support 25,000 concurrent users
 * - <2s page load times on 3G
 * - GDPR compliant
 * - No-login stateless architecture
 */

import { startApp } from './app.js';
import { getEnvConfig } from './config/env.js';

/**
 * Bootstrap the application
 */
const bootstrap = async (): Promise<void> => {
  try {
    // Validate environment before starting
    const env = getEnvConfig();

    console.log(`🚀 Starting TimeButler Calendar Backend`);
    console.log(`📊 Environment: ${env.NODE_ENV}`);
    console.log(`🔧 Node.js: ${process.version}`);
    console.log(`📦 PID: ${process.pid}`);

    // Start the application
    const app = await startApp();

    // Handle process signals gracefully
    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);

      app.close()
        .then(() => {
          console.log('✅ Server closed successfully');
          process.exit(0);
        })
        .catch((error) => {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        });
    };

    // Register signal handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
      app.log.fatal({ reason, promise }, 'Unhandled promise rejection');
      process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('🚨 Uncaught Exception:', error);
      app.log.fatal({ error }, 'Uncaught exception');
      process.exit(1);
    });

    // Performance monitoring warnings
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning') {
        app.log.warn({ warning }, 'Max listeners exceeded');
      }
    });

    console.log('✅ Application started successfully');

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('💥 Bootstrap failed:', error);
    process.exit(1);
  });
}