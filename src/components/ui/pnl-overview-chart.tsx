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
import { BudgetIncomeIcon, BudgetExpensesIcon, BudgetScheduledIcon, PNLOverviewIcon } from './custom-icons'
import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { parseLocalDate, getMonth, getYear } from '@/utils/date-utils'

interface PNLData {
  month: string
  peakProfit: number
  peakLoss: number
  bookedPnl: number
}


export function PnlOverviewChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<'Last Year' | 'This Year' | 'Last Month'>('This Year')
  const [trades, setTrades] = useState<Trade[]>([])

  // Load trades and subscribe to changes
  useEffect(() => {
    setTrades(DataStore.getAllTrades())
    const unsubscribe = DataStore.subscribe(() => {
      setTrades(DataStore.getAllTrades())
    })
    return unsubscribe
  }, [])

  // Generate real PnL data from trades
  const realPnlData = useMemo(() => {
    if (!trades.length) return []

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Filter trades based on selected period
    const filteredTrades = trades.filter(trade => {
      const tradeDate = parseLocalDate(trade.closeDate || trade.openDate)
      const tradeYear = getYear(tradeDate)
      const tradeMonth = getMonth(tradeDate)

      switch (selectedPeriod) {
        case 'Last Year':
          return tradeYear === currentYear - 1
        case 'This Year':
          return tradeYear === currentYear
        case 'Last Month':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
          return tradeYear === lastMonthYear && tradeMonth === lastMonth
        default:
          return tradeYear === currentYear
      }
    })

    // Group by month
    const monthlyData = new Map<string, { wins: number, losses: number, total: number }>()
    const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

    // Initialize all months with 0
    monthNames.forEach(month => {
      monthlyData.set(month, { wins: 0, losses: 0, total: 0 })
    })

    // Process trades
    filteredTrades.forEach(trade => {
      const tradeDate = parseLocalDate(trade.closeDate || trade.openDate)
      const monthIndex = getMonth(tradeDate)
      const monthKey = monthNames[monthIndex]
      const monthStats = monthlyData.get(monthKey)!

      monthStats.total += trade.netPnl
      if (trade.netPnl > 0) {
        monthStats.wins += trade.netPnl
      } else {
        monthStats.losses += Math.abs(trade.netPnl)
      }
    })

    // Convert to chart format
    return Array.from(monthlyData.entries()).map(([month, stats]) => ({
      month,
      peakProfit: Math.max(0, stats.wins),
      peakLoss: Math.max(0, stats.losses), 
      bookedPnl: Math.max(0, stats.total)
    }))
  }, [trades, selectedPeriod])

  // Get current data (real or empty)
  const currentData = realPnlData.length > 0 ? realPnlData : []

  if (!trades.length) {
    return (
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6"
      style={{ height: '432px' }}
    >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">P&L Overview</h3>
        </div>umulative P&L
        
        {/* Header Divider */}
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div>No P&L data available</div>
            <div className="text-sm mt-1">Import your CSV to see monthly performance</div>
          </div>
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '432px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <PNLOverviewIcon size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PNL Overview</h3>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Legend */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Peak Profit</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Peak Loss</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#3559E9]"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Booked PNL</span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-white dark:bg-[#0f0f0f] border-0 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm !h-5 !min-h-0 px-2 text-xs"
                >
                  <span>{selectedPeriod}</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] shadow-lg min-w-[120px]"
              >
                <DropdownMenuItem 
                  className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#171717] cursor-pointer"
                  onClick={() => setSelectedPeriod('Last Year')}
                >
                  Last Year
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#171717] cursor-pointer"
                  onClick={() => setSelectedPeriod('This Year')}
                >
                  This Year
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#171717] cursor-pointer"
                  onClick={() => setSelectedPeriod('Last Month')}
                >
                  Last Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Header Divider */}
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>

        {/* Chart Container */}
        <div className="h-[405px] -ml-6 overflow-visible" style={{ width: 'calc(100% + 24px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentData}
              margin={{ top: 20, right: 5, left: -10, bottom: 60 }}
              barGap={4}
              barCategoryGap="20%"
            >
              <XAxis 
                dataKey="month"
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
                tick={{ 
                  fontSize: 11, 
                  fill: '#9ca3af'
                }}
                className="dark:fill-gray-400"
                scale="linear"
                allowDecimals={false}
                tickFormatter={(value) => {
                  if (value === 0) return '$0'
                  if (Math.abs(value) >= 1000) {
                    return `$${(value / 1000).toFixed(1)}k`
                  }
                  return `$${value}`
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  
                  return (
                    <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {label}
                      </div>
                      {payload.map((entry, index) => {
                        let formattedValue: string
                        const value = entry.value as number
                        if (value === 0) {
                          formattedValue = '$0'
                        } else if (Math.abs(value) >= 1000) {
                          formattedValue = `$${(value / 1000).toFixed(1)}k`
                        } else {
                          formattedValue = `$${value.toLocaleString()}`
                        }
                        
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-700 dark:text-gray-300">
                              {entry.name}: {formattedValue}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                }}
              />
              <Bar 
                dataKey="peakProfit" 
                fill="url(#emeraldGradient)"
                name="Peak Profit"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
              />
              <Bar 
                dataKey="peakLoss" 
                fill="url(#redGradient)"
                name="Peak Loss"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationBegin={200}
                animationDuration={1200}
              />
              <Bar 
                dataKey="bookedPnl" 
                fill="#3559E9"
                name="Booked PNL"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationBegin={400}
                animationDuration={1200}
              />
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f87171" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}