'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
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
  Cell
} from 'recharts'
import { useState, useMemo, useEffect } from 'react'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'

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
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Month')
  const [selectedMetric, setSelectedMetric] = useState('P&L')
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  // Load trades and subscribe to changes
  useEffect(() => {
    const loadData = () => {
      try {
        const allTrades = DataStore.getAllTrades()
        setTrades(allTrades)
      } catch (error) {
        console.error('Failed to load trades for symbol performance:', error)
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
    
    switch (selectedTimeRange) {
      case 'Today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'This Week':
        startDate.setDate(now.getDate() - 7)
        break  
      case 'This Month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'All Time':
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
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading symbol data...</p>
        </div>
      </div>
    )
  }

  if (!trades.length || !symbolsData.length) {
    return (
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 h-96 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-center">
          <div>No symbol data available</div>
          <div className="text-sm mt-1">Import your CSV to see symbol performance</div>
        </div>
      </div>
    )
  }

  // Get data based on selected metric
  const getChartData = () => {
    switch (selectedMetric) {
      case 'P&L':
        return symbolsData.map(item => ({ 
          symbol: item.symbol, 
          name: item.name,
          value: item.pnl,
          color: item.pnl >= 0 ? '#10b981' : '#ef4444'
        }))
      case 'Trade Count':
        return symbolsData.map(item => ({ 
          symbol: item.symbol, 
          name: item.name,
          value: item.trades,
          color: '#3b82f6'
        }))
      case 'Win Rate':
        return symbolsData.map(item => ({ 
          symbol: item.symbol, 
          name: item.name,
          value: item.winRate,
          color: item.winRate >= 50 ? '#10b981' : '#f59e0b'
        }))
      case 'Avg Trade':
        return symbolsData.map(item => ({ 
          symbol: item.symbol, 
          name: item.name,
          value: item.avgTrade,
          color: item.avgTrade >= 0 ? '#10b981' : '#ef4444'
        }))
      default:
        return []
    }
  }

  const chartData = getChartData()

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-[#171717] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-[#2a2a2a]">
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
                  ? `$${data.value.toFixed(2)}`
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
      return `$${value}`
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
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: '385px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Symbol Performance
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
                >
                  <span>{selectedMetric}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {metrics.map((metric) => (
                  <DropdownMenuItem
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={selectedMetric === metric ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  >
                    {metric}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
                >
                  <span>{selectedTimeRange}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {timeRanges.map((range) => (
                  <DropdownMenuItem
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={selectedTimeRange === range ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  >
                    {range}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 5, left: -10, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                className="dark:stroke-gray-600"
                vertical={false}
              />
              <XAxis 
                dataKey="symbol" 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 12, 
                  fill: '#9ca3af',
                  fontWeight: 600
                }}
                className="dark:fill-gray-400"
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