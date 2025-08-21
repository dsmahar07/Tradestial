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
    if (value === 0) return '0'
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toFixed(0)
  }, [])

  // Format date labels for X-axis
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: 'short'
    })
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
      'Long # of open trades',
      'Long # of trades',
      'Long # of winning trades',
      'Net account balance',
      'Open trades',
      'Short # of breakeven trades',
      'Short # of losing trades',
      'Short # of open trades',
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

  // Improved data generation with better patterns
  const generateMockDataForMetric = useCallback((metric: string) => {
    if (metric === data.title) return data.data
    
    // If custom data request function is provided, use it
    if (onDataRequest) {
      const result = onDataRequest(metric)
      if (result && typeof result === 'object' && 'data' in result) {
        return result.data
      }
      // If it's a promise, we'll handle it later with proper async state management
    }
    
    const hash = metric.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    let seed = Math.abs(hash)
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    
    // Enhanced pattern recognition and value generation for all metrics
    const getPatternConfig = (metricName: string) => {
      const lowerMetric = metricName.toLowerCase()
      
      // Profitability patterns
      if (lowerMetric.includes('profit') || (lowerMetric.includes('win') && !lowerMetric.includes('%'))) {
        return { base: 800, amplitude: 400, trend: 0.1, min: 0 }
      }
      if (lowerMetric.includes('loss') || lowerMetric.includes('drawdown')) {
        return { base: -400, amplitude: 200, trend: -0.05, min: -2000 }
      }
      if (lowerMetric.includes('p&l') || lowerMetric.includes('pnl')) {
        return { base: 200, amplitude: 600, trend: 0.05, min: -1000 }
      }
      if (lowerMetric.includes('expectancy')) {
        return { base: 15, amplitude: 25, trend: 0.02, min: -50 }
      }
      
      // Volume and activity patterns
      if (lowerMetric.includes('volume')) {
        return { base: 2.5, amplitude: 1.0, trend: 0.02, min: 0.1 }
      }
      if (lowerMetric.includes('trade count') || lowerMetric.includes('# of')) {
        return { base: 15, amplitude: 8, trend: 0.01, min: 0 }
      }
      if (lowerMetric.includes('logged days') || lowerMetric.includes('breakeven days')) {
        return { base: 20, amplitude: 5, trend: 0.01, min: 0 }
      }
      if (lowerMetric.includes('account balance')) {
        return { base: 50000, amplitude: 15000, trend: 0.05, min: 10000 }
      }
      
      // Time patterns
      if (lowerMetric.includes('time') || lowerMetric.includes('duration')) {
        return { base: 45, amplitude: 20, trend: 0.01, min: 5 }
      }
      
      // Percentage patterns
      if (lowerMetric.includes('win%') || lowerMetric.includes('rate') || lowerMetric.includes('%')) {
        return { base: 55, amplitude: 25, trend: 0.05, min: 0, max: 100 }
      }
      
      // Risk patterns
      if (lowerMetric.includes('r-multiple') || lowerMetric.includes('factor')) {
        return { base: 1.5, amplitude: 0.5, trend: 0.03, min: 0.1 }
      }
      
      // Consecutive/streak patterns
      if (lowerMetric.includes('consecutive') || lowerMetric.includes('max')) {
        return { base: 5, amplitude: 3, trend: 0.01, min: 0 }
      }
      
      // Default pattern
      return { base: 500, amplitude: 300, trend: 0.02, min: 0 }
    }
    
    const config = getPatternConfig(metric)
    const cyclePeriod = 1 + seededRandom() * 1.5
    
    return data.data.map((point, index) => {
      const t = index / data.data.length
      const cyclical = Math.sin(t * Math.PI * 2 * cyclePeriod) * config.amplitude
      const trendEffect = t * config.trend * config.base
      const noise = (seededRandom() - 0.5) * config.amplitude * 0.3
      
      let value = config.base + cyclical + trendEffect + noise
      
      if (config.min !== undefined) value = Math.max(config.min, value)
      if (config.max !== undefined) value = Math.min(config.max, value)
      
      return {
        ...point,
        value: Number(value.toFixed(2))
      }
    })
  }, [data, onDataRequest])

  // Get data for metrics with improved caching
  const getMetricData = useCallback((metric: string) => {
    if (metric === data.title) return data.data
    
    if (!cachedData[metric]) {
      const newData = generateMockDataForMetric(metric)
      setCachedData(prev => ({ ...prev, [metric]: newData }))
      return newData
    }
    
    return cachedData[metric]
  }, [data, cachedData, generateMockDataForMetric])

  // Prepare chart data with proper scaling
  const chartData: ChartDataWithMetrics[] = useMemo(() => {
    const primaryData = getMetricData(primaryMetric)
    return primaryData.map((point, index) => {
      const chartPoint: ChartDataWithMetrics = {
        date: point.date,
        value: point.value,
        index,
        [primaryMetric]: point.value
      }
      
      additionalMetrics.forEach((metric) => {
        const metricData = getMetricData(metric)
        if (metricData[index]) {
          chartPoint[metric] = metricData[index].value
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

  // Custom tooltip component with contextual information
  const CustomTooltip = useCallback(({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length && label) {
      // Find the data point index for contextual labeling
      const dataIndex = chartData.findIndex(d => d.date === label)
      const periodLabel = getContextualPeriodLabel(label, dataIndex)
      
      return (
        <div 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 text-sm"
          role="tooltip"
          aria-label={`Chart data for ${periodLabel}`}
        >
          <div className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-xs">
            {periodLabel}
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between mb-1 last:mb-0">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                  {getDisplayMetricName(entry.dataKey)}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }, [getContextualPeriodLabel, getDisplayMetricName, formatValue, chartData])

  // Calculate dynamic Y-axis domains for left and right axes
  const yAxisDomains = useMemo(() => {
    if (allMetrics.length === 0) return { left: [0, 100], right: [0, 100] }
    
    // Primary metric (first) goes on left axis
    const primaryValues = chartData.map(point => point[primaryMetric] as number).filter(val => typeof val === 'number')
    
    // Additional metrics go on right axis
    const additionalValues = chartData.flatMap(point => 
      additionalMetrics.map(metric => point[metric] as number).filter(val => typeof val === 'number')
    )
    
    const calculateDomain = (values: number[]) => {
      if (values.length === 0) return [0, 100]
      const min = Math.min(...values)
      const max = Math.max(...values)
      const padding = (max - min) * 0.1 || 10 // Fallback padding for flat lines
      return [min - padding, max + padding]
    }
    
    return {
      left: calculateDomain(primaryValues),
      right: additionalMetrics.length > 0 ? calculateDomain(additionalValues) : [0, 100]
    }
  }, [chartData, allMetrics, primaryMetric, additionalMetrics])

  // Generate clean grid lines based on Y-axis domains - simplified approach
  const gridLineValues = useMemo(() => {
    const generateCleanTicks = (domain: [number, number], tickCount: number = 5) => {
      const [min, max] = domain
      const range = max - min
      const step = range / (tickCount - 1)
      
      const ticks = []
      for (let i = 0; i < tickCount; i++) {
        ticks.push(min + (step * i))
      }
      return ticks
    }

    return {
      left: generateCleanTicks(yAxisDomains.left),
      right: additionalMetrics.length > 0 ? generateCleanTicks(yAxisDomains.right) : []
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
    <Card className={cn("border-0 shadow-none bg-white dark:bg-[#171717]", className)}>
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
                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-[280px] max-h-[400px] overflow-y-auto z-50">
                  <div className="p-4 space-y-4">
                    {allMetrics.map((metric, index) => (
                      <div key={metric} className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {getDisplayMetricName(metric)}
                        </div>
                        
                        {/* Color Picker */}
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0" 
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
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#171717] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Area">Area</option>
                            <option value="Line">Line</option>
                            <option value="Column">Column</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    {/* Reset Button */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
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
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[120px] max-w-[180px] lg:max-w-[220px] justify-between"
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
                  <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-[280px] sm:w-[320px] max-h-[450px] overflow-hidden z-50">
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
                  <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-[280px] sm:w-[320px] max-h-[450px] overflow-hidden z-50">
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
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[80px] justify-between"
                aria-label="Select timeframe"
                aria-expanded={dropdownStates.timeframe}
                aria-haspopup="true"
              >
                <span>{timeframe}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", dropdownStates.timeframe && "rotate-180")} />
              </button>
              
              {dropdownStates.timeframe && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[120px] overflow-hidden z-50">
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
                tickFormatter={formatValue}
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
                  tickFormatter={formatValue}
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