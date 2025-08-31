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
        positiveValue: value > 0 ? value : null,
        negativeValue: value < 0 ? value : null,
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

  // Compute dynamic Y-axis ticks across data values
  const yTicks = useMemo(() => {
    if (!processedData || processedData.length === 0) return [0]
    const values: number[] = []
    for (const d of processedData) {
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
      // Round to avoid floating point precision issues
      const roundedTick = Math.round(Number(v.toFixed(10)))
      // Avoid duplicate ticks
      if (!ticks.includes(roundedTick)) {
        ticks.push(roundedTick)
      }
    }
    return ticks
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
              allowDecimals={false}
              scale="linear"
              axisLine={false} 
              tickLine={false} 
              tick={false}
              padding={{ left: 0, right: 0 }}
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
              cursor={false}
            />
            <defs>
              <linearGradient id="greenGradientHeader" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="redGradientHeader" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
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
            />
            
            {/* Main line stroke */}
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
                r: 5,
                fill: "#5B2CC9",
                stroke: "#fff",
                strokeWidth: 3,
                filter: "drop-shadow(0 2px 4px rgba(91, 44, 201, 0.3))"
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
            <div className={size === 'large' ? 'text-xl font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-gray-900 dark:text-white'}>{stats.profitFactor}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
