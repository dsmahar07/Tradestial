'use client'

import React, { useMemo } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts'

export interface HeaderStatsData {
  totalTrades: number
  winners: number
  losers: number
  winrate: string
  grossPnl: number
  volume: number
  commissions: number
  profitFactor: number
}

export interface TimePoint { time: string; value: number }

// Smart currency formatter with robust handling (matches cumulative chart)
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

// Custom Tooltip component for smooth rendering
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

interface JournalHeaderStatsProps {
  chartData: TimePoint[]
  stats: HeaderStatsData
  size?: 'normal' | 'large'
}

export default function JournalHeaderStats({ chartData, stats, size = 'normal' }: JournalHeaderStatsProps) {
  // Process chart data with index-based structure
  const processedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [{ time: '09:30', value: 0, positiveValue: 0, negativeValue: 0, index: 0 }]
    
    const processed: Array<{ time: string; value: number; positiveValue: number | null; negativeValue: number | null; index: number }> = []
    let runningIndex = 0
    let prevValue: number | null = null
    
    for (let i = 0; i < chartData.length; i++) {
      const curr = chartData[i]
      const value = curr.value || 0
      
      // Insert a zero-crossing point to avoid gradient bleed
      if (prevValue !== null && 
          Math.abs(prevValue) > 0.01 && 
          Math.abs(value) > 0.01 && 
          ((prevValue > 0 && value < 0) || (prevValue < 0 && value > 0))) {
        processed.push({
          time: curr.time,
          value: 0,
          positiveValue: 0,
          negativeValue: 0,
          index: runningIndex++
        })
      }

      processed.push({
        time: curr.time,
        value,
        positiveValue: value > 0 ? value : 0,  // Always include 0 for proper fill
        negativeValue: value < 0 ? value : 0,  // Always include 0 for proper fill
        index: runningIndex++
      })
      prevValue = value
    }

    // Add baseline point at start for smoother chart
    if (processed.length > 0) {
      return [
        { time: '', value: 0, positiveValue: 0, negativeValue: 0, index: -1 },
        ...processed
      ]
    }
    
    return processed
  }, [chartData])

  // Simplified Y-axis ticks for cleaner display
  const yTicks = useMemo(() => {
    if (!processedData || processedData.length === 0) return [0]
    const values: number[] = []
    for (const d of processedData) {
      if (typeof d.value === 'number' && isFinite(d.value)) values.push(d.value)
    }
    if (values.length === 0) return [0]

    const min = Math.min(...values)
    const max = Math.max(...values)

    // For flat or single-value series
    if (min === max) {
      if (min === 0) return [-100, 0, 100]
      const pad = Math.abs(min) * 0.5
      return [min - pad, min, min + pad]
    }

    // Simple 3-5 tick approach for cleaner display
    const range = max - min
    const step = range / 3
    
    // Round to nice numbers
    const magnitude = Math.pow(10, Math.floor(Math.log10(step)))
    const niceStep = Math.ceil(step / magnitude) * magnitude
    
    const ticks = []
    const start = Math.floor(min / niceStep) * niceStep
    const end = Math.ceil(max / niceStep) * niceStep
    
    for (let v = start; v <= end; v += niceStep) {
      ticks.push(Math.round(v))
    }
    
    // Ensure we always include 0 if it's in range
    if (min <= 0 && max >= 0 && !ticks.includes(0)) {
      ticks.push(0)
      ticks.sort((a, b) => a - b)
    }
    
    return ticks.slice(0, 5) // Limit to max 5 ticks
  }, [processedData])

  return (
    <div className={
      "w-full flex flex-row [--grid:#e5e7eb] dark:[--grid:#262626]" +
      (size === 'large' ? ' gap-10' : ' gap-8')
    } style={{ textRendering: 'optimizeLegibility' }}>
      <div className={
        (size === 'large'
          ? 'flex-shrink-0 w-full sm:w-[520px] h-[220px]'
          : 'flex-shrink-0 w-full sm:w-[420px] h-[180px]')
      }>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <AreaChart
            data={processedData}
            margin={{ top: 5, right: 5, left: 40, bottom: 5 }}
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            <XAxis 
              dataKey="index" 
              type="number"
              domain={["dataMin", "dataMax"]}
              axisLine={false} 
              tickLine={false} 
              tick={{ 
                fontSize: 10, 
                fill: '#9ca3af' 
              }}
              className="dark:fill-gray-400"
              height={20}
              tickCount={5}
              tickFormatter={(value, index) => {
                // Map index back to time for display
                const dataPoint = processedData[Math.round(value)]
                return dataPoint?.time ? String(dataPoint.time).slice(0, 5) : ''
              }}
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
              width={40}
            />
            
            {/* Disable default grid entirely */}
            <CartesianGrid stroke="none" vertical={false} horizontal={false} />
            
            {/* Draw horizontal grid lines explicitly for each labeled Y tick */}
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
              cursor={{
                stroke: '#5B2CC9',
                strokeWidth: 1,
                strokeDasharray: '4 4'
              }}
              animationDuration={0}
              isAnimationActive={false}
              allowEscapeViewBox={{ x: false, y: true }}
            />
            <defs>
              <linearGradient id="greenGradientHeader" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06d6a0" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#06d6a0" stopOpacity={0.15} />
              </linearGradient>
              <linearGradient id="redGradientHeader" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4757" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#FF4757" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            {/* Positive area - clip to line using split series */}
            <Area
              type="linear"
              dataKey="positiveValue"
              stroke="none"
              fill="url(#greenGradientHeader)"
              fillOpacity={1}
              connectNulls={false}
              isAnimationActive={false}
              baseValue={0}
              dot={false}
              activeDot={false}
            />
            
            {/* Negative area - clip to line using split series */}
            <Area
              type="linear"
              dataKey="negativeValue"
              stroke="none"
              fill="url(#redGradientHeader)"
              fillOpacity={1}
              connectNulls={false}
              isAnimationActive={false}
              baseValue={0}
              dot={false}
              activeDot={false}
            />
            
            {/* Main line stroke - this handles all hover interactions */}
            <Area
              type="linear"
              dataKey="value"
              stroke="#5B2CC9"
              strokeWidth={1.5}
              fill="none"
              connectNulls={true}
              isAnimationActive={false}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#5B2CC9",
                stroke: "#fff",
                strokeWidth: 2,
                style: { transition: 'all 0.1s ease' }
              }}
            />
            <ReferenceLine y={0} stroke="var(--grid)" strokeDasharray="2 2" strokeWidth={1} shapeRendering="crispEdges" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={size === 'large' ? 'flex-1 space-y-7' : 'flex-1 space-y-6'}>
        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
          <div className="pr-4">
            <div className={size === 'large' ? 'text-base text-gray-500 dark:text-gray-400 mb-1' : 'text-sm text-gray-500 dark:text-gray-400 mb-1'}>Total trades</div>
            <div className={size === 'large' ? 'text-xl font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-gray-900 dark:text-white'}>{stats.totalTrades}</div>
          </div>
          <div className="px-4">
            <div className={size === 'large' ? 'text-base text-gray-500 dark:text-gray-400 mb-1' : 'text-sm text-gray-500 dark:text-gray-400 mb-1'}>Winners</div>
            <div className={size === 'large' ? 'text-xl font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-gray-900 dark:text-white'}>{stats.winners}</div>
          </div>
          <div className="px-4">
            <div className={size === 'large' ? 'text-base text-gray-500 dark:text-gray-400 mb-1' : 'text-sm text-gray-500 dark:text-gray-400 mb-1'}>Gross P&L</div>
            <div className={size === 'large' ? 'text-xl font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-gray-900 dark:text-white'}>{formatCurrency(stats.grossPnl)}</div>
          </div>
          <div className="pl-4">
            <div className={size === 'large' ? 'text-base text-gray-500 dark:text-gray-400 mb-1' : 'text-sm text-gray-500 dark:text-gray-400 mb-1'}>Commissions</div>
            <div className={size === 'large' ? 'text-xl font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-gray-900 dark:text-white'}>{formatCurrency(stats.commissions)}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
          <div className="pr-4">
            <div className={size === 'large' ? 'text-base text-gray-500 dark:text-gray-400 mb-1' : 'text-sm text-gray-500 dark:text-gray-400 mb-1'}>Winrate</div>
            <div className={size === 'large' ? 'text-xl font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-gray-900 dark:text-white'}>{stats.winrate}</div>
          </div>
          <div className="px-4">
            <div className={size === 'large' ? 'text-base text-gray-500 dark:text-gray-400 mb-1' : 'text-sm text-gray-500 dark:text-gray-400 mb-1'}>Losers</div>
            <div className={size === 'large' ? 'text-xl font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-gray-900 dark:text-white'}>{stats.losers}</div>
          </div>
          <div className="px-4">
            <div className={size === 'large' ? 'text-base text-gray-500 dark:text-gray-400 mb-1' : 'text-sm text-gray-500 dark:text-gray-400 mb-1'}>Volume</div>
            <div className={size === 'large' ? 'text-xl font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-gray-900 dark:text-white'}>{stats.volume}</div>
          </div>
          <div className="pl-4">
            <div className={size === 'large' ? 'text-base text-gray-500 dark:text-gray-400 mb-1' : 'text-sm text-gray-500 dark:text-gray-400 mb-1'}>Profit factor</div>
            <div className={size === 'large' ? 'text-xl font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-gray-900 dark:text-white'}>
              {typeof stats.profitFactor === 'number' ? stats.profitFactor.toFixed(2) : stats.profitFactor || '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
