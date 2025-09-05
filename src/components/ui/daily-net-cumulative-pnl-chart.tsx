  'use client'

import React, { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, CartesianGrid } from 'recharts'
import { useChartData } from '@/hooks/use-analytics'
import { DateTime } from 'luxon'
import { Info } from 'lucide-react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

// chartData will be generated dynamically in the component

// Smart currency formatter with robust handling
const formatCurrency = (value: number): string => {
  // Handle edge cases
  if (!isFinite(value) || isNaN(value)) return '$0'
  
  const absValue = Math.abs(value)
  
  // Handle very large numbers
  if (absValue >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)}T`
  }
  if (absValue >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (absValue >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`
  }
  
  // Handle small numbers with appropriate decimal places
  if (absValue < 1 && absValue > 0) {
    return `$${value.toFixed(2)}`
  }
  
  return `$${Math.round(value).toLocaleString()}`
}

// Simple Tooltip showing only P&L amount
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value || payload[0].payload?.value
    
    if (value === undefined || value === null) {
      return (
        <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
          <div className="font-semibold text-gray-500">
            No data
          </div>
        </div>
      )
    }
    
    const formattedValue = formatCurrency(value)
    
    return (
      <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className={`font-semibold ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formattedValue}
        </div>
      </div>
    )
  }
  return null
}

type TimeFilter = 'all' | 'month' | 'week'

export const DailyNetCumulativePnlChart = React.memo(function DailyNetCumulativePnlChart() {
  const timeFilter: TimeFilter = 'all'
  
  // Pull reactive, filtered, cached chart data from analytics service
  const { data: rawData, loading } = useChartData('cumulativePnL')

  // Filter data based on time selection
  const filteredData = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    
    if (timeFilter === 'all') return rawData
    
    const now = DateTime.now()
    const cutoff = timeFilter === 'week' 
      ? now.minus({ weeks: 1 })
      : now.minus({ months: 1 })
    
    return rawData.filter((d: { date: string }) => {
      const dt = DateTime.fromISO(d.date)
      return dt.isValid && dt >= cutoff
    })
  }, [rawData, timeFilter])

  // Map reactive data shape to chart's expected shape with robust error handling
  const chartData = useMemo(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DailyNetCumulativePnlChart] filteredData points:', Array.isArray(filteredData) ? filteredData.length : 0)
    }
    
    // Handle empty or invalid data
    if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0) return []
    
    // Validate and sanitize data
    const validData = filteredData.filter(d => {
      return d && 
             typeof d === 'object' && 
             d.date && 
             typeof d.cumulative === 'number' && 
             !isNaN(d.cumulative) && 
             isFinite(d.cumulative)
    })
    
    if (validData.length === 0) return []
    
    // Ensure chronological order with fallback for invalid dates
    const sorted = [...validData].sort((a: { date: string }, b: { date: string }) => {
      const ta = DateTime.fromISO(a.date)
      const tb = DateTime.fromISO(b.date)
      
      // Handle invalid dates by putting them at the end
      if (!ta.isValid && !tb.isValid) return 0
      if (!ta.isValid) return 1
      if (!tb.isValid) return -1
      
      return ta.toMillis() - tb.toMillis()
    })

    // Map to display-friendly labels with robust value handling
    const mapped: Array<{ time: string; value: number; positiveValue: number | null; negativeValue: number | null; index: number }> = []
    let runningIndex = 0
    let prevValue: number | null = null
    
    for (const d of sorted) {
      const dt = DateTime.fromISO(d.date)
      let label: string
      
      if (!dt.isValid) {
        // Fallback for invalid dates
        label = typeof d.date === 'string' ? d.date.slice(0, 10) : 'Invalid'
      } else {
        // Dynamic date formatting based on data range
        const daysDiff = sorted.length > 1 ? 
          Math.abs(DateTime.fromISO(sorted[sorted.length - 1].date).diff(DateTime.fromISO(sorted[0].date), 'days').days) : 0
        
        if (daysDiff > 365) {
          label = dt.toFormat('MM/yy')
        } else if (daysDiff > 30) {
          label = dt.toFormat('MM/dd')
        } else {
          label = dt.toFormat('MM/dd')
        }
      }
      
      // Robust value handling with bounds checking
      let value = d.cumulative || 0
      
      // Handle extreme values
      const MAX_SAFE_VALUE = 1e12 // 1 trillion
      if (Math.abs(value) > MAX_SAFE_VALUE) {
        value = Math.sign(value) * MAX_SAFE_VALUE
      }
      
      value = Math.round(value * 100) / 100 // Round to 2 decimal places

      // Insert a zero-crossing point to avoid gradient bleed and visual breaks
      if (prevValue !== null && 
          Math.abs(prevValue) > 0.01 && 
          Math.abs(value) > 0.01 && 
          ((prevValue > 0 && value < 0) || (prevValue < 0 && value > 0))) {
        mapped.push({
          time: label,
          value: 0,
          positiveValue: 0,
          negativeValue: 0,
          index: runningIndex++
        })
      }

      mapped.push({
        time: label,
        value,
        positiveValue: value > 0 ? value : null,
        negativeValue: value < 0 ? value : null,
        index: runningIndex++
      })
      prevValue = value
    }

    // Handle single data point case
    if (mapped.length === 1) {
      // Add a baseline point for single data point
      const singlePoint = mapped[0]
      return [
        { time: '', value: 0, positiveValue: 0, negativeValue: 0, index: -1 },
        singlePoint
      ]
    }

    // Prepend a synthetic baseline point at $0 for multi-point data
    if (sorted.length > 0) {
      const firstDate = DateTime.fromISO(sorted[0].date)
      if (firstDate.isValid) {
        const out = [{ time: '', value: 0, positiveValue: 0, negativeValue: 0, index: -1 }, ...mapped]
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[DailyNetCumulativePnlChart] mapped points (with baseline):', out.length)
        }
        return out
      }
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DailyNetCumulativePnlChart] mapped points:', mapped.length)
    }
    return mapped
  }, [filteredData])
  
  // Determine if we should disable animations for performance with dynamic thresholds
  const shouldAnimate = useMemo(() => {
    if (!chartData || chartData.length === 0) return true
    
    // Disable animations for large datasets or low-end devices
    const isLargeDataset = chartData.length > 500
    const isLowEndDevice = typeof navigator !== 'undefined' && 
      (navigator.hardwareConcurrency <= 2 || (navigator as any).deviceMemory <= 4)
    
    return !isLargeDataset && !isLowEndDevice
  }, [chartData])

  // Precompute X-axis ticks outside JSX to avoid calling Hooks in props
  const xTicks = useMemo(() => {
    return chartData.filter(d => d.time).map(d => d.index)
  }, [chartData])

  // Compute dynamic Y-axis ticks across data values (matches Account Balance widget)
  const yTicks = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0]
    const values: number[] = []
    for (const d of chartData) {
      if (typeof d.value === 'number' && isFinite(d.value)) values.push(d.value)
    }
    if (values.length === 0) return [0]

    const min = Math.min(...values)
    const max = Math.max(...values)

    // Guard single-value or flat series
    if (min === max) {
      const pad = Math.max(1, Math.abs(min) * 0.1)
      return [min - 2 * pad, min - pad, min, min + pad, min + 2 * pad]
    }

    // Nice step calculation for ~6 segments
    const range = max - min
    const rawStep = range / 6
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, Math.abs(rawStep)))))
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude

    // Expand to nice bounds
    const niceMin = Math.floor(min / niceStep) * niceStep
    const niceMax = Math.ceil(max / niceStep) * niceStep

    const ticks: number[] = []
    for (let v = niceMin; v <= niceMax + 1e-9; v += niceStep) {
      // Round to avoid floating point precision issues that can cause fractional pixel positioning
      const roundedTick = Math.round(Number(v.toFixed(10)))
      // Avoid duplicate ticks that would cause overlapping grid lines
      if (!ticks.includes(roundedTick)) {
        ticks.push(roundedTick)
      }
    }
    return ticks
  }, [chartData])

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 h-[432px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-center">
          <div>Loading cumulative P&L…</div>
        </div>
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 h-[432px] text-gray-900 dark:text-white">
        {/* Header (title visible, dropdown hidden) */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Net Cumulative P&L</h3>
            <RadixTooltip.Root>
              <RadixTooltip.Trigger asChild>
                <button className="inline-flex items-center justify-center">
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                </button>
              </RadixTooltip.Trigger>
              <RadixTooltip.Portal>
                <RadixTooltip.Content
                  className="z-[9999] max-w-xs select-none rounded-md bg-white dark:bg-[#0f0f0f] px-3 py-2 text-sm text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700"
                  sideOffset={5}
                >
                  Displays how your total account P&L accumulated over the course of each trading day.
                  <RadixTooltip.Arrow className="fill-white dark:fill-[#0f0f0f]" />
                </RadixTooltip.Content>
              </RadixTooltip.Portal>
            </RadixTooltip.Root>
          </div>
        </div>
        
        {/* Header Divider */}
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
        
        {/* Empty state */}
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 text-center">
            <div>No trade data available</div>
            <div className="text-sm mt-1">Import your CSV to see cumulative P&L</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RadixTooltip.Provider delayDuration={400}>
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '432px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Net Cumulative P&L</h3>
            <RadixTooltip.Root>
              <RadixTooltip.Trigger asChild>
                <button className="inline-flex items-center justify-center">
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                </button>
              </RadixTooltip.Trigger>
              <RadixTooltip.Portal>
                <RadixTooltip.Content
                  className="z-[9999] max-w-xs select-none rounded-md bg-white dark:bg-[#0f0f0f] px-3 py-2 text-sm text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700"
                  sideOffset={5}
                >
                  Displays how your total account P&L accumulated over the course of each trading day.
                  <RadixTooltip.Arrow className="fill-white dark:fill-[#0f0f0f]" />
                </RadixTooltip.Content>
              </RadixTooltip.Portal>
            </RadixTooltip.Root>
          </div>
        </div>
      
      {/* Header Divider */}
      <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>

      {/* Chart */}
      <div 
        className="h-[405px] -ml-6 overflow-visible w-full" 
        style={{ width: 'calc(100% + 24px)' }}
        role="img"
        aria-label={`Cumulative P&L chart showing ${chartData.length} data points over ${timeFilter === 'all' ? 'all time' : timeFilter === 'month' ? 'the last month' : 'the last week'}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 5, left: -10, bottom: 60 }}
          >
            <defs>
              {/* Green gradient for positive areas */}
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06d6a0" stopOpacity={0.6}/>
                <stop offset="100%" stopColor="#06d6a0" stopOpacity={0.15}/>
              </linearGradient>
              {/* Red gradient for negative areas */}
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4757" stopOpacity={0.15}/>
                <stop offset="100%" stopColor="#FF4757" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            
            {/* Disable default grid entirely */}
            <CartesianGrid stroke="none" vertical={false} horizontal={false} />
            
            <XAxis 
              dataKey="index" 
              type="number"
              domain={["dataMin", "dataMax"]}
              allowDecimals={false}
              scale="linear"
              stroke="#9ca3af"
              axisLine={false}
              tickLine={false}
              padding={{ left: 0, right: 0 }}
              tick={{ 
                fontSize: 12, 
                fill: '#9ca3af',
                fontWeight: 600
              }}
              className="dark:fill-gray-400"
              height={25}
              tickMargin={5}
              tickFormatter={(value) => {
                const v = typeof value === 'number' ? value : Number(value)
                const d = chartData.find(pt => pt.index === v)
                const label = d?.time || ''
                return label
              }}
              interval="preserveStartEnd"
              tickCount={6}
              minTickGap={20}
              ticks={xTicks}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: '#9ca3af'
              }}
              className="dark:fill-gray-400"
              tickFormatter={(value) => {
                if (value === 0) return '$0';
                return formatCurrency(value);
              }}
              domain={[Math.min(...yTicks), Math.max(...yTicks)]}
              ticks={yTicks}
              scale="linear"
              allowDecimals={false}
            />
            
            {/* Draw horizontal grid lines explicitly for each labeled Y tick (including $0) */}
            {yTicks.map((t) => (
              <ReferenceLine
                key={`grid-${t}`}
                y={t}
                stroke="var(--grid)"
                strokeDasharray="3 3"
                strokeWidth={1}
                ifOverflow="visible"
              />
            ))}
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
            />
            
            {/* Positive area - clip to line using split series */}
            <Area
              type="linear"
              dataKey="positiveValue"
              stroke="none"
              fill="url(#positiveGradient)"
              fillOpacity={1}
              connectNulls={false}
              isAnimationActive={shouldAnimate}
              animationDuration={shouldAnimate ? 800 : 0}
              animationEasing="ease-in-out"
              baseValue={0}
            />
            
            {/* Negative area - clip to line using split series */}
            <Area
              type="linear"
              dataKey="negativeValue"
              stroke="none"
              fill="url(#negativeGradient)"
              fillOpacity={1}
              connectNulls={false}
              isAnimationActive={shouldAnimate}
              animationDuration={shouldAnimate ? 800 : 0}
              animationEasing="ease-in-out"
              baseValue={0}
            />
            
            {/* Main line stroke - enhanced styling */}
            <Area
              type="linear"
              dataKey="value"
              stroke="#5B2CC9"
              strokeWidth={1.5}
              fill="none"
              connectNulls={true}
              isAnimationActive={shouldAnimate}
              animationDuration={shouldAnimate ? 1200 : 0}
              animationEasing="ease-out"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#5B2CC9",
                stroke: "#fff",
                strokeWidth: 3,
                filter: "drop-shadow(0 2px 4px rgba(91, 44, 201, 0.3))"
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      </div>
    </RadixTooltip.Provider>
  )
})