/**
 * Caching utilities for expensive operations
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton cache instance
export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  trades: (accountId: string) => `trades:${accountId}`,
  analytics: (accountId: string, type: string) => `analytics:${accountId}:${type}`,
  symbols: (accountId: string) => `symbols:${accountId}`,
  performance: (accountId: string, period: string) => `performance:${accountId}:${period}`,
  ai: (conversationId: string) => `ai:${conversationId}`,
}

// Cache decorator for async functions
export function withCache<T>(
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args)
      
      // Check cache first
      const cached = cache.get<T>(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute original method
      const result = await originalMethod.apply(this, args)
      
      // Cache the result
      cache.set(cacheKey, result, ttl)
      
      return result
    }

    return descriptor
  }
}

// Periodic cleanup (every 10 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 10 * 60 * 1000)
}
