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

  private argToString(arg: any): string {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }

  private combineMessage(message: string, extra: any[]): string {
    if (!extra || extra.length === 0) return message;
    const tail = extra.map((a) => this.argToString(a)).join(' ');
    return tail ? `${message} ${tail}` : message;
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug') && this.isDevelopment) {
      const combined = this.combineMessage('', args);
      console.debug(this.formatMessage('debug', combined));
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      const combined = this.combineMessage('', args);
      console.info(this.formatMessage('info', combined));
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      const combined = this.combineMessage('', args);
      console.warn(this.formatMessage('warn', combined));
    }
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      let baseMessage: string | undefined;
      let err: Error | undefined;
      let context: LogContext | undefined;
      const extras: any[] = [];

      for (const a of args) {
        if (typeof a === 'string' && baseMessage === undefined) {
          baseMessage = a;
          continue;
        }
        if (!err && a instanceof Error) {
          err = a;
          continue;
        }
        if (!context && a && typeof a === 'object' && !(a instanceof Error) && !Array.isArray(a)) {
          context = a as LogContext;
          continue;
        }
        extras.push(a);
      }

      const combined = this.combineMessage(baseMessage || '', extras);
      const errorContext = {
        ...context,
        ...(err && {
          error: {
            message: err.message,
            stack: err.stack,
            name: err.name,
          },
        }),
      } as LogContext;

      console.error(this.formatMessage('error', combined, errorContext));
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
