/**
 * API middleware for CORS, authentication, and request validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

/**
 * CORS middleware
 */
export function withCORS(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: corsHeaders })
    }

    // Execute handler
    const response = await handler(request, ...args)
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Request validation middleware
 */
export function withValidation(schema: any) {
  return function (handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      try {
        const body = await request.json()
        
        // Validate request body against schema
        // You can use zod, joi, or any validation library here
        // For now, basic validation
        if (!body || typeof body !== 'object') {
          return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
          )
        }

        // Add validated body to request
        (request as any).validatedBody = body
        
        return handler(request, ...args)
      } catch (error) {
        logger.error('Request validation failed', error as Error)
        return NextResponse.json(
          { error: 'Invalid request format' },
          { status: 400 }
        )
      }
    }
  }
}

/**
 * Error handling middleware
 */
export function withErrorHandler(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      logger.error('API error', error as Error, {
        url: request.url,
        method: request.method,
      })

      // Don't expose internal errors in production
      const isDev = process.env.NODE_ENV === 'development'
      
      return NextResponse.json(
        {
          error: isDev ? (error as Error).message : 'Internal server error',
          ...(isDev && { stack: (error as Error).stack })
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Combine multiple middlewares
 */
export function withMiddleware(...middlewares: Function[]) {
  return function (handler: Function) {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc)
    }, handler)
  }
}
