/**
 * Rate limiting middleware for API routes
 * Prevents abuse and ensures fair usage
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private config: RateLimitConfig) {}

  private getClientId(request: NextRequest): string {
    // Use IP address or user ID for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (value.resetTime < now) {
        this.requests.delete(key);
      }
    }
  }

  async limit(request: NextRequest): Promise<NextResponse | null> {
    this.cleanupExpired();
    
    const clientId = this.getClientId(request);
    const now = Date.now();
    const resetTime = now + this.config.windowMs;

    const clientData = this.requests.get(clientId);

    if (!clientData || clientData.resetTime < now) {
      // First request or window expired
      this.requests.set(clientId, { count: 1, resetTime });
      return null; // Allow request
    }

    if (clientData.count >= this.config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      
      return NextResponse.json(
        { 
          error: this.config.message || 'Too many requests. Please try again later.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': this.config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
          }
        }
      );
    }

    // Increment request count
    clientData.count++;
    return null; // Allow request
  }
}

// Pre-configured rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'API rate limit exceeded. Please wait before making more requests.'
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.'
});

export const aiChatRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 AI requests per minute
  message: 'AI chat rate limit reached. Please wait a moment before sending more messages.'
});

// Helper function to apply rate limiting
export async function withRateLimit(
  request: NextRequest,
  limiter: RateLimiter = apiRateLimiter
): Promise<NextResponse | null> {
  return await limiter.limit(request);
}
