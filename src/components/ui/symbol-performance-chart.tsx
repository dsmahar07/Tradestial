'use client'

import { logger } from '@/lib/logger'

import { motion } from 'framer-motion'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { useState, useMemo, useEffect } from 'react'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { Info } from 'lucide-react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { usePrivacy } from '@/contexts/privacy-context'
import { maskCurrencyValue } from '@/utils/privacy'

interface SymbolPerformance {
  symbol: string
  name: string
  pnl: number
  trades: number
  winRate: number
  avgTrade: number
  volume: number
}

// Generate real symbols data from imported trades
const generateSymbolsData = (trades: Trade[]): SymbolPerformance[] => {
  if (trades.length === 0) return []

  // Group trades by symbol
  const symbolGroups = trades.reduce((acc, trade) => {
    const symbol = trade.symbol.toUpperCase()
    if (!acc[symbol]) {
      acc[symbol] = []
    }
    acc[symbol].push(trade)
    return acc
  }, {} as Record<string, Trade[]>)

  // Calculate metrics for each symbol
  return Object.entries(symbolGroups).map(([symbol, symbolTrades]) => {
    const totalPnL = symbolTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
    const wins = symbolTrades.filter(trade => trade.netPnl > 0)
    const winRate = symbolTrades.length > 0 ? (wins.length / symbolTrades.length) * 100 : 0
    const avgTrade = symbolTrades.length > 0 ? totalPnL / symbolTrades.length : 0
    const volume = symbolTrades.reduce((sum, trade) => sum + (trade.contractsTraded || 1), 0)
    
    return {
      symbol,
      name: getSymbolName(symbol),
      pnl: totalPnL,
      trades: symbolTrades.length,
      winRate,
      avgTrade,
      volume
    }
  }).sort((a, b) => b.pnl - a.pnl) // Sort by P&L descending
}

// Get display name for symbol
const getSymbolName = (symbol: string): string => {
  const symbolNames: Record<string, string> = {
    'NQ': 'NASDAQ-100',
    'ES': 'S&P 500',
    'YM': 'Dow Jones',
    'RTY': 'Russell 2000',
    'CL': 'Crude Oil',
    'GC': 'Gold',
    'SI': 'Silver',
    'ZN': '10-Year Note',
    'ZB': '30-Year Bond',
    'EUR/USD': 'Euro/Dollar',
    'GBP/USD': 'Pound/Dollar',
    'USD/JPY': 'Dollar/Yen',
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    // Add more symbols as needed
  }
  
  return symbolNames[symbol] || symbol // Return symbol if no mapping found
}

const timeRanges = ['Today', 'This Week', 'This Month', 'All Time']
const metrics = ['P&L', 'Trade Count', 'Win Rate', 'Avg Trade']

export function SymbolPerformanceChart() {
  const selectedTimeRange = 'All Time'
  const selectedMetric = 'P&L'
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const { isPrivacyMode } = usePrivacy()

  // Load trades and subscribe to changes
  useEffect(() => {
    const loadData = () => {
      try {
        const allTrades = DataStore.getAllTrades()
        setTrades(allTrades)
      } catch (error) {
        logger.error('Failed to load trades for symbol performance:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    
    // Subscribe to data changes
    const unsubscribe = DataStore.subscribe(loadData)
    return unsubscribe
  }, [])

  // Filter trades based on selected time range
  const filteredTrades = useMemo(() => {
    if (trades.length === 0) return []
    
    const now = new Date()
    const startDate = new Date()
    
    if (selectedTimeRange === 'All Time') {
      return trades
    }
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.closeDate || trade.openDate)
      return tradeDate >= startDate
    })
  }, [trades, selectedTimeRange])

  // Generate symbol data from filtered trades
  const symbolsData = useMemo(() => {
    return generateSymbolsData(filteredTrades)
  }, [filteredTrades])

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 h-[480px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading symbol data...</p>
        </div>
      </div>
    )
  }

  if (!trades.length || !symbolsData.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="focus:outline-none"
      >
        <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: '480px' }}>
          {/* Header (title visible, dropdowns hidden) */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Symbol Performance
              </h3>
              <RadixTooltip.Provider>
                <RadixTooltip.Root>
                  <RadixTooltip.Trigger asChild>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <Info size={16} />
                    </button>
                  </RadixTooltip.Trigger>
                  <RadixTooltip.Portal>
                    <RadixTooltip.Content
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm max-w-xs z-50"
                      sideOffset={5}
                    >
                      Trading performance breakdown by symbol/instrument. Bar chart shows profit/loss for each traded symbol, with green bars for profitable symbols and red bars for losses. Helps identify which instruments are most/least profitable in your trading strategy.
                      <RadixTooltip.Arrow className="fill-white dark:fill-gray-800" />
                    </RadixTooltip.Content>
                  </RadixTooltip.Portal>
                </RadixTooltip.Root>
              </RadixTooltip.Provider>
            </div>
            
          </div>
          
          {/* Header Divider */}
          <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
          {/* Empty state */}
          <div className="h-[348px] flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400 text-center">
              <div>No symbol data available</div>
              <div className="text-sm mt-1">Import your CSV to see symbol performance</div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Get data based on selected metric (fixed to P&L only)
  const getChartData = () => {
    return symbolsData.map(item => ({ 
      symbol: item.symbol, 
      name: item.name,
      value: item.pnl,
      color: item.pnl >= 0 ? '#10b981' : '#ef4444'
    }))
  }

  const chartData = getChartData()

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-[#0f0f0f] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-[#2a2a2a]">
          <p className="font-medium text-gray-900 dark:text-white mb-1">
            {data.symbol} - {data.name}
          </p>
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedMetric}: {
                selectedMetric === 'P&L' || selectedMetric === 'Avg Trade' 
                  ? (isPrivacyMode ? maskCurrencyValue(data.value, true) : `$${data.value.toFixed(2)}`)
                  : selectedMetric === 'Win Rate'
                  ? `${data.value.toFixed(1)}%`
                  : data.value
              }
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  // Format Y-axis labels
  const formatYAxisLabel = (value: number) => {
    if (selectedMetric === 'P&L' || selectedMetric === 'Avg Trade') {
      return isPrivacyMode ? maskCurrencyValue(value, true) : `$${value}`
    } else if (selectedMetric === 'Win Rate') {
      return `${value}%`
    }
    return value.toString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '480px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Symbol Performance
            </h3>
            <RadixTooltip.Provider>
              <RadixTooltip.Root>
                <RadixTooltip.Trigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Info size={16} />
                  </button>
                </RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                  <RadixTooltip.Content
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm max-w-xs z-50"
                    sideOffset={5}
                  >
                    Trading performance breakdown by symbol/instrument. Bar chart shows profit/loss for each traded symbol, with green bars for profitable symbols and red bars for losses. Helps identify which instruments are most/least profitable in your trading strategy.
                    <RadixTooltip.Arrow className="fill-white dark:fill-gray-800" />
                  </RadixTooltip.Content>
                </RadixTooltip.Portal>
              </RadixTooltip.Root>
            </RadixTooltip.Provider>
          </div>
          
        </div>
        
        {/* Header Divider */}
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>

        {/* Bar Chart */}
        <div className="h-[453px] -ml-6 overflow-visible w-full" style={{ width: 'calc(100% + 24px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 5, left: 2, bottom: 60 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--grid)" 
                vertical={false}
                horizontal={true}
              />
              <XAxis 
                dataKey="symbol" 
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
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 11, 
                  fill: '#9ca3af'
                }}
                className="dark:fill-gray-400"
                tickFormatter={formatYAxisLabel}
              />
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