/**
 * Production-ready logger utility
 * Replaces console.log statements with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      environment: process.env.NODE_ENV,
    };

    if (this.isDevelopment) {
      // Pretty print in development
      return logEntry;
    }

    // JSON format for production (for log aggregation services)
    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug') && this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        },
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext) {
    if (this.shouldLog('info')) {
      this.info(`Performance: ${operation}`, {
        ...context,
        duration_ms: duration,
        operation,
      });
    }
  }

  // Security event logging
  security(event: string, context?: LogContext) {
    this.warn(`Security Event: ${event}`, {
      ...context,
      security_event: event,
    });
  }
}

export const logger = new Logger();
