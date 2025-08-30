'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { LineChart, Line, Area, ComposedChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { parseLocalDate } from '@/utils/date-utils'

interface DrawdownData {
  date: string
  drawdown: number
  formattedDate: string
  index: number
}

// Generate drawdown data from real trades
const generateDrawdownData = (trades: Trade[]): DrawdownData[] => {
  if (trades.length === 0) return []

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    parseLocalDate(a.closeDate || a.openDate).getTime() - parseLocalDate(b.closeDate || b.openDate).getTime()
  )

  const drawdownData: DrawdownData[] = []
  let cumulativePnL = 0
  let peak = 0

  // Process each trade to calculate running drawdown
  sortedTrades.forEach((trade, idx) => {
    cumulativePnL += trade.netPnl
    
    // Update peak if we hit a new high
    if (cumulativePnL > peak) {
      peak = cumulativePnL
    }
    
    // Calculate drawdown (always negative or zero)
    const drawdown = cumulativePnL - peak
    
    const tradeDate = parseLocalDate(trade.closeDate || trade.openDate)
    const formattedDate = tradeDate.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    })
    
    drawdownData.push({
      date: tradeDate.toISOString().split('T')[0],
      drawdown: Math.round(drawdown),
      formattedDate,
      index: idx
    })
  })

  return drawdownData
}

// Custom Tooltip component for Drawdown
const DrawdownTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const drawdown = data.drawdown
    
    return (
      <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className="text-gray-600 dark:text-gray-300 font-medium mb-1">{data.formattedDate}</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2547D0]" />
          <span className="text-gray-700 dark:text-gray-300">
            Drawdown: {drawdown === 0 ? '$0' : `-$${Math.abs(drawdown).toLocaleString()}`}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export const DrawdownChart = React.memo(function DrawdownChart() {
  const [trades, setTrades] = useState<Trade[]>([])

  // Load trades and subscribe to changes
  useEffect(() => {
    setTrades(DataStore.getAllTrades())
    const unsubscribe = DataStore.subscribe(() => {
      setTrades(DataStore.getAllTrades())
    })
    return unsubscribe
  }, [])

  // Generate drawdown data from real trades
  const drawdownData = useMemo(() => generateDrawdownData(trades), [trades])

  const formatYAxis = (value: number) => {
    if (value === 0) return '$0'
    const absValue = Math.abs(value)
    if (absValue >= 1000000) {
      return `-$${(absValue / 1000000).toFixed(1)}M`
    }
    if (absValue >= 10000) {
      return `-$${(absValue / 1000).toFixed(0)}k`
    }
    if (absValue >= 1000) {
      return `-$${(absValue / 1000).toFixed(1)}k`
    }
    return `-$${absValue.toFixed(0)}`
  }

  // Calculate truly dynamic Y-axis ticks based on actual data
  const yTicks = useMemo(() => {
    if (drawdownData.length === 0) return [0, -500, -1000, -1500, -2000, -2500, -3000]
    
    const minDrawdown = Math.min(...drawdownData.map(d => d.drawdown), 0)
    const maxDrawdown = Math.max(...drawdownData.map(d => d.drawdown), 0)
    
    // Handle case where there's no drawdown (all positive)
    if (minDrawdown >= 0) {
      return [0, -100, -250, -500, -1000]
    }
    
    // Calculate appropriate tick interval based on data range
    const range = Math.abs(minDrawdown)
    let tickInterval = 500
    
    if (range < 1000) {
      tickInterval = 100
    } else if (range < 2500) {
      tickInterval = 250
    } else if (range < 5000) {
      tickInterval = 500
    } else if (range < 10000) {
      tickInterval = 1000
    } else {
      tickInterval = Math.ceil(range / 8 / 1000) * 1000
    }
    
    const ticks = [0]
    const numTicks = Math.ceil(Math.abs(minDrawdown) / tickInterval) + 1
    
    for (let i = 1; i <= numTicks; i++) {
      ticks.push(-i * tickInterval)
    }
    
    return ticks.filter(tick => tick >= minDrawdown - tickInterval)
  }, [drawdownData])

  if (!trades.length || !drawdownData.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.6 }}
        className="focus:outline-none"
      >
        <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: '385px' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Drawdown
              </h3>
              <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400 text-center">
              <div>No drawdown data available</div>
              <div className="text-sm mt-1">Import your CSV to see drawdown analysis</div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.6 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '385px' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Drawdown
            </h3>
            <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
              >
                <span>All time</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] shadow-lg min-w-[120px]"
            >
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                All time
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Last month
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Last week
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="h-[300px] w-full outline-none focus:outline-none">
          <ResponsiveContainer width="100%" height="100%" className="focus:outline-none [&>*]:focus:outline-none">
            <ComposedChart
              data={drawdownData}
              margin={{ top: 20, right: 15, left: 0, bottom: 25 }}
            >
              {yTicks.map((y) => (
                <ReferenceLine
                  key={`grid-y-${y}`}
                  y={y}
                  stroke="var(--grid)"
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                  style={{ shapeRendering: 'crispEdges' }}
                />
              ))}
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E93544" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#E93544" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="index"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 12, 
                  fill: '#9ca3af',
                  fontWeight: 600
                }}
                className="dark:fill-gray-400"
                height={25}
                tickMargin={5}
                tickFormatter={(value, index) => {
                  // Show MM/DD from the corresponding datum's formattedDate
                  // Recharts passes value as the x (index); use index to access data array safely
                  const d = drawdownData[index]
                  if (!d) return ''
                  const parts = d.formattedDate.split('/')
                  return `${parts[0]}/${parts[1]}`
                }}
                interval="preserveStartEnd"
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 11, 
                  fill: '#9ca3af'
                }}
                className="dark:fill-gray-400"
                tickFormatter={formatYAxis}
                domain={[Math.min(...yTicks), 0]}
                ticks={yTicks}
                padding={{ top: 5, bottom: 0 }}
                width={55}
              />
              
              <Tooltip content={<DrawdownTooltip />} cursor={false} />
              
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="none"
                fill="url(#drawdownGradient)"
                fillOpacity={0.7}
                isAnimationActive={false}
                connectNulls={true}
              />
              
              <Line
                type="monotone"
                dataKey="drawdown"
                stroke="#2547D0"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls={true}
                activeDot={{
                  r: 6,
                  fill: "#2547D0",
                  stroke: "#fff",
                  strokeWidth: 2
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
})