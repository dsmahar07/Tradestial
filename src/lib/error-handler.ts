/**
 * Centralized error handling utilities
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

/**
 * Global error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  // Log the error
  logger.error('API Error', error as Error)

  // Handle known errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      { status: error.statusCode }
    )
  }

  // Handle validation errors from libraries
  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.message,
        },
      },
      { status: 400 }
    )
  }

  // Handle unknown errors
  const isDev = process.env.NODE_ENV === 'development'
  return NextResponse.json(
    {
      error: {
        message: isDev ? (error as Error).message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(isDev && { stack: (error as Error).stack }),
      },
    },
    { status: 500 }
  )
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }) as T
}

/**
 * Try-catch wrapper with error logging
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    const err = error as Error
    if (errorMessage) {
      logger.error(errorMessage, err)
    }
    return [null, err]
  }
}
