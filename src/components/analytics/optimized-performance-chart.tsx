'use client'

import React, { useState, useCallback, memo, useEffect, useRef } from 'react'
import { MoreHorizontal, ChevronDown } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { ChartErrorBoundary } from '@/components/ui/chart-error-boundary'
import { ChartMetricSelector } from '@/components/analytics/chart-metric-selector'
import { ChartCustomizationPanel } from '@/components/analytics/chart-customization-panel'
import { useChartData } from '@/hooks/use-chart-data'
import { useChartAxis } from '@/hooks/use-chart-axis'
import { cn } from '@/lib/utils'
import { 
  PerformanceChart as ChartData, 
  CustomTooltipProps, 
  ChartType,
  MetricCategory 
} from '@/types/performance'

interface OptimizedPerformanceChartProps {
  data: ChartData
  className?: string
  availableMetrics?: MetricCategory
  colorPalette?: string[]
  height?: string
  onDataRequest?: (metric: string) => ChartData | Promise<ChartData>
  contextInfo?: {
    subTab?: string
    periodLabels?: string[]
    getPeriodLabel?: (date: string, index: number) => string
    modelName?: string
  }
}

const OptimizedPerformanceChartComponent = ({
  data,
  className,
  availableMetrics,
  colorPalette,
  height = "h-[400px]",
  onDataRequest,
  contextInfo
}: OptimizedPerformanceChartProps) => {
  // State management
  const [timeframe, setTimeframe] = useState<'Day' | 'Week' | 'Month'>(data.timeframe || 'Day')
  const [primaryMetric, setPrimaryMetric] = useState<string>(data.title)
  const [additionalMetrics, setAdditionalMetrics] = useState<string[]>([])
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({})
  const [chartColors, setChartColors] = useState<Record<string, string>>({})
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false)
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false)
  
  // Refs for click-outside handling
  const addMetricRef = useRef<HTMLDivElement>(null)
  const timeframeRef = useRef<HTMLDivElement>(null)

  // Custom hooks for data and axis management
  const { chartData, isLoading, error, refetchMetric } = useChartData({
    data,
    primaryMetric,
    additionalMetrics,
    onDataRequest
  })

  // Utility functions
  const isRMultipleMetric = useCallback((name: string): boolean => {
    const normalized = name.toLowerCase().trim()
    return normalized.includes('r-multiple') || 
           normalized.includes('r multiple') || 
           normalized === 'rmultiple' ||
           normalized.startsWith('avg. planned r-multiple') ||
           normalized.startsWith('avg. realized r-multiple')
  }, [])

  const { axisAssignment, yAxisDomains, gridLineValues } = useChartAxis({
    chartData,
    primaryMetric,
    additionalMetrics,
    isRMultipleMetric
  })

  // Format functions
  const formatValue = useCallback((value: number): string => {
    if (!isFinite(value) || isNaN(value)) return '0'
    if (value === 0) return '0'
    const abs = Math.abs(value)
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    if (abs < 10) return value.toFixed(2)
    if (abs < 1) return value.toFixed(3)
    return value.toFixed(0)
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [yyyy, mm, dd] = dateString.split('-')
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthIdx = Math.max(0, Math.min(11, parseInt(mm, 10) - 1))
      return `${months[monthIdx]} ${dd}`
    }
    const d = new Date(dateString)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    }
    return dateString
  }, [])

  const getDisplayMetricName = useCallback((metric: string): string => {
    if (metric.length <= 25) return metric
    if (metric.includes(' - cumulative')) {
      const baseName = metric.replace(' - cumulative', '')
      if (baseName.length <= 20) return baseName + '...'
      return baseName.substring(0, 20) + '...'
    }
    return metric.substring(0, 25) + '...'
  }, [])

  // Axis formatters
  const leftAxisIsR = isRMultipleMetric(primaryMetric)
  const rightAxisIsR = additionalMetrics.some(m => isRMultipleMetric(m))

  const formatLeftAxisTick = useCallback((v: number) => {
    const base = formatValue(v)
    return leftAxisIsR ? `${base}R` : base
  }, [formatValue, leftAxisIsR])

  const formatRightAxisTick = useCallback((v: number) => {
    const base = formatValue(v)
    return rightAxisIsR ? `${base}R` : base
  }, [formatValue, rightAxisIsR])

  const formatXAxisLabel = useCallback((dateString: string): string => {
    if (contextInfo?.getPeriodLabel) {
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

  // Chart customization
  const defaultColors = ['#335CFF', '#FA7319', '#FB3748', '#1DAF61', '#F6B51E', '#693EE0', '#47C2FF', '#E9358F']
  const availableColors = colorPalette || defaultColors

  const getMetricColor = useCallback((index: number): string => {
    return availableColors[index] || '#6B7280'
  }, [availableColors])

  const getChartType = useCallback((metric: string): ChartType => 
    chartTypes[metric] || 'Line', [chartTypes])
  
  const getChartColor = useCallback((metric: string, index: number): string => 
    chartColors[metric] || getMetricColor(index), [chartColors, getMetricColor])

  // Event handlers
  const allMetrics = [primaryMetric, ...additionalMetrics]
  
  const handleMetricChange = useCallback((newMetric: string, index: number) => {
    if (index === 0) {
      setPrimaryMetric(newMetric)
    } else {
      setAdditionalMetrics(prev => {
        const newMetrics = [...prev]
        newMetrics[index - 1] = newMetric
        return newMetrics
      })
    }
  }, [])

  const handleAddMetric = useCallback((metric: string) => {
    if (additionalMetrics.length < 2 && 
        !additionalMetrics.includes(metric) && 
        metric !== primaryMetric) {
      setAdditionalMetrics(prev => [...prev, metric])
    }
  }, [additionalMetrics, primaryMetric])

  const handleRemoveMetric = useCallback((index: number) => {
    setAdditionalMetrics(prev => prev.filter((_, i) => i !== index - 1))
  }, [])

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMetricRef.current && !addMetricRef.current.contains(event.target as Node)) {
        setIsAddMetricOpen(false)
      }
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setIsTimeframeOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Default metrics categories
  const defaultMetricsCategories: MetricCategory = {
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
  }

  const metricsCategories = availableMetrics || defaultMetricsCategories

  // Custom tooltip
  const CustomTooltip = useCallback(({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length && label) {
      const dataIndex = chartData.findIndex(d => d.date === label)
      const periodLabel = contextInfo?.getPeriodLabel && dataIndex >= 0
        ? contextInfo.getPeriodLabel(String(label), dataIndex)
        : contextInfo?.periodLabels?.[dataIndex] || formatDate(String(label))
      
      const validPayload = payload.filter(entry => 
        entry.value != null && 
        isFinite(Number(entry.value)) && 
        !isNaN(Number(entry.value))
      )
      
      if (validPayload.length === 0) return null
      
      return (
        <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-xs">
            {periodLabel}
          </div>
          {contextInfo?.modelName && (
            <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-2">
              Model: <span className="font-medium text-gray-800 dark:text-gray-200">{contextInfo.modelName}</span>
            </div>
          )}
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
  }, [chartData, contextInfo, formatDate, formatValue, isRMultipleMetric, getDisplayMetricName])

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50 dark:bg-red-950/20", className)}>
        <CardContent className="p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            <p className="font-medium mb-2">Failed to load chart data</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <ChartErrorBoundary>
      <Card className={cn("border-0 shadow-none bg-white dark:bg-[#0f0f0f]", className)}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Chart Customization Panel */}
              <ChartCustomizationPanel
                allMetrics={allMetrics}
                chartTypes={chartTypes}
                chartColors={chartColors}
                availableColors={availableColors}
                onChartTypeChange={(metric, type) => setChartTypes(prev => ({ ...prev, [metric]: type }))}
                onColorChange={(metric, color) => setChartColors(prev => ({ ...prev, [metric]: color }))}
                onResetToDefault={() => {
                  setChartTypes({})
                  setChartColors({})
                }}
                getChartType={getChartType}
                getChartColor={getChartColor}
                getDisplayMetricName={getDisplayMetricName}
              />
              
              {/* Metric Selectors */}
              {allMetrics.map((metric, index) => (
                <ChartMetricSelector
                  key={`${metric}-${index}`}
                  selectedMetric={metric}
                  allMetrics={allMetrics}
                  availableMetrics={metricsCategories}
                  onMetricSelect={(newMetric) => handleMetricChange(newMetric, index)}
                  onRemove={index > 0 ? () => handleRemoveMetric(index) : undefined}
                  color={getChartColor(metric, index)}
                  isRemovable={index > 0}
                  aria-label={`Metric ${index + 1}: ${metric}`}
                />
              ))}
              
              {/* Add Metric Button */}
              {additionalMetrics.length < 2 && (
                <div className="relative" ref={addMetricRef}>
                  <button 
                    onClick={() => setIsAddMetricOpen(!isAddMetricOpen)}
                    className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors focus:outline-none focus:underline"
                    aria-label="Add another metric to chart"
                    aria-expanded={isAddMetricOpen}
                  >
                    + Add metric {additionalMetrics.length > 0 && `(${allMetrics.length}/3)`}
                  </button>
                  
                  {isAddMetricOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[200px] max-w-[300px] overflow-hidden z-50">
                      <div className="max-h-[300px] overflow-y-auto">
                        {Object.entries(metricsCategories).map(([category, metrics]) => (
                          <div key={category} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                              {category}
                            </div>
                            {metrics.map((metric) => (
                              <button
                                key={metric}
                                onClick={() => {
                                  handleAddMetric(metric)
                                  setIsAddMetricOpen(false)
                                }}
                                disabled={allMetrics.includes(metric)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {metric}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Timeframe Dropdown */}
              <div className="relative" ref={timeframeRef}>
                <button
                  onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[80px] justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Select timeframe"
                  aria-expanded={isTimeframeOpen}
                >
                  <span>{timeframe}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isTimeframeOpen && "rotate-180")} />
                </button>
                
                {isTimeframeOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[120px] overflow-hidden z-50">
                    {(['Day', 'Week', 'Month'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setTimeframe(tf)
                          setIsTimeframeOpen(false)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-[400px] bg-gray-50 dark:bg-gray-800/20 rounded-lg">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading chart data...</p>
              </div>
            </div>
          )}

          {/* Chart */}
          {!isLoading && (
            <div className={`relative w-full ${height}`}>
              {chartData.length === 0 ? (
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
                    />
                    
                    {axisAssignment.rightAxisMetrics.length > 0 && (
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={yAxisDomains.right}
                        stroke="#6B7280" 
                        fontSize={11} 
                        tickFormatter={formatRightAxisTick}
                        axisLine={false}
                        tickLine={false}
                      />
                    )}
                    
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Grid lines */}
                    {gridLineValues.left.map((value, index) => (
                      <ReferenceLine
                        key={`left-grid-${index}`}
                        y={value}
                        yAxisId="left"
                        stroke="#d1d5db"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        opacity={0.7}
                      />
                    ))}
                    
                    {axisAssignment.rightAxisMetrics.length > 0 && gridLineValues.right.map((value, index) => (
                      <ReferenceLine
                        key={`right-grid-${index}`}
                        y={value}
                        yAxisId="right"
                        stroke="#e5e7eb"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        opacity={0.5}
                      />
                    ))}

                    {/* Chart elements */}
                    {allMetrics.map((metric, index) => {
                      const chartType = getChartType(metric)
                      const color = getChartColor(metric, index)
                      const yAxisId = axisAssignment.assignment[metric] || "left"
                      
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
                    })}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            {allMetrics.map((metric, index) => (
              <div key={metric} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getChartColor(metric, index) }}
                />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {getDisplayMetricName(metric)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ChartErrorBoundary>
  )
}

export const OptimizedPerformanceChart = memo(OptimizedPerformanceChartComponent)
