'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { ChevronDown, MoreHorizontal, Search } from 'lucide-react'
import { 
  PerformanceChart as ChartData, 
  CustomTooltipProps, 
  ChartDataWithMetrics, 
  ChartType,
  MetricCategory 
} from '@/types/performance'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart, 
  BarChart, 
  Bar, 
  ComposedChart,
  ReferenceLine 
} from 'recharts'

interface PerformanceChartProps {
  data: ChartData
  className?: string
  // Optional props for customization (with defaults for backward compatibility)
  availableMetrics?: MetricCategory
  colorPalette?: string[]
  height?: string
  onDataRequest?: (metric: string) => ChartData | Promise<ChartData>
  // Context for dynamic tooltips
  contextInfo?: {
    subTab?: string // e.g., "days", "months", "symbols", "volumes"
    periodLabels?: string[] // e.g., ["Sunday", "Monday", ...] or ["January", "February", ...]
    getPeriodLabel?: (date: string, index: number) => string // Custom function to get period label
  }
}

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function PerformanceChart({ 
  data, 
  className,
  availableMetrics,
  colorPalette,
  height = "h-[400px]",
  onDataRequest,
  contextInfo
}: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<'Day' | 'Week' | 'Month'>(data.timeframe || 'Day')
  const [primaryMetric, setPrimaryMetric] = useState<string>(data.title)
  const [additionalMetrics, setAdditionalMetrics] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Time Analysis'])
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownStates, setDropdownStates] = useState({
    metric: false,
    addMetric: false,
    timeframe: false,
    customization: false
  })
  const [activeMetricIndex, setActiveMetricIndex] = useState<number | null>(null)
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({})
  const [chartColors, setChartColors] = useState<Record<string, string>>({})
  const [cachedData, setCachedData] = useState<Record<string, typeof data.data>>({})
  
  // Refs for click outside detection
  const metricDropdownRef = useRef<HTMLDivElement>(null)
  const addMetricDropdownRef = useRef<HTMLDivElement>(null)
  const timeframeDropdownRef = useRef<HTMLDivElement>(null)
  const customizationDropdownRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Format values for display
  const formatValue = useCallback((value: number): string => {
    if (!isFinite(value) || isNaN(value)) return '0'
    if (value === 0) return '0'
    const abs = Math.abs(value)
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    // Show decimals for small magnitudes (helps R-multiple charts)
    if (abs < 10) return value.toFixed(2)
    if (abs < 1) return value.toFixed(3) // Better precision for very small values
    return value.toFixed(0)
  }, [])

  // Determine if a metric name represents an R-multiple
  const isRMultipleMetric = useCallback((name: string): boolean => {
    const normalized = name.toLowerCase().trim()
    return normalized.includes('r-multiple') || 
           normalized.includes('r multiple') || 
           normalized === 'rmultiple' ||
           normalized.startsWith('avg. planned r-multiple') ||
           normalized.startsWith('avg. realized r-multiple')
  }, [])

  // Axis-aware tick formatters: add 'R' for R-multiple axes
  const leftAxisIsR = useMemo(() => isRMultipleMetric(primaryMetric), [primaryMetric, isRMultipleMetric])
  const rightAxisIsR = useMemo(
    () => additionalMetrics.some((m) => isRMultipleMetric(m)),
    [additionalMetrics, isRMultipleMetric]
  )

  const formatLeftAxisTick = useCallback((v: number) => {
    const base = formatValue(v)
    return leftAxisIsR ? `${base}R` : base
  }, [formatValue, leftAxisIsR])

  const formatRightAxisTick = useCallback((v: number) => {
    const base = formatValue(v)
    return rightAxisIsR ? `${base}R` : base
  }, [formatValue, rightAxisIsR])

  // Format date labels for X-axis
  const formatDate = useCallback((dateString: string): string => {
    // Handle YYYY-MM-DD safely without constructing a UTC Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [yyyy, mm, dd] = dateString.split('-')
      // Map month to short name
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthIdx = Math.max(0, Math.min(11, parseInt(mm, 10) - 1))
      return `${months[monthIdx]} ${dd}`
    }
    // Fallback to local parsing for other formats
    const d = new Date(dateString)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    }
    // If not parseable, return as-is
    return dateString
  }, [])


  // Truncate long metric names for display
  const getDisplayMetricName = useCallback((metric: string): string => {
    if (metric.length <= 25) return metric
    
    if (metric.includes(' - cumulative')) {
      const baseName = metric.replace(' - cumulative', '')
      if (baseName.length <= 20) return baseName + '...'
      return baseName.substring(0, 20) + '...'
    }
    
    return metric.substring(0, 25) + '...'
  }, [])

  // Custom Y-axis tick component with color indicators only
  const CustomYAxisTick = useCallback(({ x, y, payload, side, color, metrics, allMetrics, getChartColor }: any) => {
    
    return (
      <g transform={`translate(${x},${y})`}>
        {/* Tick text */}
        <text
          x={side === 'left' ? -25 : 25}
          y={0}
          dy={4}
          textAnchor={side === 'left' ? 'end' : 'start'}
          fill="#6B7280"
          fontSize={13}
          fontWeight="600"
        >
          {formatValue(payload.value)}
        </text>
        
        {/* Color indicator dots */}
        {side === 'left' ? (
          // Single dot for primary metric on left
          <circle
            cx={-15}
            cy={0}
            r={3}
            fill={color}
          />
        ) : (
          // Multiple dots for additional metrics on right
          metrics && metrics.map((metric: string, index: number) => (
            <circle
              key={metric}
              cx={60 + (index * 8)} // Moved even further right
              cy={0}
              r={3}
              fill={getChartColor(metric, index + 1)}
            />
          ))
        )}
      </g>
    )
  }, [formatValue])

  // Helper function to get contextual period label
  const getContextualPeriodLabel = useCallback((date: string, dataIndex?: number) => {
    if (contextInfo?.getPeriodLabel && typeof dataIndex === 'number') {
      return contextInfo.getPeriodLabel(date, dataIndex)
    }
    
    if (contextInfo?.periodLabels && typeof dataIndex === 'number') {
      return contextInfo.periodLabels[dataIndex] || formatDate(date)
    }
    
    return formatDate(date)
  }, [contextInfo, formatDate])


  // Metrics categories with organized structure - Complete list
  const defaultMetricsCategories: MetricCategory = useMemo(() => ({
    'Time Analysis': [
      'Average trading days duration',
      'Avg hold time',
      'Longest trade duration',
      'Max trading days duration'
    ],
    'Profitability': [
      'Avg daily net P&L',
      'Avg daily win/loss',
      'Avg loss',
      'Avg max trade loss',
      'Avg max trade profit',
      'Avg net trade P&L',
      'Avg trade win/loss',
      'Avg win',
      'Largest losing trade',
      'Largest profitable trade',
      'Net P&L',
      'Profit factor',
      'Trade expectancy'
    ],
    'Risk & Drawdown': [
      'Avg daily net drawdown',
      'Avg. planned r-multiple',
      'Avg. realized r-multiple',
      'Breakeven days',
      'Breakeven trades',
      'Max daily net drawdown'
    ],
    'Trading Activity & Volume': [
      'Avg daily volume',
      'Daily net drawdown',
      'Logged days',
      'Long # of breakeven trades',
      'Long # of losing trades',
      'Long # of trades',
      'Long # of winning trades',
      'Net account balance',
      'Short # of breakeven trades',
      'Short # of losing trades',
      'Short # of trades',
      'Short # of winning trades',
      'Trade count',
      'Volume'
    ],
    'Streaks & Consistency': [
      'Avg daily win%',
      'Long win%',
      'Max consecutive losing days',
      'Max consecutive losses',
      'Max consecutive winning days',
      'Max consecutive wins',
      'Short win%',
      'Win%'
    ]
  }), [])

  const metricsCategories = availableMetrics || defaultMetricsCategories

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }, [])

  // Handle metric selection with proper validation
  const handleMetricSelect = useCallback((metric: string, metricIndex: number) => {
    if (metricIndex === 0) {
      setPrimaryMetric(metric)
    } else {
      setAdditionalMetrics(prev => {
        const newMetrics = [...prev]
        newMetrics[metricIndex - 1] = metric
        return newMetrics
      })
    }
    setSearchQuery('')
    setDropdownStates(prev => ({ ...prev, metric: false }))
    setActiveMetricIndex(null)
  }, [])

  // Handle adding new metric
  const handleAddMetric = useCallback((metric: string) => {
    if (additionalMetrics.length < 2 && 
        !additionalMetrics.includes(metric) && 
        metric !== primaryMetric) {
      setAdditionalMetrics(prev => [...prev, metric])
    }
    setSearchQuery('')
    setDropdownStates(prev => ({ ...prev, addMetric: false }))
  }, [additionalMetrics, primaryMetric])

  // Handle removing metric
  const handleRemoveMetric = useCallback((metricToRemove: string) => {
    setAdditionalMetrics(prev => prev.filter(m => m !== metricToRemove))
  }, [])

  // Get colors for multiple metrics
  const getMetricColor = useCallback((index: number): string => {
    const defaultColors = ['#335CFF', '#FA7319', '#FB3748', '#1DAF61', '#F6B51E', '#693EE0', '#47C2FF', '#E9358F']
    const colors = colorPalette || defaultColors
    return colors[index] || '#6B7280'
  }, [colorPalette])

  // Get all metrics (primary + additional)
  const allMetrics = useMemo(() => [primaryMetric, ...additionalMetrics], [primaryMetric, additionalMetrics])

  // Get real data for metrics - with better fallback handling
  const getRealMetricData = useCallback((metric: string) => {
    // Synchronous accessor: only return immediately available data
    if (metric === data.title) {
      return data.data || []
    }
    if (cachedData[metric]) {
      return cachedData[metric]
    }
    return []
  }, [data, cachedData])

  // Prefetch metric series when selections change (supports async onDataRequest)
  useEffect(() => {
    let cancelled = false
    if (!onDataRequest) return

    const toFetch = allMetrics.filter(m => 
      m !== data.title && 
      !cachedData[m]
    )
    if (toFetch.length === 0) return

    toFetch.forEach((metric) => {
      try {
        const res = onDataRequest(metric)
        Promise.resolve(res)
          .then((chartData) => {
            if (cancelled) return
            const series = (chartData && typeof chartData === 'object' && 'data' in chartData)
              ? (chartData as any).data || []
              : []
            setCachedData(prev => {
              // Avoid unnecessary state updates
              if (prev[metric] === series) return prev
              return { ...prev, [metric]: series }
            })
          })
          .catch((error) => {
            if (cancelled) return
            console.warn(`Failed to fetch data for metric: ${metric}`, error)
            // On failure, cache empty array to avoid repeated fetch loops
            setCachedData(prev => ({ ...prev, [metric]: [] }))
          })
      } catch (e) {
        console.warn(`Synchronous error fetching metric: ${metric}`, e)
        setCachedData(prev => ({ ...prev, [metric]: [] }))
      }
    })

    return () => { cancelled = true }
  }, [allMetrics, data.title, onDataRequest, cachedData])

  // Get data for metrics from cache or base data
  const getMetricData = useCallback((metric: string) => {
    if (metric === data.title) return data.data
    return cachedData[metric] || []
  }, [data, cachedData])

  // Prepare chart data with proper date alignment validation
  const chartData: ChartDataWithMetrics[] = useMemo(() => {
    const primaryData = getMetricData(primaryMetric)
    if (!primaryData || primaryData.length === 0) return []
    
    return primaryData.map((point, index) => {
      const chartPoint: ChartDataWithMetrics = {
        date: point.date,
        value: point.value,
        index,
        [primaryMetric]: point.value
      }
      
      additionalMetrics.forEach((metric) => {
        const metricData = getMetricData(metric)
        // Find matching data point by date instead of assuming same index
        const matchingPoint = metricData.find(p => p.date === point.date)
        if (matchingPoint) {
          chartPoint[metric] = matchingPoint.value
        } else {
          // If no matching date found, try by index as fallback
          if (metricData[index] && metricData[index].date === point.date) {
            chartPoint[metric] = metricData[index].value
          }
        }
      })
      
      return chartPoint
    })
  }, [primaryMetric, additionalMetrics, getMetricData])

  // Format X-axis labels with contextual information
  const formatXAxisLabel = useCallback((dateString: string): string => {
    if (contextInfo?.getPeriodLabel) {
      // Find the data point index for this date
      const dataIndex = chartData.findIndex(d => d.date === dateString)
      if (dataIndex !== -1) {
        return contextInfo.getPeriodLabel(dateString, dataIndex)
      }
    }
    
    if (contextInfo?.periodLabels) {
      const dataIndex = chartData.findIndex(d => d.date === dateString)
      if (dataIndex !== -1 && contextInfo.periodLabels[dataIndex]) {
        return contextInfo.periodLabels[dataIndex]
      }
    }
    
    return formatDate(dateString)
  }, [contextInfo, chartData, formatDate])

  // Custom tooltip component with improved data accuracy
  const CustomTooltip = useCallback(({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length && label) {
      // More robust data point finding with date validation
      const dataIndex = chartData.findIndex(d => {
        // Try exact match first
        if (d.date === label) return true
        // Try normalized date comparison for different formats
        const normalizeDate = (dateStr: string) => {
          const date = new Date(dateStr)
          return isNaN(date.getTime()) ? dateStr : date.toISOString().split('T')[0]
        }
        return normalizeDate(d.date) === normalizeDate(String(label))
      })
      
      const periodLabel = getContextualPeriodLabel(String(label), dataIndex >= 0 ? dataIndex : undefined)
      
      // Filter out invalid payload entries
      const validPayload = payload.filter(entry => 
        entry.value != null && 
        isFinite(Number(entry.value)) && 
        !isNaN(Number(entry.value))
      )
      
      if (validPayload.length === 0) return null
      
      return (
        <div 
          className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 text-sm"
          role="tooltip"
          aria-label={`Chart data for ${periodLabel}`}
        >
          <div className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-xs">
            {periodLabel}
          </div>
          {validPayload.map((entry, index) => {
            const metricName = String(entry.dataKey || '')
            const value = Number(entry.value)
            const formattedValue = formatValue(value)
            const isRMultiple = isRMultipleMetric(metricName)
            
            return (
              <div key={`${metricName}-${index}`} className="flex items-center justify-between mb-1 last:mb-0">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                    {getDisplayMetricName(metricName)}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {isRMultiple ? `${formattedValue}R` : formattedValue}
                </span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }, [getContextualPeriodLabel, getDisplayMetricName, formatValue, chartData, isRMultipleMetric])

  // Calculate dynamic Y-axis domains for left and right axes with smart scaling
  const yAxisDomains = useMemo(() => {
    if (allMetrics.length === 0) return { left: [0, 100], right: [0, 100] }
    
    // Primary metric (first) goes on left axis
    const primaryValues = chartData
      .map(point => point[primaryMetric] as number)
      .filter(val => typeof val === 'number' && isFinite(val))
    
    // Additional metrics go on right axis
    const additionalValues = chartData.flatMap(point => 
      additionalMetrics
        .map(metric => point[metric] as number)
        .filter(val => typeof val === 'number' && isFinite(val))
    )
    
    const calculateSmartDomain = (values: number[], metricName?: string) => {
      if (values.length === 0) return [0, 100]
      
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      // Handle flat lines (all values the same)
      if (min === max) {
        if (min === 0) return [-1, 1]
        const absValue = Math.abs(min)
        return [min - absValue * 0.1, max + absValue * 0.1]
      }
      
      const range = max - min
      
      // Smart padding based on metric type and value range
      let paddingPercent = 0.1 // Default 10%
      
      // Percentage metrics (win rates, etc.) should be bounded
      if (metricName && (
        metricName.toLowerCase().includes('win%') ||
        metricName.toLowerCase().includes('rate') ||
        metricName.toLowerCase().includes('percent')
      )) {
        const domainMin = Math.max(0, min - range * 0.05)
        const domainMax = Math.min(100, max + range * 0.05)
        return [domainMin, domainMax]
      }
      
      // Count metrics should start from 0
      if (metricName && (
        metricName.toLowerCase().includes('count') ||
        metricName.toLowerCase().includes('# of') ||
        metricName.toLowerCase().includes('number of')
      )) {
        return [0, max + range * 0.1]
      }
      
      // R-multiple metrics
      if (metricName && isRMultipleMetric(metricName)) {
        paddingPercent = 0.15 // Slightly more padding for R-multiples
      }
      
      // Very small ranges need proportionally larger padding
      if (range < 1) {
        paddingPercent = 0.2
      }
      
      const padding = range * paddingPercent
      return [min - padding, max + padding]
    }
    
    return {
      left: calculateSmartDomain(primaryValues, primaryMetric),
      right: additionalMetrics.length > 0 
        ? calculateSmartDomain(additionalValues, additionalMetrics[0]) 
        : [0, 100]
    }
  }, [chartData, allMetrics, primaryMetric, additionalMetrics, isRMultipleMetric])

  // Generate clean grid lines based on Y-axis domains with nice numbers
  const gridLineValues = useMemo(() => {
    const generateNiceTicks = (domain: [number, number], tickCount: number = 5) => {
      const [min, max] = domain
      const range = max - min
      
      if (range === 0) return [min]
      
      // Calculate nice step size
      const roughStep = range / (tickCount - 1)
      const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
      const normalizedStep = roughStep / magnitude
      
      let niceStep
      if (normalizedStep <= 1) niceStep = 1
      else if (normalizedStep <= 2) niceStep = 2
      else if (normalizedStep <= 5) niceStep = 5
      else niceStep = 10
      
      const step = niceStep * magnitude
      
      // Generate ticks starting from a nice number
      const niceMin = Math.floor(min / step) * step
      const niceMax = Math.ceil(max / step) * step
      
      const ticks = []
      for (let tick = niceMin; tick <= niceMax; tick += step) {
        if (tick >= min && tick <= max) {
          ticks.push(Math.round(tick * 1000) / 1000) // Round to avoid floating point issues
        }
      }
      
      return ticks.length > 0 ? ticks : [min, max]
    }

    return {
      left: generateNiceTicks(yAxisDomains.left as [number, number]),
      right: additionalMetrics.length > 0 ? generateNiceTicks(yAxisDomains.right as [number, number]) : []
    }
  }, [yAxisDomains, additionalMetrics])

  // Chart customization functions
  const getChartType = useCallback((metric: string): ChartType => 
    chartTypes[metric] || 'Line', [chartTypes])
  
  const getChartColor = useCallback((metric: string, index: number): string => 
    chartColors[metric] || getMetricColor(index), [chartColors, getMetricColor])

  // Available colors for customization
  const defaultAvailableColors = ['#335CFF', '#FA7319', '#FB3748', '#1DAF61', '#F6B51E', '#693EE0', '#47C2FF', '#E9358F']
  const availableColors = colorPalette || defaultAvailableColors

  const handleChartTypeChange = useCallback((metric: string, type: ChartType) => {
    setChartTypes(prev => ({ ...prev, [metric]: type }))
  }, [])

  const handleColorChange = useCallback((metric: string, color: string) => {
    setChartColors(prev => ({ ...prev, [metric]: color }))
  }, [])

  const resetToDefault = useCallback(() => {
    setChartTypes({})
    setChartColors({})
  }, [])

  // Improved dropdown state management
  const toggleDropdown = useCallback((dropdownName: keyof typeof dropdownStates) => {
    setDropdownStates(prev => ({
      ...prev,
      [dropdownName]: !prev[dropdownName],
      // Close other dropdowns
      ...Object.keys(prev).reduce((acc, key) => {
        if (key !== dropdownName) acc[key as keyof typeof prev] = false
        return acc
      }, {} as Partial<typeof prev>)
    }))
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (metricDropdownRef.current && !metricDropdownRef.current.contains(target)) {
        setDropdownStates(prev => ({ ...prev, metric: false }))
        setActiveMetricIndex(null)
      }
      if (addMetricDropdownRef.current && !addMetricDropdownRef.current.contains(target)) {
        setDropdownStates(prev => ({ ...prev, addMetric: false }))
      }
      if (timeframeDropdownRef.current && !timeframeDropdownRef.current.contains(target)) {
        setDropdownStates(prev => ({ ...prev, timeframe: false }))
      }
      if (customizationDropdownRef.current && !customizationDropdownRef.current.contains(target)) {
        setDropdownStates(prev => ({ ...prev, customization: false }))
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter categories and metrics based on search with memoization
  const filteredCategories = useMemo(() => {
    if (debouncedSearchQuery.trim() === '') {
      return metricsCategories
    }
    
    return Object.entries(metricsCategories).reduce((acc, [category, metrics]) => {
      const filteredMetrics = metrics.filter(metric => 
        metric.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        category.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      if (filteredMetrics.length > 0) {
        acc[category] = filteredMetrics
      }
      return acc
    }, {} as MetricCategory)
  }, [metricsCategories, debouncedSearchQuery])

  return (
    <Card className={cn("border-0 shadow-none bg-white dark:bg-[#0f0f0f]", className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Chart Customization Button */}
            <div className="relative" ref={customizationDropdownRef}>
              <button 
                onClick={() => toggleDropdown('customization')}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                aria-label="Chart customization options"
                aria-expanded={dropdownStates.customization}
                aria-haspopup="true"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 9H9V21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V11C3 10.4696 3.21071 9.96086 3.58579 9.58579C3.96086 9.21071 4.46957 9 5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5V21H9V5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 7H19C19.5304 7 20.0391 7.21071 20.4142 7.58579C20.7893 7.96086 21 8.46957 21 9V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Customization Dropdown */}
              {dropdownStates.customization && (
                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-[280px] max-h-[400px] overflow-y-auto z-50">
                  <div className="p-4 space-y-4">
                    {allMetrics.map((metric, index) => (
                      <div key={metric} className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {getDisplayMetricName(metric)}
                        </div>
                        
                        {/* Color Picker */}
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-300 dark:border-[#2a2a2a] flex-shrink-0" 
                            style={{ backgroundColor: getChartColor(metric, index) }}
                            aria-label={`Current color for ${metric}`}
                          />
                          <div className="flex gap-1 flex-wrap">
                            {availableColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => handleColorChange(metric, color)}
                                className={cn(
                                  "w-5 h-5 rounded border-2 transition-all",
                                  getChartColor(metric, index) === color 
                                    ? "border-gray-400 scale-110" 
                                    : "border-transparent hover:border-gray-300"
                                )}
                                style={{ backgroundColor: color }}
                                aria-label={`Set color to ${color} for ${metric}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Chart Type Selector */}
                        <div className="relative">
                          <label htmlFor={`chart-type-${index}`} className="sr-only">
                            Chart type for {metric}
                          </label>
                          <select
                            id={`chart-type-${index}`}
                            value={getChartType(metric)}
                            onChange={(e) => handleChartTypeChange(metric, e.target.value as ChartType)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Area">Area</option>
                            <option value="Line">Line</option>
                            <option value="Column">Column</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    {/* Reset Button */}
                    <div className="pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                      <button
                        onClick={resetToDefault}
                        className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        Reset to default
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* All Selected Metrics as Individual Dropdowns */}
            {allMetrics.map((metric, index) => (
              <div key={`${metric}-${index}`} className="relative flex items-center" ref={index === activeMetricIndex ? metricDropdownRef : undefined}>
                <button
                  onClick={() => {
                    setActiveMetricIndex(index)
                    setDropdownStates(prev => ({ 
                      ...prev, 
                      metric: !prev.metric || activeMetricIndex !== index 
                    }))
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[120px] max-w-[180px] lg:max-w-[220px] justify-between"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: getChartColor(metric, index)
                  }}
                  title={metric}
                  aria-label={`Change metric: ${metric}`}
                  aria-expanded={dropdownStates.metric && activeMetricIndex === index}
                  aria-haspopup="true"
                >
                  <span className="truncate text-left">{getDisplayMetricName(metric)}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 flex-shrink-0", dropdownStates.metric && activeMetricIndex === index && "rotate-180")} />
                </button>
                
                {/* Remove button for additional metrics */}
                {index > 0 && (
                  <button
                    onClick={() => handleRemoveMetric(metric)}
                    className="ml-1 text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                    title="Remove metric"
                    aria-label={`Remove ${metric} metric`}
                  >
                    ×
                  </button>
                )}
                
                {/* Dropdown shows for active metric */}
                {activeMetricIndex === index && dropdownStates.metric && (
                  <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-[280px] sm:w-[320px] max-h-[450px] overflow-hidden z-50">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                        <label htmlFor="metric-search" className="sr-only">Search metrics</label>
                        <input
                          id="metric-search"
                          type="text"
                          placeholder="Search metrics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 text-sm border-0 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 transition-colors duration-200"
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="overflow-y-auto max-h-[360px]">
                      {Object.entries(filteredCategories).map(([category, metrics]) => (
                        <div key={category} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                            aria-expanded={expandedCategories.includes(category)}
                          >
                            <span>{category}</span>
                            <ChevronDown 
                              className={cn(
                                "w-4 h-4 transition-transform duration-200 text-gray-400",
                                expandedCategories.includes(category) ? "rotate-180" : ""
                              )}
                              aria-hidden="true"
                            />
                          </button>
                          {expandedCategories.includes(category) && (
                            <div className="pb-2">
                              {metrics.map((metricOption) => {
                                const isAlreadySelected = allMetrics.includes(metricOption)
                                return (
                                  <button
                                    key={metricOption}
                                    onClick={() => !isAlreadySelected && handleMetricSelect(metricOption, index)}
                                    disabled={isAlreadySelected}
                                    className={cn(
                                      "w-full text-left px-6 py-2 text-sm transition-all duration-150",
                                      isAlreadySelected
                                        ? "text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                                    )}
                                    aria-label={`Select ${metricOption}${isAlreadySelected ? ' (already selected)' : ''}`}
                                  >
                                    {metricOption} {isAlreadySelected && "✓"}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* No Results */}
                      {Object.keys(filteredCategories).length === 0 && debouncedSearchQuery && (
                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                          <div className="text-gray-400 mb-2">No metrics found</div>
                          <div className="text-xs">Try a different search term</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Add Metric Button */}
            {additionalMetrics.length < 2 && (
              <div className="relative" ref={addMetricDropdownRef}>
                <button 
                  onClick={() => toggleDropdown('addMetric')}
                  className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
                  aria-label="Add another metric to chart"
                  aria-expanded={dropdownStates.addMetric}
                >
                  + Add metric {additionalMetrics.length > 0 && `(${allMetrics.length}/3)`}
                </button>

                {/* Add Metric Dropdown */}
                {dropdownStates.addMetric && (
                  <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-[280px] sm:w-[320px] max-h-[450px] overflow-hidden z-50">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                        <label htmlFor="add-metric-search" className="sr-only">Search metrics to add</label>
                        <input
                          id="add-metric-search"
                          type="text"
                          placeholder="Search metrics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 text-sm border-0 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 transition-colors duration-200"
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="overflow-y-auto max-h-[360px]">
                      {Object.entries(filteredCategories).map(([category, metrics]) => (
                        <div key={category} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                            aria-expanded={expandedCategories.includes(category)}
                          >
                            <span>{category}</span>
                            <ChevronDown 
                              className={cn(
                                "w-4 h-4 transition-transform duration-200 text-gray-400",
                                expandedCategories.includes(category) ? "rotate-180" : ""
                              )}
                              aria-hidden="true"
                            />
                          </button>
                          {expandedCategories.includes(category) && (
                            <div className="pb-2">
                              {metrics.map((metric) => {
                                const isAlreadySelected = allMetrics.includes(metric)
                                const canAdd = additionalMetrics.length < 2
                                
                                return (
                                  <button
                                    key={metric}
                                    onClick={() => canAdd && !isAlreadySelected && handleAddMetric(metric)}
                                    disabled={isAlreadySelected || !canAdd}
                                    className={cn(
                                      "w-full text-left px-6 py-2 text-sm transition-all duration-150",
                                      isAlreadySelected 
                                        ? "text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800" 
                                        : canAdd
                                        ? "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                                        : "text-gray-400 cursor-not-allowed"
                                    )}
                                    aria-label={`Add ${metric}${isAlreadySelected ? ' (already selected)' : !canAdd ? ' (maximum metrics reached)' : ''}`}
                                  >
                                    {metric} {isAlreadySelected && "✓"}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* No Results */}
                      {Object.keys(filteredCategories).length === 0 && debouncedSearchQuery && (
                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                          <div className="text-gray-400 mb-2">No metrics found</div>
                          <div className="text-xs">Try a different search term</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Timeframe Dropdown */}
            <div className="relative" ref={timeframeDropdownRef}>
              <button
                onClick={() => toggleDropdown('timeframe')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[80px] justify-between"
                aria-label="Select timeframe"
                aria-expanded={dropdownStates.timeframe}
                aria-haspopup="true"
              >
                <span>{timeframe}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", dropdownStates.timeframe && "rotate-180")} />
              </button>
              
              {dropdownStates.timeframe && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[120px] overflow-hidden z-50">
                  {(['Day', 'Week', 'Month'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        setTimeframe(tf)
                        setDropdownStates(prev => ({ ...prev, timeframe: false }))
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                      role="option"
                      aria-selected={timeframe === tf}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>


        {/* Chart */}
        <div className={`relative w-full ${height}`} ref={chartContainerRef}>
          {chartData.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800/20 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No data available</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Import CSV data to see {primaryMetric.toLowerCase()}</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >              
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisLabel}
                stroke="#6B7280"
                fontSize={11}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                domain={yAxisDomains.left}
                stroke="#6B7280" 
                fontSize={11} 
                tickFormatter={formatLeftAxisTick}
                axisLine={false}
                tickLine={false}
                tick={<CustomYAxisTick side="left" color={getChartColor(primaryMetric, 0)} />}
              />
              
              {additionalMetrics.length > 0 && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={yAxisDomains.right}
                  stroke="#6B7280" 
                  fontSize={11} 
                  tickFormatter={formatRightAxisTick}
                  axisLine={false}
                  tickLine={false}
                  tick={<CustomYAxisTick side="right" metrics={additionalMetrics} allMetrics={allMetrics} getChartColor={getChartColor} />}
                />
              )}
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Horizontal grid lines (single source to avoid stacking dashes when multiple axes) */}
              {gridLineValues.left.map((value, index) => (
                <ReferenceLine
                  key={`left-grid-${index}`}
                  y={value}
                  yAxisId="left"
                  stroke="#d1d5db"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.7}
                  style={{ shapeRendering: 'crispEdges' }}
                />
              ))}
              
              {/* Render bars first (behind) */}
              {allMetrics.map((metric, index) => {
                const chartType = getChartType(metric)
                const color = getChartColor(metric, index)
                const yAxisId = index === 0 ? "left" : "right"
                
                if (chartType === 'Column') {
                  return (
                    <Bar
                      key={`bar-${metric}`}
                      dataKey={metric}
                      yAxisId={yAxisId}
                      fill={color}
                      radius={[6, 6, 0, 0]}
                      fillOpacity={0.7}
                    />
                  )
                }
                return null
              })}
              
              {/* Render areas second (middle) */}
              {allMetrics.map((metric, index) => {
                const chartType = getChartType(metric)
                const color = getChartColor(metric, index)
                const yAxisId = index === 0 ? "left" : "right"
                
                if (chartType === 'Area') {
                  return (
                    <Area
                      key={`area-${metric}`}
                      type="monotone"
                      dataKey={metric}
                      yAxisId={yAxisId}
                      stroke={color}
                      fill={`${color}40`}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: color, strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: color, strokeWidth: 2, stroke: 'white' }}
                    />
                  )
                }
                return null
              })}
              
              {/* Render lines last (on top) */}
              {allMetrics.map((metric, index) => {
                const chartType = getChartType(metric)
                const color = getChartColor(metric, index)
                const yAxisId = index === 0 ? "left" : "right"
                
                if (chartType === 'Line') {
                  return (
                    <Line
                      key={`line-${metric}`}
                      type="monotone"
                      dataKey={metric}
                      yAxisId={yAxisId}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: color, strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: color, strokeWidth: 2, stroke: 'white' }}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  )
                }
                return null
              })}
            </ComposedChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {allMetrics.map((metric, index) => (
            <div key={metric} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getChartColor(metric, index) }}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {getDisplayMetricName(metric)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}