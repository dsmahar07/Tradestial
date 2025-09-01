'use client'

import { useMemo, useState, useEffect } from 'react'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Cell } from 'recharts'
import { cn } from '@/lib/utils'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { useTheme } from '@/hooks/use-theme'

type ChartPoint = {
  date: string
  dailyPnl: number
  cumulativePnl: number
  positiveCumulative?: number | null
  negativeCumulative?: number | null
}

export function DailyCumulativePnlWidget() {
  const [trades, setTrades] = useState<Trade[]>([])
  const { theme } = useTheme()
  const isDarkTheme = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : theme === 'dark'

  useEffect(() => {
    setTrades(DataStore.getAllTrades())
    const unsubscribe = DataStore.subscribe(() => {
      setTrades(DataStore.getAllTrades())
    })
    return unsubscribe
  }, [])

  const chartData = useMemo(() => {
    if (trades.length === 0) return []

    // Group trades by date
    const dailyMap = new Map<string, number>()
    trades.forEach(trade => {
      const dateKey = (trade.closeDate || trade.openDate).substring(0, 10)
      const existing = dailyMap.get(dateKey) || 0
      dailyMap.set(dateKey, existing + trade.netPnl)
    })

    // Sort dates and calculate cumulative
    const sortedDates = Array.from(dailyMap.keys()).sort()
    let cumulative = 0
    
    return sortedDates.map(date => {
      const dailyPnl = dailyMap.get(date) || 0
      cumulative += dailyPnl
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dailyPnl: Math.round(dailyPnl),
        cumulativePnl: Math.round(cumulative),
        positiveCumulative: cumulative > 0 ? cumulative : null,
        negativeCumulative: cumulative < 0 ? cumulative : null
      }
    })
  }, [trades])

  const totalDailyPnl = useMemo(() => {
    return chartData.reduce((sum, point) => sum + point.dailyPnl, 0)
  }, [chartData])

  const finalCumulativePnl = useMemo(() => {
    return chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnl : 0
  }, [chartData])

  // Compute dynamic Y-axis ticks with better step calculation
  const yTicks = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0]
    const values: number[] = []
    for (const d of chartData) {
      if (typeof d.dailyPnl === 'number' && isFinite(d.dailyPnl)) values.push(d.dailyPnl)
      if (typeof d.cumulativePnl === 'number' && isFinite(d.cumulativePnl)) values.push(d.cumulativePnl)
    }
    if (values.length === 0) return [0]

    const min = Math.min(...values)
    const max = Math.max(...values)

    // Always include 0 in the range for better reference
    const adjustedMin = Math.min(min, 0)
    const adjustedMax = Math.max(max, 0)

    // Guard single-value or flat series
    if (adjustedMin === adjustedMax) {
      const pad = Math.max(100, Math.abs(adjustedMin) * 0.1)
      return [-2 * pad, -pad, 0, pad, 2 * pad]
    }

    // Better step calculation with smaller increments
    const range = adjustedMax - adjustedMin
    const targetSteps = 6
    const rawStep = range / targetSteps
    
    // Create nice round numbers for steps
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
    const normalizedStep = rawStep / magnitude
    
    let niceStep
    if (normalizedStep <= 1) niceStep = magnitude
    else if (normalizedStep <= 2) niceStep = 2 * magnitude
    else if (normalizedStep <= 5) niceStep = 5 * magnitude
    else niceStep = 10 * magnitude

    // Expand to nice bounds that include our adjusted range
    const niceMin = Math.floor(adjustedMin / niceStep) * niceStep
    const niceMax = Math.ceil(adjustedMax / niceStep) * niceStep

    const ticks: number[] = []
    for (let v = niceMin; v <= niceMax + 1e-9; v += niceStep) {
      const roundedTick = Math.round(v)
      if (!ticks.includes(roundedTick)) {
        ticks.push(roundedTick)
      }
    }
    
    // Ensure 0 is included
    if (!ticks.includes(0)) {
      ticks.push(0)
      ticks.sort((a, b) => a - b)
    }
    
    return ticks
  }, [chartData])

  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value)
    if (absValue >= 1000) return `$${(value / 1000).toFixed(1)}k`
    return `$${Math.round(value)}`
  }

  const gradientId = useMemo(() => `dailyCumulative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, [])

  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '432px' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily & Cumulative P&L</h3>
        
        {/* Legend */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #10b981, #ef4444)' }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Daily P&L (Bars)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-[#5B2CC9] rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Cumulative Total (Line)</span>
          </div>
        </div>
      </div>
      
      {/* Header Divider */}
      <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>

      <div className="h-[405px] -ml-6 overflow-visible" style={{ width: 'calc(100% + 24px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 5, left: -10, bottom: 60 }}>
            <CartesianGrid stroke="none" vertical={false} horizontal={false} />
            
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              axisLine={false} 
              tickLine={false} 
              padding={{ left: 0, right: 0 }}
              tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
              className="dark:fill-gray-400"
              height={25}
              tickMargin={5}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={formatCurrency}
              tick={{ 
                fontSize: 11, 
                fill: '#9ca3af'
              }}
              className="dark:fill-gray-400"
              domain={[Math.min(...yTicks), Math.max(...yTicks)]}
              ticks={yTicks}
              scale="linear"
              allowDecimals={false}
            />
            
            {/* Draw horizontal grid lines for each Y tick */}
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
            
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null
              const data = payload[0].payload as ChartPoint
              return (
                <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">{label}</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: data.dailyPnl >= 0 ? '#10b981' : '#ef4444' }}></div>
                        <span className="text-gray-600 dark:text-gray-400">Daily P&L (Bars)</span>
                      </div>
                      <span className={cn('font-semibold', data.dailyPnl >= 0 ? 'text-[#10B981]' : 'text-[#ef4444]')}>
                        {data.dailyPnl >= 0 ? '+' : ''}{formatCurrency(data.dailyPnl)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-0.5 bg-[#5B2CC9] rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-400">Cumulative Total (Line)</span>
                      </div>
                      <span className={cn('font-semibold', data.cumulativePnl >= 0 ? 'text-[#10B981]' : 'text-[#ef4444]')}>
                        {data.cumulativePnl >= 0 ? '+' : ''}{formatCurrency(data.cumulativePnl)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }} />
            
            <Bar 
              dataKey="dailyPnl" 
              barSize={16}
              radius={[2, 2, 0, 0]}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.date}`} fill={entry.dailyPnl >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
            
            <Line
              type="monotone"
              dataKey="cumulativePnl"
              stroke="#5B2CC9"
              strokeWidth={1.5}
              dot={{
                r: 3,
                fill: "#5B2CC9",
                stroke: "#fff",
                strokeWidth: 1
              }}
              activeDot={{
                r: 5,
                fill: "#5B2CC9",
                stroke: "#fff",
                strokeWidth: 2
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

export default DailyCumulativePnlWidget
