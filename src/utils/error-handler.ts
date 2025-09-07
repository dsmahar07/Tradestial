/**
 * Standardized error handling utilities for Tradestial
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

export class TradestialError extends Error {
  public readonly code?: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'TradestialError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toErrorInfo(): ErrorInfo {
    return {
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Standard error codes used across the application
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  
  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  
  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  
  // CSV Import errors
  CSV_PARSE_ERROR: 'CSV_PARSE_ERROR',
  CSV_INVALID_FORMAT: 'CSV_INVALID_FORMAT',
  CSV_MISSING_HEADERS: 'CSV_MISSING_HEADERS',
  
  // Trade data errors
  TRADE_CALCULATION_ERROR: 'TRADE_CALCULATION_ERROR',
  INVALID_TRADE_DATA: 'INVALID_TRADE_DATA',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED'
} as const;

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Safely handles errors and converts them to TradestialError
   */
  static handle(error: unknown, defaultMessage = 'An unexpected error occurred'): TradestialError {
    if (error instanceof TradestialError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new TradestialError(error.message, ERROR_CODES.UNKNOWN_ERROR, { originalError: error });
    }
    
    if (typeof error === 'string') {
      return new TradestialError(error, ERROR_CODES.UNKNOWN_ERROR);
    }
    
    return new TradestialError(defaultMessage, ERROR_CODES.UNKNOWN_ERROR, { originalError: error });
  }

  /**
   * Logs errors with consistent formatting
   */
  static log(error: TradestialError | Error | unknown, context?: string): void {
    const errorInfo = error instanceof TradestialError ? error.toErrorInfo() : {
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };

    console.error(`[${errorInfo.timestamp}] ${context ? `[${context}] ` : ''}${errorInfo.message}`, {
      ...errorInfo,
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  /**
   * Creates user-friendly error messages
   */
  static getUserMessage(error: TradestialError | Error | unknown): string {
    if (error instanceof TradestialError) {
      switch (error.code) {
        case ERROR_CODES.AUTH_REQUIRED:
          return 'Please log in to continue';
        case ERROR_CODES.AUTH_EXPIRED:
          return 'Your session has expired. Please log in again';
        case ERROR_CODES.VALIDATION_FAILED:
          return 'Please check your input and try again';
        case ERROR_CODES.FILE_TOO_LARGE:
          return 'File is too large. Please select a smaller file';
        case ERROR_CODES.INVALID_FILE_TYPE:
          return 'Invalid file type. Please select a supported file';
        case ERROR_CODES.NETWORK_ERROR:
          return 'Network error. Please check your connection and try again';
        case ERROR_CODES.STORAGE_QUOTA_EXCEEDED:
          return 'Storage limit exceeded. Please free up some space';
        default:
          return error.message;
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }

  /**
   * Validates required fields and throws appropriate errors
   */
  static validateRequired(fields: Record<string, any>, fieldNames: string[]): void {
    const missing = fieldNames.filter(name => !fields[name] || (typeof fields[name] === 'string' && !fields[name].trim()));
    
    if (missing.length > 0) {
      throw new TradestialError(
        `Required fields missing: ${missing.join(', ')}`,
        ERROR_CODES.REQUIRED_FIELD,
        { missingFields: missing }
      );
    }
  }

  /**
   * Validates email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates file size and type
   */
  static validateFile(file: File, maxSize: number, allowedTypes: string[]): void {
    if (file.size > maxSize) {
      throw new TradestialError(
        `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
        ERROR_CODES.FILE_TOO_LARGE,
        { fileSize: file.size, maxSize }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      throw new TradestialError(
        `File type ${file.type} is not supported`,
        ERROR_CODES.INVALID_FILE_TYPE,
        { fileType: file.type, allowedTypes }
      );
    }
  }
}

/**
 * Async error wrapper for handling promises
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  context?: string
): Promise<[TradestialError | null, T | null]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    const handledError = ErrorHandler.handle(error);
    if (context) {
      ErrorHandler.log(handledError, context);
    }
    return [handledError, null];
  }
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw ErrorHandler.handle(lastError);
}
