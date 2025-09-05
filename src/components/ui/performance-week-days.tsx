'use client'

import { useMemo, useState, useEffect } from 'react'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Cell } from 'recharts'
import { cn } from '@/lib/utils'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { useTheme } from '@/hooks/use-theme'
import { Info } from 'lucide-react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

type ChartPoint = {
  weekday: string
  dailyPnl: number
  cumulativeTrend: number
  positiveFinal?: number | null
  negativeFinal?: number | null
  tradeCount: number
}

export function PerformanceWeekDays() {
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

    // Group ALL trades by weekday across entire trading history
    const weekdayMap = new Map<string, { totalPnl: number, tradeCount: number }>()
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    
    // Initialize all weekdays with 0
    weekdays.forEach(day => {
      weekdayMap.set(day, { totalPnl: 0, tradeCount: 0 })
    })

    // Process ALL trades from entire trading history
    trades.forEach(trade => {
      const tradeDate = new Date(trade.closeDate || trade.openDate)
      const dayOfWeek = tradeDate.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      // Only include Monday-Friday (1-5) - aggregate across ALL time periods
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const weekdayName = weekdays[dayOfWeek - 1] // Convert to weekday name
        const existing = weekdayMap.get(weekdayName)!
        
        // Add to total P&L (with NaN protection)
        if (trade.netPnl && !isNaN(trade.netPnl) && isFinite(trade.netPnl)) {
          existing.totalPnl += trade.netPnl
        }
        existing.tradeCount += 1
      }
    })

    // Debug: Log the data to see what's happening
    console.log('Weekday data:', Array.from(weekdayMap.entries()))
    
    return weekdays.map(weekday => {
      const weekdayData = weekdayMap.get(weekday)!
      const finalPnl = isNaN(weekdayData.totalPnl) ? 0 : weekdayData.totalPnl
      
      console.log(`${weekday}: totalPnl=${finalPnl}`)
      
      return {
        weekday: weekday.substring(0, 3), // Mon, Tue, Wed, Thu, Fri
        dailyPnl: isFinite(finalPnl) ? Math.round(finalPnl) : 0, // Final P&L (net result) - shown as bars
        cumulativeTrend: isFinite(finalPnl) ? Math.round(finalPnl) : 0, // Same as dailyPnl for trend visualization
        positiveFinal: finalPnl > 0 ? finalPnl : null,
        negativeFinal: finalPnl < 0 ? finalPnl : null,
        tradeCount: weekdayData.tradeCount
      }
    })
  }, [trades])

  const totalDailyPnl = useMemo(() => {
    return chartData.reduce((sum, point) => sum + point.dailyPnl, 0)
  }, [chartData])

  const totalCumulativeValue = useMemo(() => {
    return chartData.length > 0 ? chartData[chartData.length - 1].cumulativeTrend : 0
  }, [chartData])

  const totalFinalPnl = useMemo(() => {
    return chartData.reduce((sum, point) => sum + point.dailyPnl, 0)
  }, [chartData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatTooltipValue = (value: number | null | undefined, name: string) => {
    if (value === null || value === undefined || isNaN(value)) {
      return ['$0', name === 'peakProfitLoss' ? 'Peak Profit/Loss' : 'Final P&L']
    }
    if (name === 'peakProfitLoss') {
      return [formatCurrency(value), 'Peak Profit/Loss']
    }
    return [formatCurrency(value), name === 'dailyPnl' ? 'Final P&L' : name]
  }

  // Compute dynamic Y-axis ticks with better step calculation
  const yTicks = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0]
    const values: number[] = []
    for (const d of chartData) {
      if (typeof d.dailyPnl === 'number' && isFinite(d.dailyPnl)) values.push(d.dailyPnl)
      if (typeof d.cumulativeTrend === 'number' && isFinite(d.cumulativeTrend)) values.push(d.cumulativeTrend)
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


  const gradientId = useMemo(() => `performanceWeekDays-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, [])

  return (
    <RadixTooltip.Provider delayDuration={400}>
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '432px' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Week Days</h3>
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
                  Analyze your trading performance by day of the week. Green/red bars show total P&L for each weekday, while the purple line displays the performance trend across the trading week.
                  <RadixTooltip.Arrow className="fill-white dark:fill-[#0f0f0f]" />
                </RadixTooltip.Content>
              </RadixTooltip.Portal>
            </RadixTooltip.Root>
          </div>
          
          {/* Legend */}
          <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #10b981, #ef4444)' }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-[#5B2CC9] rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Trend</span>
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
              dataKey="weekday" 
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
              
              // Safe value extraction with NaN protection
              const dailyPnl = isNaN(data.dailyPnl) || !isFinite(data.dailyPnl) ? 0 : data.dailyPnl
              
              return (
                <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">{label}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: dailyPnl >= 0 ? '#10b981' : '#ef4444' }}></div>
                      <span className="text-gray-600 dark:text-gray-400">P&L</span>
                    </div>
                    <span className={cn('font-semibold', dailyPnl >= 0 ? 'text-[#10B981]' : 'text-[#ef4444]')}>
                      {dailyPnl >= 0 ? '+' : ''}{formatCurrency(dailyPnl)}
                    </span>
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
                <Cell key={`cell-${entry.weekday}`} fill={entry.dailyPnl >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
            
            <Line
              type="monotone"
              dataKey="cumulativeTrend"
              stroke="#5B2CC9"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "#5B2CC9",
                strokeWidth: 2,
                stroke: "#5B2CC9"
              }}
              activeDot={{
                r: 6,
                fill: "#5B2CC9",
                strokeWidth: 2,
                stroke: "#ffffff"
              }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
    </RadixTooltip.Provider>
  )
}

export default PerformanceWeekDays
