import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { PerformanceChart, ChartDataWithMetrics } from '@/types/performance'

interface UseChartDataOptions {
  data: PerformanceChart
  primaryMetric: string
  additionalMetrics: string[]
  onDataRequest?: (metric: string) => PerformanceChart | Promise<PerformanceChart>
}

interface UseChartDataReturn {
  chartData: ChartDataWithMetrics[]
  isLoading: boolean
  error: string | null
  cachedData: Record<string, any[]>
  refetchMetric: (metric: string) => Promise<void>
}

export function useChartData({
  data,
  primaryMetric,
  additionalMetrics,
  onDataRequest
}: UseChartDataOptions): UseChartDataReturn {
  const [cachedData, setCachedData] = useState<Record<string, typeof data.data>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use refs to track ongoing requests and prevent race conditions
  const activeRequests = useRef(new Set<string>())
  const abortControllers = useRef(new Map<string, AbortController>())
  
  // Stable reference to onDataRequest to prevent infinite loops
  const onDataRequestRef = useRef(onDataRequest)
  useEffect(() => {
    onDataRequestRef.current = onDataRequest
  }, [onDataRequest])

  // Get data for a specific metric with caching
  const getMetricData = useCallback((metric: string) => {
    if (metric === data.title) return data.data || []
    return cachedData[metric] || []
  }, [data.title, data.data, cachedData])

  // Fetch data for a specific metric with proper cleanup
  const fetchMetricData = useCallback(async (metric: string): Promise<void> => {
    if (!onDataRequestRef.current || activeRequests.current.has(metric)) {
      return
    }

    // Cancel any existing request for this metric
    const existingController = abortControllers.current.get(metric)
    if (existingController) {
      existingController.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllers.current.set(metric, controller)
    activeRequests.current.add(metric)

    try {
      setIsLoading(true)
      setError(null)

      const result = await Promise.resolve(onDataRequestRef.current(metric))
      
      // Check if request was aborted
      if (controller.signal.aborted) {
        return
      }

      const series = (result && typeof result === 'object' && 'data' in result)
        ? (result as any).data || []
        : []

      setCachedData(prev => {
        // Avoid unnecessary state updates
        if (prev[metric] === series) return prev
        return { ...prev, [metric]: series }
      })
    } catch (err) {
      if (controller.signal.aborted) {
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metric data'
      setError(errorMessage)
      console.warn(`Failed to fetch data for metric: ${metric}`, err)
      
      // Cache empty array to avoid repeated failures
      setCachedData(prev => ({ ...prev, [metric]: [] }))
    } finally {
      activeRequests.current.delete(metric)
      abortControllers.current.delete(metric)
      
      // Only set loading to false if no other requests are active
      if (activeRequests.current.size === 0) {
        setIsLoading(false)
      }
    }
  }, [])

  // Refetch a specific metric (public API)
  const refetchMetric = useCallback(async (metric: string): Promise<void> => {
    // Remove from cache to force refetch
    setCachedData(prev => {
      const newCache = { ...prev }
      delete newCache[metric]
      return newCache
    })
    
    await fetchMetricData(metric)
  }, [fetchMetricData])

  // Fetch missing metrics when dependencies change
  useEffect(() => {
    if (!onDataRequestRef.current) return

    const allMetrics = [primaryMetric, ...additionalMetrics]
    const toFetch = allMetrics.filter(metric => 
      metric !== data.title && 
      !cachedData[metric] && 
      !activeRequests.current.has(metric)
    )

    if (toFetch.length === 0) return

    // Fetch all missing metrics
    toFetch.forEach(metric => {
      fetchMetricData(metric)
    })

    // Cleanup function to abort all requests
    return () => {
      abortControllers.current.forEach(controller => controller.abort())
      abortControllers.current.clear()
      activeRequests.current.clear()
    }
  }, [primaryMetric, additionalMetrics, data.title, cachedData, fetchMetricData])

  // Prepare chart data with robust alignment and validation
  const chartData = useMemo((): ChartDataWithMetrics[] => {
    const primaryData = getMetricData(primaryMetric)
    if (!primaryData || primaryData.length === 0) return []
    
    try {
      // Create comprehensive date index from all available metrics
      const allDates = new Set<string>()
      const metricDataMap = new Map<string, Map<string, number>>()
      
      // Index primary metric data
      const primaryDateMap = new Map<string, number>()
      primaryData.forEach(point => {
        if (point?.date && typeof point.value === 'number' && isFinite(point.value)) {
          allDates.add(point.date)
          primaryDateMap.set(point.date, point.value)
        }
      })
      metricDataMap.set(primaryMetric, primaryDateMap)
      
      // Index additional metrics data
      additionalMetrics.forEach(metric => {
        const metricData = getMetricData(metric)
        const dateMap = new Map<string, number>()
        
        metricData.forEach(point => {
          if (point?.date && typeof point.value === 'number' && isFinite(point.value)) {
            allDates.add(point.date)
            dateMap.set(point.date, point.value)
          }
        })
        metricDataMap.set(metric, dateMap)
      })
      
      // Sort dates chronologically with error handling
      const sortedDates = Array.from(allDates).sort((a, b) => {
        try {
          const dateA = new Date(a)
          const dateB = new Date(b)
          
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return a.localeCompare(b) // Fallback to string comparison
          }
          
          return dateA.getTime() - dateB.getTime()
        } catch {
          return a.localeCompare(b)
        }
      })
      
      // Build chart data with proper alignment
      return sortedDates
        .map((date, index) => {
          const primaryValue = primaryDateMap.get(date)
          if (primaryValue === undefined || !isFinite(primaryValue)) {
            return null // Will be filtered out
          }

          const chartPoint: ChartDataWithMetrics = {
            date,
            value: primaryValue,
            index,
            [primaryMetric]: primaryValue
          }
          
          // Add additional metrics with validation
          additionalMetrics.forEach(metric => {
            const metricDateMap = metricDataMap.get(metric)
            const value = metricDateMap?.get(date)
            if (value !== undefined && isFinite(value)) {
              chartPoint[metric] = value
            }
          })
          
          return chartPoint
        })
        .filter((point): point is ChartDataWithMetrics => point !== null)
    } catch (err) {
      console.error('Error preparing chart data:', err)
      setError('Failed to prepare chart data')
      return []
    }
  }, [primaryMetric, additionalMetrics, getMetricData])

  return {
    chartData,
    isLoading,
    error,
    cachedData,
    refetchMetric
  }
}
