'use client'

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
import { useState } from 'react'

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
  const [visibleTrades, setVisibleTrades] = useState(6)
  
  const showMoreTrades = () => {
    setVisibleTrades(prev => Math.min(prev + 3, recentTrades.length))
  }

  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : ''
    return `${sign}$${Math.abs(amount).toFixed(2)}`
  }

  const formatPercentage = (percentage: number) => {
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
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none h-full flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Trades
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Latest trading activity
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
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

        {/* Table */}
        <div className="overflow-x-auto flex-1 min-h-0">
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
                  Entry
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Exit
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  P&L
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentTrades.slice(0, visibleTrades).map((trade, index) => (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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
                    {trade.quantity}
                  </td>
                  <td className="py-4 px-2 text-right text-sm text-gray-600 dark:text-gray-300">
                    ${trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="py-4 px-2 text-right text-sm text-gray-600 dark:text-gray-300">
                    ${trade.exitPrice.toFixed(2)}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-sm font-medium",
                        trade.pnl >= 0 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {formatCurrency(trade.pnl)}
                      </span>
                      <span className={cn(
                        "text-xs",
                        trade.pnl >= 0 
                          ? "text-green-500 dark:text-green-400" 
                          : "text-red-500 dark:text-red-400"
                      )}>
                        {formatPercentage(trade.pnlPercentage)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex flex-col items-end text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{trade.timestamp}</span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500">
                        {trade.duration}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Show More Button */}
        {visibleTrades < recentTrades.length && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={showMoreTrades}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Show More Trades ({recentTrades.length - visibleTrades} remaining)
            </Button>
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {recentTrades.filter(t => t.pnl > 0).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Winning Trades</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {recentTrades.filter(t => t.pnl < 0).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Losing Trades</div>
            </div>
            <div>
              <div className={cn(
                "text-lg font-semibold",
                recentTrades.reduce((sum, t) => sum + t.pnl, 0) >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(recentTrades.reduce((sum, t) => sum + t.pnl, 0))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total P&L</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}