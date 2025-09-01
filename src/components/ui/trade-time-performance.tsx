'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Info, Settings } from 'lucide-react'
import { Button } from './button'
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import { useTheme } from '@/hooks/use-theme'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'

interface TradeTimeData {
  x: number // Time in decimal hours (e.g., 9.5 = 9:30)
  y: number // P&L
  trade: Trade // Original trade data for tooltip
  actualTime?: string // Actual time from trade data
  isDistributed?: boolean // Whether time was distributed artificially
}

// Generate trade time data from real trades
const generateTradeTimeData = (trades: Trade[]): TradeTimeData[] => {
  if (trades.length === 0) return []

  const processedData = trades
    .map((trade, index) => {
      let decimalTime: number = 12 // Default to noon if no time found
      let actualTime: string | undefined
      let isDistributed = false
      
      // Try to extract time from exitTime first
      if (trade.exitTime && typeof trade.exitTime === 'string') {
        try {
          const timeStr = trade.exitTime.trim()
          
          // Handle different time formats - support both HH:mm and HH:mm:ss
          if (timeStr.includes(':')) {
            const parts = timeStr.split(':')
            if (parts.length >= 2) {
              const hours = parseInt(parts[0].trim())
              const minutes = parseInt(parts[1].trim())
              
              if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                decimalTime = hours + minutes / 60
                // For display, use just HH:mm format
                actualTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
              }
            }
          }
        } catch (e) {
          // Failed to parse exitTime, continue to fallback
        }
      }
      
      // If exitTime didn't work, try entryTime
      if (decimalTime === 12 && trade.entryTime && typeof trade.entryTime === 'string') {
        try {
          const timeStr = trade.entryTime.trim()
          if (timeStr.includes(':')) {
            const parts = timeStr.split(':')
            if (parts.length >= 2) {
              const hours = parseInt(parts[0].trim())
              const minutes = parseInt(parts[1].trim())
              
              if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                decimalTime = hours + minutes / 60
                // For display, use just HH:mm format
                actualTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
              }
            }
          }
        } catch (e) {
          // Failed to parse entryTime, continue to fallback
        }
      }
      
      // If still no time found, distribute trades evenly across market hours
      // Only use distribution if we couldn't parse any time data
      if (decimalTime === 12 && !actualTime) {
        decimalTime = 9.5 + (index / Math.max(1, trades.length - 1)) * 6.5
        isDistributed = true
      }
      
      const dataPoint: TradeTimeData = {
        x: decimalTime,
        y: trade.netPnl || 0,
        trade: trade,
        actualTime: actualTime,
        isDistributed: isDistributed
      }
      
      // Validate the data point before adding it
      if (!trade || !trade.id) {
        console.warn('Invalid trade data found:', trade)
        return null
      }
      
      return dataPoint
    })
    .filter((dataPoint): dataPoint is TradeTimeData => dataPoint !== null) // Remove null values
  return processedData
}

export const TradeTimePerformance = React.memo(function TradeTimePerformance() {
  const { theme } = useTheme()
  const [trades, setTrades] = useState<Trade[]>([])
  
  // Detect dark mode using document class to avoid comparing against a 'system' literal when theme typing doesn't include it
  const isDark = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) || theme === 'dark'

  // Load trades and subscribe to changes
  useEffect(() => {
    setTrades(DataStore.getAllTrades())
    const unsubscribe = DataStore.subscribe(() => {
      setTrades(DataStore.getAllTrades())
    })
    return unsubscribe
  }, [])

  // Generate trade time data from real trades
  const tradeTimeData = useMemo(() => {
    return generateTradeTimeData(trades)
  }, [trades])

  const formatYAxis = (value: number) => {
    if (value === 0) return '$0'
    if (Math.abs(value) >= 1000) {
      const thousands = value / 1000
      // Show one decimal for non-integers to avoid label collisions (e.g., 1.5k vs 2k)
      const decimals = Number.isInteger(thousands) ? 0 : 1
      return `$${thousands.toFixed(decimals)}k`
    }
    return `$${value}`
  }

  const formatXAxis = (value: number) => {
    const hours = Math.floor(value)
    const minutes = Math.round((value - hours) * 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  if (!trades.length || tradeTimeData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.8 }}
        className="focus:outline-none"
      >
        <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '432px' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Trade time performance
            </h3>
          </div>
          
          {/* Header Divider */}
          <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
          
          <div className="h-[405px] flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400 text-center">
              <div>No time performance data</div>
              <div className="text-sm mt-1">Import your CSV with exit times to see trading patterns</div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Derive domains and add slight jitter to reduce overlap while preserving trade data
  const jitter = (n: number) => n + (Math.random() - 0.5) * 0.02
  const data = tradeTimeData.map(d => ({ 
    x: jitter(d.x), 
    y: d.y,
    trade: d.trade,
    actualTime: d.actualTime,
    isDistributed: d.isDistributed
  }))
  const xs = data.map(d => d.x)
  const ys = data.map(d => d.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const padX = Math.max(0.05, (maxX - minX) * 0.05)

  // Add color information to each data point
  const coloredData = data.map(d => ({
    ...d,
    color: d.y >= 0 ? '#10b981' : '#ef4444'
  }))


  // Build hourly x-axis ticks for better readability
  const startHour = Math.floor(minX)
  const endHour = Math.ceil(maxX)
  const hourlyTicks: number[] = []
  for (let h = startHour; h <= endHour; h += 1) { // Use 1-hour intervals for wider time ranges
    hourlyTicks.push(h)
  }

  // Generate fixed Y-axis ticks to prevent duplicates and stay within data range
  // Use symmetric bounds around zero with 500 steps
  const DATA_MIN = Math.min(-2000, Math.floor(minY / 500) * 500)
  const DATA_MAX = Math.max(2500, Math.ceil(maxY / 500) * 500)
  const niceMinY = DATA_MIN
  const niceMaxY = DATA_MAX
  const uniqueYTicks: number[] = []
  for (let y = niceMinY; y <= niceMaxY; y += 500) uniqueYTicks.push(y)

  const Dot = ({ cx, cy, fill, stroke }: { cx: number; cy: number; fill: string; stroke: string }) => (
    <circle cx={cx} cy={cy} r={4} fill={fill} stroke={stroke} strokeWidth={1.5} fillOpacity={0.9} />
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.8 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '432px' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trade time performance
          </h3>
        </div>
        
        {/* Header Divider */}
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
        
        
        <div className="h-[405px] -ml-6 overflow-visible" style={{ width: 'calc(100% + 24px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 5, left: -10, bottom: 60 }}
            >
              <XAxis 
                type="number"
                dataKey="x"
                name="time"
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
                tickFormatter={formatXAxis}
                interval="preserveStartEnd"
              />
              {uniqueYTicks.map((y) => (
                <ReferenceLine
                  key={`grid-y-${y}`}
                  y={y}
                  stroke="var(--grid)"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  ifOverflow="extendDomain"
                />
              ))}
              <YAxis 
                type="number"
                dataKey="y"
                name="pnl"
                axisLine={false}
                tickLine={false}
                tickFormatter={formatYAxis}
                domain={[ niceMinY, niceMaxY ]}
                ticks={uniqueYTicks}
                tick={{ 
                  fontSize: 11, 
                  fill: '#9ca3af'
                }}
                className="dark:fill-gray-400"
                scale="linear"
                allowDecimals={false}
              />
              
              
              
              <Tooltip cursor={false} content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                
                try {
                  const data = payload[0].payload
                  
                  // Safety check for data structure
                  if (!data || typeof data !== 'object') return null
                  
                  const trade = data.trade
                  const time = data.actualTime ? data.actualTime : formatXAxis(data.x)
                  const pnl = data.y || 0
                  const signed = `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toLocaleString()}`
                  
                  // Validate that color matches P&L
                  const expectedColor = pnl >= 0 ? '#10b981' : '#ef4444'
                  const actualColor = data.color
                  if (actualColor !== expectedColor) {
                    console.error('Color mismatch detected:', { pnl, expectedColor, actualColor })
                  }
                  
                  // Safety check for trade object
                  if (!trade || typeof trade !== 'object') {
                    return (
                      <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 text-sm shadow focus:outline-none">
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          Trade Data
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Time: {time}
                        </div>
                        <div className={`font-semibold ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          P&L: {signed}
                        </div>
                      </div>
                    )
                  }
                  
                  const tradeDate = trade.closeDate || trade.openDate 
                    ? new Date(trade.closeDate || trade.openDate).toLocaleDateString()
                    : 'Unknown Date'
                  
                  return (
                    <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 text-sm shadow focus:outline-none">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {trade.symbol || 'Unknown Symbol'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {tradeDate} at {time}
                        {data.isDistributed && <span className="ml-1 text-orange-500">(estimated time)</span>}
                      </div>
                      <div className="space-y-1">
                        <div className={`font-semibold ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          P&L: {signed}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Entry: ${trade.entryPrice?.toFixed(2) || 'N/A'} → Exit: ${trade.exitPrice?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )
                } catch (error) {
                  console.error('Error rendering Trade Time Performance tooltip:', error)
                  return (
                    <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 text-sm shadow focus:outline-none">
                      <div className="text-gray-600 dark:text-gray-400">
                        Unable to load trade details
                      </div>
                    </div>
                  )
                }
              }} />
              {/* Legend intentionally omitted to match the reference look */}
              
              <Scatter 
                name="Trades"
                data={coloredData}
                fill="#10b981"
                isAnimationActive={false}
                shape={(props: any) => {
                  const pointColor = props.payload?.color || '#10b981'
                  return <Dot cx={props.cx} cy={props.cy} fill={pointColor} stroke={pointColor} />
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
})