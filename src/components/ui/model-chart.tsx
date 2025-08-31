'use client'

import React, { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, CartesianGrid } from 'recharts'

interface ModelChartProps {
  trades: any[]
  title?: string
  height?: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  // Read from payload value first, then fallback to original datum to avoid nulls from split series
  const raw = payload[0]
  const value = raw?.value ?? raw?.payload?.value

  if (value === undefined || value === null) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className="font-semibold text-gray-500">No data</div>
      </div>
    )
  }

  const formattedValue = value >= 0 ? `$${Number(value).toLocaleString()}` : `-$${Math.abs(Number(value)).toLocaleString()}`

  return (
    <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
      <div className={`font-semibold ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formattedValue}</div>
    </div>
  )
}

// Currency formatter similar to cumulative-pnl-chart
const formatCurrency = (value: number): string => {
  if (!isFinite(value) || isNaN(value)) return '$0'
  const absValue = Math.abs(value)
  if (absValue >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(1)}T`
  if (absValue >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (absValue >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (absValue >= 1_000) return `$${(value / 1_000).toFixed(1)}k`
  if (absValue < 1 && absValue > 0) return `$${value.toFixed(2)}`
  return `$${Math.round(value).toLocaleString()}`
}

export const ModelChart = React.memo(function ModelChart({ 
  trades, 
  title = "Cumulative P&L",
  height = 264
}: ModelChartProps) {
  // Calculate cumulative P&L data
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return []
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => {
      const dateA = new Date(a.openDate || a.date || 0).getTime()
      const dateB = new Date(b.openDate || b.date || 0).getTime()
      return dateA - dateB
    })
    
    let cumulativePnL = 0
    const dataPoints: { time: string; value: number; positiveValue: number | null; negativeValue: number | null; index: number }[] = []
    
    // Start with first trade to avoid artificial $0 point
    // Remove baseline point to prevent red dot on $0 axis
    
    let prevValue: number | null = null
    let runningIndex = 0
    sortedTrades.forEach((trade) => {
      const pnl = typeof trade.netPnl === 'number' ? trade.netPnl : 
                  typeof trade.pnl === 'number' ? trade.pnl : 
                  parseFloat(String(trade.netPnl || trade.pnl || 0))
      
      if (!isNaN(pnl)) {
        cumulativePnL += pnl
      }
      
      const date = new Date(trade.openDate || trade.date || Date.now())
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formattedDate = `${month}/${day}`
      
      const currentValue = cumulativePnL

      // If crossing zero between prev and current, insert a zero point first to meet at axis
      if (prevValue !== null && ((prevValue > 0 && currentValue < 0) || (prevValue < 0 && currentValue > 0))) {
        dataPoints.push({
          time: formattedDate,
          value: 0,
          positiveValue: 0,
          negativeValue: 0,
          index: runningIndex++
        })
      }

      dataPoints.push({
        time: formattedDate,
        value: currentValue,
        positiveValue: currentValue > 0 ? currentValue : null,
        negativeValue: currentValue < 0 ? currentValue : null,
        index: runningIndex++
      })

      prevValue = currentValue
    })
    
    return dataPoints
  }, [trades])

  // Dynamic X ticks (exclude any baseline with empty label if ever added)
  const xTicks = useMemo(() => {
    return chartData.filter(d => d.time).map(d => d.index)
  }, [chartData])

  // Dynamic Y ticks with nice bounds and step, including 0
  const yTicks = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0]
    const values: number[] = []
    for (const d of chartData) {
      if (typeof d.value === 'number' && isFinite(d.value)) values.push(d.value)
    }
    if (values.length === 0) return [0]
    const min = Math.min(...values, 0)
    const max = Math.max(...values, 0)
    if (min === max) {
      const pad = Math.max(1, Math.abs(min) * 0.1)
      return [min - 2 * pad, min - pad, min, min + pad, min + 2 * pad]
    }
    const range = max - min
    const rawStep = range / 6
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, Math.abs(rawStep)))))
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude
    const niceMin = Math.floor(min / niceStep) * niceStep
    const niceMax = Math.ceil(max / niceStep) * niceStep
    const ticks: number[] = []
    for (let v = niceMin; v <= niceMax + 1e-9; v += niceStep) {
      const rounded = Number(v.toFixed(6))
      if (!ticks.includes(rounded)) ticks.push(rounded)
    }
    // Ensure zero is present
    if (!ticks.includes(0)) ticks.push(0)
    // Sort to keep order
    return ticks.sort((a, b) => a - b)
  }, [chartData])

  if (!chartData.length) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 h-full" style={{ height }}>
        <div className="flex items-center mb-4">
          <h3 className="text-base font-semibold text-gray-500/80 dark:text-gray-400/70">{title}</h3>
        </div>
        <div className="my-2 -mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a]" />
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded">
          <p className="text-sm text-gray-500 dark:text-gray-400">No trade data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 h-full" style={{ height }}>
      <div className="flex items-center mb-4">
        <h3 className="text-base font-semibold text-gray-500/80 dark:text-gray-400/70">{title}</h3>
      </div>
      <div className="my-2 -mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      <div className="-mx-3" style={{ height: height - 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 8, left: -10, bottom: 20 }}>
            <defs>
              {/* Green gradient for positive areas */}
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              {/* Red gradient for negative areas */}
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                {/* Stronger near the zero line (top), fading downward */}
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            {/* Disable default grid; we'll draw our own via ReferenceLine */}
            <CartesianGrid stroke="none" vertical={false} horizontal={false} />

            <XAxis 
              dataKey="index"
              type="number"
              domain={["dataMin", "dataMax"]}
              allowDecimals={false}
              scale="linear"
              axisLine={false}
              tickLine={false}
              padding={{ left: 0, right: 0 }}
              tick={{ 
                fontSize: 12, 
                fill: '#9ca3af',
                fontWeight: 600
              }}
              height={25}
              tickMargin={5}
              tickFormatter={(value) => {
                const v = typeof value === 'number' ? value : Number(value)
                const d = chartData.find(pt => pt.index === v)
                const label = d?.time || ''
                return label
              }}
              interval="preserveStartEnd"
              minTickGap={20}
              ticks={xTicks}
              hide={false}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: '#9ca3af'
              }}
              tickFormatter={(value) => formatCurrency(value as number)}
              domain={[Math.min(...yTicks), Math.max(...yTicks)]}
              ticks={yTicks}
              scale="linear"
              allowDecimals={false}
            />

            {/* Draw horizontal grid lines for each Y tick (including $0) */}
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
            
            {/* Positive area - only fills when line is above zero */}
            <Area
              type="linear"
              dataKey="positiveValue"
              stroke="none"
              fill="url(#positiveGradient)"
              fillOpacity={1}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-in-out"
              baseValue={0}
            />
            
            {/* Negative area - only fills when line is below zero */}
            <Area
              type="linear"
              dataKey="negativeValue"
              stroke="none"
              fill="url(#negativeGradient)"
              fillOpacity={1}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-in-out"
              baseValue={0}
            />
            
            {/* Main line stroke */}
            <Area
              type="linear"
              dataKey="value"
              stroke="#5B2CC9"
              strokeWidth={2.5}
              fill="none"
              connectNulls={true}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#5B2CC9",
                stroke: "#fff",
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})