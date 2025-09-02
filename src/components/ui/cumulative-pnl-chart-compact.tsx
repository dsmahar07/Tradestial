'use client'

import React, { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, CartesianGrid } from 'recharts'
import { useChartData } from '@/hooks/use-analytics'
import { DateTime } from 'luxon'

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
  
  // Handle small numbers
  if (absValue < 0.01) {
    return '$0.00'
  }
  
  // Regular formatting for numbers between $0.01 and $999.99
  return `$${value.toFixed(2)}`
}

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
        {label && (
          <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {label}
          </div>
        )}
      </div>
    )
  }
  return null
}

type TimeFilter = 'all' | 'month' | 'week'

interface CumulativePnlChartCompactProps {
  chartData?: Array<{ time: string; value: number }>
}

export const CumulativePnlChartCompact = React.memo(function CumulativePnlChartCompact({ chartData: propChartData }: CumulativePnlChartCompactProps) {
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
    
    return rawData.filter(item => {
      const itemDate = DateTime.fromISO(item.date)
      return itemDate.isValid && itemDate >= cutoff
    })
  }, [rawData, timeFilter])

  // Process data for chart with cumulative calculation and gradient support
  const chartData = useMemo(() => {
    // Use prop data if provided, otherwise use hook data
    const dataToUse = propChartData || filteredData
    if (!dataToUse || dataToUse.length === 0) return []
    
    // If prop data is provided, use it directly (already processed)
    if (propChartData) {
      return propChartData.map((item, index) => ({
        time: item.time,
        value: item.value,
        positiveValue: item.value > 0 ? item.value : null,
        negativeValue: item.value < 0 ? item.value : null,
        index
      }))
    }
    
    // Sort by date to ensure proper cumulative calculation
    const sorted = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    let cumulativeValue = 0
    let runningIndex = 0
    const mapped: any[] = []
    let prevValue = 0

    for (const item of sorted) {
      cumulativeValue += item.pnl || 0
      const value = cumulativeValue
      
      // Format time label
      const date = DateTime.fromISO(item.date)
      const label = date.isValid ? date.toFormat('MMM dd') : item.date.slice(0, 10)
      
      // Insert zero-crossing points to prevent gradient bleed
      if (Math.abs(prevValue) > 0.01 && Math.abs(value) > 0.01 && 
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
        return out
      }
    }
    
    return mapped
  }, [filteredData, propChartData])

  // Calculate Y-axis ticks
  const yTicks = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0]
    
    const values = chartData.map(d => d.value).filter(v => v !== null && v !== undefined)
    if (values.length === 0) return [0]
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    if (min === max) {
      return min === 0 ? [0] : [0, min]
    }
    
    const range = max - min
    const step = range / 4
    
    return [
      min,
      min + step,
      min + 2 * step,
      min + 3 * step,
      max
    ].map(v => Math.round(v * 100) / 100)
  }, [chartData])

  // Calculate X-axis ticks
  const xTicks = useMemo(() => {
    if (!chartData || chartData.length === 0) return []
    
    const dataLength = chartData.length
    if (dataLength <= 6) {
      return chartData.map(d => d.index)
    }
    
    const step = Math.ceil(dataLength / 6)
    const ticks = []
    for (let i = 0; i < dataLength; i += step) {
      ticks.push(chartData[i].index)
    }
    
    // Always include the last point
    const lastIndex = chartData[dataLength - 1].index
    if (!ticks.includes(lastIndex)) {
      ticks.push(lastIndex)
    }
    
    return ticks
  }, [chartData])

  const shouldAnimate = !loading && chartData.length > 0

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-center text-sm">
          <div>No data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 5, left: -10, bottom: 20 }}
        >
          <defs>
            {/* Green gradient for positive areas */}
            <linearGradient id="positiveGradientCompact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
            </linearGradient>
            {/* Red gradient for negative areas */}
            <linearGradient id="negativeGradientCompact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05}/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4}/>
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
              fontSize: 10, 
              fill: '#9ca3af',
              fontWeight: 600
            }}
            className="dark:fill-gray-400"
            height={20}
            tickMargin={5}
            tickFormatter={(value) => {
              const v = typeof value === 'number' ? value : Number(value)
              const d = chartData.find(pt => pt.index === v)
              const label = d?.time || ''
              return label
            }}
            interval="preserveStartEnd"
            tickCount={4}
            minTickGap={20}
            ticks={xTicks}
          />
          
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ 
              fontSize: 10, 
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
          
          {/* Draw horizontal grid lines explicitly for each labeled Y tick */}
          {yTicks.map((t) => (
            <ReferenceLine
              key={`grid-${t}`}
              y={t}
              stroke="#e5e7eb"
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
            fill="url(#positiveGradientCompact)"
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
            fill="url(#negativeGradientCompact)"
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
              r: 4,
              fill: "#5B2CC9",
              stroke: "#fff",
              strokeWidth: 2,
              filter: "drop-shadow(0 2px 4px rgba(91, 44, 201, 0.3))"
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
