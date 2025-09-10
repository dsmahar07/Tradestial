import { logger } from '@/lib/logger'

/**
 * Real-time calculation cache system for analytics
 * Provides intelligent caching with invalidation and performance optimization
 */

import { Trade } from './trade-data.service'
import { AnalyticsFilter, AggregationConfig } from './analytics-filter.service'

export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  accessCount: number
  lastAccessed: number
  size: number // Approximate memory size in bytes
  dependencies: string[] // Keys that when changed should invalidate this entry
}

export interface CacheStats {
  totalEntries: number
  totalMemoryUsage: number
  hitRate: number
  missRate: number
  averageAccessTime: number
  topKeys: Array<{ key: string; accessCount: number }>
}

export interface CacheConfig {
  maxMemoryUsage: number // bytes
  maxEntries: number
  defaultTTL: number // milliseconds
  cleanupInterval: number // milliseconds
  enableCompression: boolean
  enablePersistence: boolean
}

export type CacheInvalidationPattern = 
  | 'trades:*'           // All trade-related calculations
  | 'filters:*'          // All filter-related calculations  
  | 'aggregations:*'     // All aggregation results
  | 'charts:*'           // All chart data
  | 'kpis:*'            // All KPI calculations
  | string              // Specific cache key

export class AnalyticsCacheService {
  private static cache: Map<string, CacheEntry> = new Map()
  private static stats = {
    hits: 0,
    misses: 0,
    totalAccessTime: 0,
    accessCount: 0
  }
  private static config: CacheConfig = {
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    maxEntries: 1000,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000, // 1 minute
    enableCompression: true,
    enablePersistence: false
  }
  private static cleanupTimer: NodeJS.Timeout | null = null
  private static persistentCache: Map<string, any> = new Map()

  /**
   * Initialize the cache system
   */
  static initialize(customConfig?: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...customConfig }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)

    // Load persistent cache if enabled
    if (this.config.enablePersistence) {
      this.loadPersistentCache()
    }
  }

  /**
   * Get value from cache with performance tracking
   */
  static async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now()
    
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      this.recordAccessTime(performance.now() - startTime)
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.recordAccessTime(performance.now() - startTime)
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.stats.hits++
    this.recordAccessTime(performance.now() - startTime)

    return this.deserializeValue(entry.value)
  }

  /**
   * Set value in cache with intelligent sizing and compression
   */
  static async set<T>(
    key: string, 
    value: T, 
    options?: {
      ttl?: number
      dependencies?: string[]
      compress?: boolean
      persist?: boolean
    }
  ): Promise<void> {
    const ttl = options?.ttl || this.config.defaultTTL
    const dependencies = options?.dependencies || []
    const compress = options?.compress ?? this.config.enableCompression
    
    // Serialize and possibly compress the value
    const serializedValue = this.serializeValue(value, compress)
    const size = this.estimateSize(serializedValue)

    // Check memory limits and evict if necessary
    await this.ensureMemoryLimit(size)

    const entry: CacheEntry<T> = {
      key,
      value: serializedValue,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      dependencies
    }

    this.cache.set(key, entry)

    // Persist if enabled
    if (options?.persist && this.config.enablePersistence) {
      this.persistentCache.set(key, entry)
      this.savePersistentCache()
    }
  }

  /**
   * Generate intelligent cache keys based on filters and configurations
   */
  static generateCacheKey(
    type: 'filter' | 'aggregation' | 'chart' | 'kpi' | 'custom',
    params: {
      filter?: AnalyticsFilter
      aggregation?: AggregationConfig
      chartType?: string
      customId?: string
      tradeCount?: number
      dataVersion?: string
    }
  ): string {
    const keyParts: string[] = [type]

    // Add trade data fingerprint
    if (params.tradeCount !== undefined) {
      keyParts.push(`tc:${params.tradeCount}`)
    }
    
    if (params.dataVersion) {
      keyParts.push(`dv:${params.dataVersion}`)
    }

    // Add filter fingerprint
    if (params.filter) {
      keyParts.push(this.generateFilterFingerprint(params.filter))
    }

    // Add aggregation fingerprint
    if (params.aggregation) {
      keyParts.push(this.generateAggregationFingerprint(params.aggregation))
    }

    // Add chart type
    if (params.chartType) {
      keyParts.push(`chart:${params.chartType}`)
    }

    // Add custom ID
    if (params.customId) {
      keyParts.push(`custom:${params.customId}`)
    }

    return keyParts.join('|')
  }

  /**
   * Invalidate cache entries by pattern
   */
  static invalidate(pattern: CacheInvalidationPattern): number {
    let invalidatedCount = 0
    const keysToDelete: string[] = []

    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      for (const [key] of this.cache) {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key)
        }
      }
    } else {
      if (this.cache.has(pattern)) {
        keysToDelete.push(pattern)
      }
    }

    // Also invalidate entries that depend on the invalidated keys
    for (const [key, entry] of this.cache) {
      if (entry.dependencies.some(dep => 
        keysToDelete.some(deleteKey => 
          dep === deleteKey || (dep.endsWith('*') && deleteKey.startsWith(dep.slice(0, -1)))
        )
      )) {
        keysToDelete.push(key)
      }
    }

    // Remove duplicates and delete
    const uniqueKeys = [...new Set(keysToDelete)]
    for (const key of uniqueKeys) {
      this.cache.delete(key)
      invalidatedCount++
    }

    return invalidatedCount
  }

  /**
   * Warm cache with commonly used calculations
   */
  static async warmCache(
    trades: Trade[],
    commonFilters: AnalyticsFilter[],
    commonAggregations: AggregationConfig[]
  ): Promise<void> {
    const warmupTasks: Array<() => Promise<void>> = []

    // Warm up basic KPI calculations
    warmupTasks.push(async () => {
      const key = this.generateCacheKey('kpi', { 
        tradeCount: trades.length,
        customId: 'basic-kpis'
      })
      // This would be calculated by the analytics engine
      await this.set(key, { placeholder: 'basic-kpis' }, { ttl: 10 * 60 * 1000 })
    })

    // Warm up common filter results
    for (const filter of commonFilters) {
      warmupTasks.push(async () => {
        const key = this.generateCacheKey('filter', { 
          filter,
          tradeCount: trades.length
        })
        // This would be calculated by the filter service
        await this.set(key, { placeholder: 'filtered-trades' }, { ttl: 5 * 60 * 1000 })
      })
    }

    // Warm up common aggregations
    for (const aggregation of commonAggregations) {
      warmupTasks.push(async () => {
        const key = this.generateCacheKey('aggregation', { 
          aggregation,
          tradeCount: trades.length
        })
        // This would be calculated by the aggregation service
        await this.set(key, { placeholder: 'aggregated-data' }, { ttl: 5 * 60 * 1000 })
      })
    }

    // Execute warmup tasks in batches to avoid overwhelming the system
    const batchSize = 5
    for (let i = 0; i < warmupTasks.length; i += batchSize) {
      const batch = warmupTasks.slice(i, i + batchSize)
      await Promise.all(batch.map(task => task().catch(console.error)))
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  /**
   * Get cache statistics and performance metrics
   */
  static getStats(): CacheStats {
    const totalAccesses = this.stats.hits + this.stats.misses
    const hitRate = totalAccesses > 0 ? (this.stats.hits / totalAccesses) * 100 : 0
    const missRate = 100 - hitRate
    const averageAccessTime = this.stats.accessCount > 0 ? 
      this.stats.totalAccessTime / this.stats.accessCount : 0

    const totalMemoryUsage = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0)

    const topKeys = Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(entry => ({ key: entry.key, accessCount: entry.accessCount }))

    return {
      totalEntries: this.cache.size,
      totalMemoryUsage,
      hitRate,
      missRate,
      averageAccessTime,
      topKeys
    }
  }

  /**
   * Clear entire cache
   */
  static clear(): void {
    this.cache.clear()
    this.resetStats()
  }

  /**
   * Shutdown cache system
   */
  static shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    
    if (this.config.enablePersistence) {
      this.savePersistentCache()
    }
  }

  // Private helper methods

  private static generateFilterFingerprint(filter: AnalyticsFilter): string {
    const fingerprint: string[] = []

    if (filter.dateRange) {
      // Support both legacy {start,end} Date and current {startDate,endDate} string formats
      // Normalize to timestamps for stable keys
      const anyRange: any = filter.dateRange as any
      const startTs = anyRange.startDate
        ? new Date(anyRange.startDate).getTime()
        : anyRange.start instanceof Date
          ? anyRange.start.getTime()
          : Number.isFinite(anyRange.start)
            ? Number(anyRange.start)
            : undefined
      const endTs = anyRange.endDate
        ? new Date(anyRange.endDate).getTime()
        : anyRange.end instanceof Date
          ? anyRange.end.getTime()
          : Number.isFinite(anyRange.end)
            ? Number(anyRange.end)
            : undefined

      if (startTs !== undefined && endTs !== undefined) {
        fingerprint.push(`dr:${startTs}-${endTs}`)
      }
    }
    
    if (filter.symbols?.length) {
      fingerprint.push(`s:${filter.symbols.sort().join(',')}`)
    }
    
    if (filter.status?.length) {
      fingerprint.push(`st:${filter.status.sort().join(',')}`)
    }
    
    if (filter.side?.length) {
      fingerprint.push(`side:${filter.side.sort().join(',')}`)
    }
    
    if (filter.pnlRange) {
      fingerprint.push(`pnl:${filter.pnlRange.min || ''}:${filter.pnlRange.max || ''}:${filter.pnlRange.metric}`)
    }
    
    if (filter.tags) {
      fingerprint.push(`tags:${filter.tags.mode}:${(filter.tags.include || []).sort().join(',')}:${(filter.tags.exclude || []).sort().join(',')}`)
    }

    return `f:${fingerprint.join('|')}`
  }

  private static generateAggregationFingerprint(config: AggregationConfig): string {
    const fingerprint: string[] = []

    fingerprint.push(`gb:${config.groupBy.sort().join(',')}`)
    
    if (config.timeframe) {
      fingerprint.push(`tf:${config.timeframe}`)
    }
    
    const metricsStr = config.metrics
      .map(m => `${m.name}:${m.function}:${m.field}`)
      .sort()
      .join(',')
    fingerprint.push(`m:${metricsStr}`)
    
    if (config.sortBy) {
      fingerprint.push(`sort:${config.sortBy.field}:${config.sortBy.direction}`)
    }
    
    if (config.limit) {
      fingerprint.push(`limit:${config.limit}`)
    }

    return `agg:${fingerprint.join('|')}`
  }

  private static serializeValue(value: any, compress: boolean): any {
    if (!compress) return value

    // For large objects, we could implement compression here
    // For now, just return the value as-is
    return value
  }

  private static deserializeValue(value: any): any {
    return value
  }

  private static estimateSize(value: any): number {
    // Rough estimation of memory usage
    return JSON.stringify(value).length * 2 // 2 bytes per character in JS
  }

  private static async ensureMemoryLimit(newEntrySize: number): Promise<void> {
    const currentMemoryUsage = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0)

    if (currentMemoryUsage + newEntrySize <= this.config.maxMemoryUsage && 
        this.cache.size < this.config.maxEntries) {
      return
    }

    // Evict entries using LRU + frequency strategy
    const entries = Array.from(this.cache.values())
      .sort((a, b) => {
        // Score based on access frequency and recency
        const scoreA = a.accessCount * Math.log(Date.now() - a.lastAccessed + 1)
        const scoreB = b.accessCount * Math.log(Date.now() - b.lastAccessed + 1)
        return scoreA - scoreB
      })

    let freedMemory = 0
    let evictedCount = 0
    
    for (const entry of entries) {
      if (freedMemory >= newEntrySize && this.cache.size < this.config.maxEntries) {
        break
      }
      
      this.cache.delete(entry.key)
      freedMemory += entry.size
      evictedCount++
    }
  }

  private static cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key)
    }
  }

  private static recordAccessTime(time: number): void {
    this.stats.totalAccessTime += time
    this.stats.accessCount++
  }

  private static resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalAccessTime: 0,
      accessCount: 0
    }
  }

  private static loadPersistentCache(): void {
    try {
      const stored = localStorage.getItem('tradestial_analytics_cache')
      if (stored) {
        const data = JSON.parse(stored)
        this.persistentCache = new Map(data)
        
        // Restore valid entries to memory cache
        for (const [key, entry] of this.persistentCache) {
          if (Date.now() <= entry.timestamp + entry.ttl) {
            this.cache.set(key, entry)
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to load persistent cache:', error)
    }
  }

  private static savePersistentCache(): void {
    try {
      const data = Array.from(this.persistentCache.entries())
      localStorage.setItem('tradestial_analytics_cache', JSON.stringify(data))
    } catch (error) {
      logger.warn('Failed to save persistent cache:', error)
    }
  }
}