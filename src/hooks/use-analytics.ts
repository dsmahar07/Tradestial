/**
 * Hook for using the reactive analytics system
 * Provides easy access to analytics state and methods
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { ReactiveAnalyticsService, AnalyticsState } from '@/services/reactive-analytics.service'
import { AnalyticsFilter, AggregationConfig } from '@/services/analytics-filter.service'
import { AnalyticsCacheService } from '@/services/analytics-cache.service'

interface UseAnalyticsOptions {
  autoInit?: boolean
  enableCache?: boolean
  debounceMs?: number
  filter?: (state: AnalyticsState) => boolean
  /**
   * If true (default), subscribes to DataStore changes and forwards trades into analytics.
   * Set to false in nested hooks/components (e.g., useChartData) to avoid duplicate subscriptions.
   */
  subscribeDataStore?: boolean
}

// Module-scoped guards to avoid multiple global subscriptions
let globalAnalyticsInstance: ReactiveAnalyticsService | null = null
let dataStoreUnsubscribe: (() => void) | null = null

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const {
    autoInit = true,
    enableCache = true,
    debounceMs = 300,
    filter,
    subscribeDataStore = true
  } = options

  const [state, setState] = useState<AnalyticsState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const analyticsRef = useRef<ReactiveAnalyticsService | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Initialize analytics service
  useEffect(() => {
    if (!autoInit) return

    const initializeAnalytics = async () => {
      try {
        // Reuse a shared instance if present
        globalAnalyticsInstance = ReactiveAnalyticsService.getInstance({
          enableCache,
          debounceMs,
          batchUpdates: true,
          maxConcurrentCalculations: 3,
          enableWorkers: false,
          debug: process.env.NODE_ENV !== 'production'
        })
        analyticsRef.current = globalAnalyticsInstance

        // Subscribe to state changes
        unsubscribeRef.current = analyticsRef.current.subscribe(
          (newState) => {
            setState(newState)
            setLoading(newState.loading)
            setError(newState.error)
          },
          {
            filter,
            immediate: true
          }
        )

        // Load initial data and optionally subscribe to DataStore ONCE per app
        if (subscribeDataStore) {
          const { DataStore } = await import('@/services/data-store.service')
          const trades = DataStore.getAllTrades()

          if (trades.length > 0) {
            await analyticsRef.current.updateTrades(trades)
            if (process.env.NODE_ENV !== 'production') console.debug(`✅ Analytics initialized with ${trades.length} trades`)
          } else {
            if (process.env.NODE_ENV !== 'production') console.debug('✅ Analytics initialized with empty dataset')
          }

          // Ensure we subscribe to DataStore only once globally
          if (!dataStoreUnsubscribe) {
            dataStoreUnsubscribe = DataStore.subscribe(async () => {
              const updatedTrades = DataStore.getAllTrades()
              if (globalAnalyticsInstance) {
                await globalAnalyticsInstance.updateTrades(updatedTrades)
                if (process.env.NODE_ENV !== 'production') console.debug(`📊 Analytics updated with ${updatedTrades.length} trades`)
              }
            })
            if (process.env.NODE_ENV !== 'production') console.debug('🔗 Subscribed to DataStore changes (singleton)')
          }
        }

      } catch (err) {
        console.error('❌ Failed to initialize analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize analytics')
        setLoading(false)
      }
    }

    initializeAnalytics()

    return () => {
      // Only clean up this hook's subscription; keep global DataStore subscription alive
      unsubscribeRef.current?.()
    }
  }, [autoInit, enableCache, debounceMs, filter, subscribeDataStore])

  // Methods
  const updateTrades = useCallback(async (trades: any[]) => {
    if (!analyticsRef.current) return
    await analyticsRef.current.updateTrades(trades)
  }, [])

  const updateFilters = useCallback(async (filters: AnalyticsFilter) => {
    if (!analyticsRef.current) return
    await analyticsRef.current.updateFilters(filters)
  }, [])

  const updateAggregationConfig = useCallback(async (config: AggregationConfig) => {
    if (!analyticsRef.current) return
    await analyticsRef.current.updateAggregationConfig(config)
  }, [])

  const getChartData = useCallback(async (chartType: string, config?: any) => {
    if (!analyticsRef.current) return []
    return await analyticsRef.current.getChartData(chartType, config)
  }, [])

  const reset = useCallback(async () => {
    if (!analyticsRef.current) return
    await analyticsRef.current.reset()
  }, [])

  const getPerformanceMetrics = useCallback(() => {
    if (!analyticsRef.current) return null
    return analyticsRef.current.getPerformanceMetrics()
  }, [])

  return {
    // State
    state,
    loading,
    error,
    
    // Computed values
    trades: state?.trades || [],
    filteredTrades: state?.filteredTrades || [],
    metrics: state?.metrics,
    chartData: state?.chartData || {},
    
    // Methods
    updateTrades,
    updateFilters,
    updateAggregationConfig,
    getChartData,
    reset,
    getPerformanceMetrics,
    getProcessingStatus: () => analyticsRef.current?.getProcessingStatus(),
    
    // Analytics instance (advanced usage)
    analytics: analyticsRef.current
  }
}

/**
 * Hook for specific chart data with automatic updates
 */
export function useChartData(chartType: string, config?: any, deps: any[] = []) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // Initialize analytics and ensure DataStore subscription so charts react to imports
  const { analytics, state } = useAnalytics({ subscribeDataStore: true })

  useEffect(() => {
    if (!analytics) return

    let mounted = true

    const fetchData = async () => {
      setLoading(true)
      try {
        const chartData = await analytics.getChartData(chartType, config)
        if (mounted) {
          setData(chartData)
        }
      } catch (error) {
        console.error(`Failed to fetch chart data for ${chartType}:`, error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
    // Re-fetch when analytics state changes (e.g., trades imported/filters changed)
  }, [analytics, chartType, JSON.stringify(config), state?.lastUpdated, ...deps])

  return { data, loading }
}

/**
 * Hook for analytics performance monitoring
 */
export function useAnalyticsPerformance() {
  const [metrics, setMetrics] = useState<any>(null)
  const { analytics } = useAnalytics()

  useEffect(() => {
    if (!analytics) return

    const interval = setInterval(() => {
      const performanceMetrics = analytics.getPerformanceMetrics()
      setMetrics(performanceMetrics)
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [analytics])

  const cacheStats = useCallback(() => {
    return AnalyticsCacheService.getStats()
  }, [])

  return {
    metrics,
    cacheStats,
    clearCache: () => AnalyticsCacheService.clear()
  }
}

/**
 * Hook for filtered analytics data
 */
export function useFilteredAnalytics(filters: AnalyticsFilter) {
  const { state, updateFilters } = useAnalytics()
  const [isApplyingFilter, setIsApplyingFilter] = useState(false)

  useEffect(() => {
    const applyFilters = async () => {
      setIsApplyingFilter(true)
      try {
        await updateFilters(filters)
      } finally {
        setIsApplyingFilter(false)
      }
    }

    applyFilters()
  }, [JSON.stringify(filters), updateFilters])

  return {
    filteredTrades: state?.filteredTrades || [],
    metrics: state?.metrics,
    isApplyingFilter,
    filterTime: state?.filterTime || 0
  }
}