'use client'

import { logger } from '@/lib/logger'

import { motion } from 'framer-motion'
import { ChevronDown, MoreHorizontal, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { cn } from '@/lib/utils'
import { useState, useEffect, useMemo } from 'react'
import { DataStore } from '@/services/data-store.service'
import { Trade as RealTrade } from '@/services/trade-data.service'
import { calculateTradeDuration } from '@/utils/duration'
import { usePrivacy } from '@/contexts/privacy-context'
import { maskCurrencyValue, maskPercentageValue } from '@/utils/privacy'

interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  entryPrice: number
  exitPrice: number
  pnl: number
  pnlPercentage: number
  timestamp: string
  duration: string
  status: 'CLOSED' | 'OPEN'
}

// Sample trading data
const recentTrades: Trade[] = [
  {
    id: '1',
    symbol: 'AAPL',
    type: 'BUY',
    quantity: 100,
    entryPrice: 185.50,
    exitPrice: 187.25,
    pnl: 175.00,
    pnlPercentage: 0.94,
    timestamp: '2 mins ago',
    duration: '1h 23m',
    status: 'CLOSED'
  },
  {
    id: '2',
    symbol: 'TSLA',
    type: 'SELL',
    quantity: 50,
    entryPrice: 242.80,
    exitPrice: 238.45,
    pnl: 217.50,
    pnlPercentage: 1.79,
    timestamp: '8 mins ago',
    duration: '45m',
    status: 'CLOSED'
  },
  {
    id: '3',
    symbol: 'NVDA',
    type: 'BUY',
    quantity: 25,
    entryPrice: 425.30,
    exitPrice: 422.15,
    pnl: -78.75,
    pnlPercentage: -0.74,
    timestamp: '15 mins ago',
    duration: '2h 15m',
    status: 'CLOSED'
  },
  {
    id: '4',
    symbol: 'SPY',
    type: 'BUY',
    quantity: 200,
    entryPrice: 445.20,
    exitPrice: 447.80,
    pnl: 520.00,
    pnlPercentage: 0.58,
    timestamp: '23 mins ago',
    duration: '3h 7m',
    status: 'CLOSED'
  },
  {
    id: '5',
    symbol: 'MSFT',
    type: 'BUY',
    quantity: 75,
    entryPrice: 378.90,
    exitPrice: 376.20,
    pnl: -202.50,
    pnlPercentage: -0.71,
    timestamp: '31 mins ago',
    duration: '1h 52m',
    status: 'CLOSED'
  },
  {
    id: '6',
    symbol: 'AMZN',
    type: 'SELL',
    quantity: 30,
    entryPrice: 155.75,
    exitPrice: 158.90,
    pnl: 94.50,
    pnlPercentage: 2.02,
    timestamp: '45 mins ago',
    duration: '25m',
    status: 'CLOSED'
  },
  {
    id: '7',
    symbol: 'GOOGL',
    type: 'BUY',
    quantity: 40,
    entryPrice: 142.30,
    exitPrice: 144.85,
    pnl: 102.00,
    pnlPercentage: 1.79,
    timestamp: '1h 2m ago',
    duration: '4h 18m',
    status: 'CLOSED'
  },
  {
    id: '8',
    symbol: 'META',
    type: 'BUY',
    quantity: 60,
    entryPrice: 485.20,
    exitPrice: 482.75,
    pnl: -147.00,
    pnlPercentage: -0.50,
    timestamp: '1h 15m ago',
    duration: '2h 33m',
    status: 'CLOSED'
  }
]

const timeRanges = ['Today', 'Last 7 Days', 'Last Month', 'All Time']

export function RecentTradesTable() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('Today')
  const [trades, setTrades] = useState<RealTrade[]>([])
  const { isPrivacyMode } = usePrivacy()

  // Load trades and subscribe to changes
  useEffect(() => {
    const initialTrades = DataStore.getAllTrades()
    logger.debug('🔍 Recent Trades Table - Initial load:', initialTrades.length)
    setTrades(initialTrades)
    
    const unsubscribe = DataStore.subscribe(() => {
      const updatedTrades = DataStore.getAllTrades()
      logger.debug('🔍 Recent Trades Table - Data update received:', updatedTrades.length)
      setTrades(updatedTrades)
    })
    return unsubscribe
  }, [])

  // Convert real trades to display format
  const recentTrades = useMemo(() => {
    logger.debug('🔍 Recent Trades Table - Processing trades:', trades.length)
    
    logger.debug('🔍 Processing trades:', trades.length)
    
    const processedTrades = trades
      .sort((a, b) => new Date(b.closeDate || b.openDate).getTime() - new Date(a.closeDate || a.openDate).getTime())
      .map((trade, index): Trade => ({
        id: trade.id, // Use the original unique ID from parser
        symbol: trade.symbol,
        type: (trade.side === 'LONG' ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
        quantity: trade.contractsTraded || 1,
        entryPrice: trade.entryPrice || 0,
        exitPrice: trade.exitPrice || 0,
        pnl: trade.netPnl,
        pnlPercentage: trade.netRoi || 0,
        timestamp: formatTimestamp(trade.closeDate || trade.openDate),
        duration: (() => {
          // Prefer persisted duration from import (more stable and consistent across views)
          if (trade.duration && typeof trade.duration === 'string') return trade.duration

          const durationResult = calculateTradeDuration(trade.entryTime, trade.exitTime, trade.openDate, trade.closeDate)
          const formatted = durationResult?.formatted || 'N/A'

          // Debug only when clearly excessive
          if (durationResult && durationResult.totalMinutes > 12 * 60) {
            logger.warn('⚠️ Long duration detected in RecentTradesTable:', {
              tradeId: trade.id,
              symbol: trade.symbol,
              entryTime: trade.entryTime,
              exitTime: trade.exitTime,
              openDate: trade.openDate,
              closeDate: trade.closeDate,
              minutes: durationResult.totalMinutes,
              formatted
            })
          }

          return formatted
        })(),
        status: 'CLOSED' as const
      }))
    
    logger.debug('🔍 Final processed trades for table:', processedTrades.length)
    return processedTrades
  }, [trades])

  // Helper functions
  function formatTimestamp(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  }


  const formatCurrency = (amount: number) => {
    if (isPrivacyMode) {
      return maskCurrencyValue(amount, true)
    }
    const sign = amount >= 0 ? '+' : ''
    return `${sign}$${Math.abs(amount).toFixed(2)}`
  }

  const formatPercentage = (percentage: number) => {
    if (isPrivacyMode) {
      return maskPercentageValue(percentage, true)
    }
    const sign = percentage >= 0 ? '+' : ''
    return `${sign}${percentage.toFixed(2)}%`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.0 }}
      className="focus:outline-none h-full"
    >
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none h-[870px] flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Trades
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-white dark:bg-[#0f0f0f] border-0 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm !h-5 !min-h-0 px-2 text-xs"
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

        {/* Table */}
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Qty
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Close Date
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  P&L
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade, index) => (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-200 dark:border-[#2a2a2a]"
                >
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        trade.pnl >= 0 ? "bg-green-500" : "bg-red-500"
                      )} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {trade.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                      trade.type === 'BUY' 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{trade.quantity}</span>
                  </td>
                  <td className="py-4 px-2 text-right text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{trade.timestamp}</span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex flex-col items-end">
                      <span 
                        className="text-sm font-medium"
                        style={{
                          color: trade.pnl >= 0 ? "#10b981" : "#ef4444"
                        }}
                      >
                        {formatCurrency(trade.pnl)}
                      </span>
                      <span 
                        className="text-xs"
                        style={{
                          color: trade.pnl >= 0 ? "#10b981" : "#ef4444"
                        }}
                      >
                        {formatPercentage(trade.pnlPercentage)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex items-center justify-end space-x-1 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{trade.duration}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>


      </div>
    </motion.div>
  )
}