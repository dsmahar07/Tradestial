'use client'

import { motion } from 'framer-motion'
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts'
import { useState, useEffect, useMemo } from 'react'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'

interface PnlPeriod {
  period: string
  name: string
  cumulativePnl: number
  dailyPnl: number
  trades: number
  color: string
}

// Generate daily P&L data from real trades
const generatePnlDataFromTrades = (trades: Trade[]): PnlPeriod[] => {
  if (trades.length === 0) return []
  
  const data: PnlPeriod[] = []
  const dailyTradeMap = new Map<string, { pnl: number; trades: number }>()
  
  // Group trades by date (using close date consistently for P&L realization timing)
  const tradesByDate = trades.reduce((acc, trade) => {
    // Use closeDate consistently for P&L realization timing
    let dateToUse = trade.closeDate
    if (!dateToUse || dateToUse.trim() === '') {
      dateToUse = trade.openDate
      if (!dateToUse || dateToUse.trim() === '') return acc
    }
    
    const dateKey = dateToUse.split('T')[0] // Extract date part
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(trade)
    return acc
  }, {} as Record<string, Trade[]>)

  // Populate dailyTradeMap with P&L data
  Object.entries(tradesByDate).forEach(([dateKey, dayTrades]) => {
    const dailyPnl = dayTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
    dailyTradeMap.set(dateKey, { pnl: dailyPnl, trades: dayTrades.length })
  })

  // Get all trading days and sort them
  const tradingDays = Array.from(Object.keys(tradesByDate))
    .map(dateKey => new Date(dateKey))
    .sort((a, b) => a.getTime() - b.getTime())
  
  // Take last 14 days or all days if less than 14
  const recentDays = tradingDays.slice(-14)
  
  let cumulativePnl = 0
  
  // Calculate cumulative P&L for recent days
  recentDays.forEach(date => {
    const dateKey = date.toISOString().split('T')[0] // Use YYYY-MM-DD format
    const dayData = dailyTradeMap.get(dateKey)
    
    if (dayData) {
      cumulativePnl += dayData.pnl
      
      data.push({
        period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        name: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        cumulativePnl: Math.round(cumulativePnl),
        dailyPnl: Math.round(dayData.pnl),
        trades: dayData.trades,
        color: cumulativePnl >= 0 ? '#10b981' : '#ef4444'
      })
    }
  })
  
  return data
}

const metrics = ['Cumulative P&L', 'Daily P&L', 'Trade Count']

export function CumulativePnlBar() {
  const [selectedMetric, setSelectedMetric] = useState('Daily P&L')
  const [trades, setTrades] = useState<Trade[]>([])

  // Load trades and subscribe to changes
  useEffect(() => {
    const initialTrades = DataStore.getAllTrades()
    console.log('🔍 Cumulative PNL Bar - Initial load:', initialTrades.length)
    setTrades(initialTrades)
    const unsubscribe = DataStore.subscribe(() => {
      const updatedTrades = DataStore.getAllTrades()
      console.log('🔍 Cumulative PNL Bar - Data update received:', updatedTrades.length)
      setTrades(updatedTrades)
    })
    return unsubscribe
  }, [])

  // Generate P&L data from real trades
  const pnlData = useMemo(() => {
    console.log('🔍 Cumulative PNL Bar - Generating data from trades:', trades.length)
    const data = generatePnlDataFromTrades(trades)
    console.log('🔍 Generated P&L data:', data.length, 'periods')
    if (data.length > 0) {
      console.log('🔍 Sample data point:', data[0])
    }
    return data
  }, [trades])

  // Get data based on selected metric
  const getChartData = () => {
    switch (selectedMetric) {
      case 'Cumulative P&L':
        return pnlData.map(item => ({ 
          period: item.period, 
          name: item.name,
          value: item.cumulativePnl,
          color: item.cumulativePnl >= 0 ? '#10b981' : '#ef4444'
        }))
      case 'Daily P&L':
        return pnlData.map(item => ({ 
          period: item.period, 
          name: item.name,
          value: item.dailyPnl,
          color: item.dailyPnl >= 0 ? '#10b981' : '#ef4444'
        }))
      case 'Trade Count':
        return pnlData.map(item => ({ 
          period: item.period, 
          name: item.name,
          value: item.trades,
          color: '#3b82f6'
        }))
      default:
        return []
    }
  }

  const chartData = getChartData()

  // Compute dynamic Y-axis ticks across chart data (matches Account Balance widget)
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

  // Show empty state when no trades
  if (!trades.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="focus:outline-none"
      >
        <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: '432px' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedMetric}
            </h3>
          </div>
          {/* Header Divider */}
          <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
          <div className="h-72 flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400 text-center">
              <div>No P&L data available</div>
              <div className="text-sm mt-1">Import your CSV to see cumulative P&L chart</div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-[#0f0f0f] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-[#2a2a2a]">
          <p className="font-medium text-gray-900 dark:text-white mb-1">
            {data.period} - {data.name}
          </p>
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedMetric}: {
                selectedMetric === 'Trade Count' 
                  ? data.value
                  : `$${data.value.toLocaleString()}`
              }
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  // Format Y-axis labels (matches Account Balance widget)
  const formatCurrency = (value: number) => {
    // Full currency with thousands separators, e.g. $60,000
    return `$${Math.round(value).toLocaleString()}`
  }

  const formatYAxisLabel = (value: number) => {
    if (selectedMetric === 'Trade Count') {
      return value.toString()
    }
    return formatCurrency(value)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '432px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedMetric}
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-white dark:bg-[#0f0f0f] border-0 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm px-2 py-1 !h-5 !min-h-0 text-xs"
                >
                  <span className="text-xs">{selectedMetric.split(' ')[0]}</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {metrics.map((metric) => (
                  <DropdownMenuItem
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={selectedMetric === metric ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  >
                    <span className="text-xs">{metric}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Header Divider */}
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>

        {/* Bar Chart */}
        <div className="h-[405px] -ml-6 overflow-visible" style={{ width: 'calc(100% + 24px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 5, left: 2, bottom: 60 }}
            >
              {/* Disable default grid entirely */}
              <CartesianGrid stroke="none" vertical={false} horizontal={false} />
              <XAxis 
                dataKey="period" 
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
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#6b7280"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisLabel}
                domain={[Math.min(...yTicks), Math.max(...yTicks)]}
                ticks={yTicks}
                tick={{ 
                  fontSize: 11, 
                  fill: '#9ca3af'
                }}
                className="dark:fill-gray-400"
                scale="linear"
                allowDecimals={false}
              />
              {/* Draw horizontal grid lines exactly at labeled ticks */}
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
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}