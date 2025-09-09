'use client'

import { motion } from 'framer-motion'
import { BudgetIncomeIcon, BudgetExpensesIcon, BudgetScheduledIcon, PNLOverviewIcon } from './custom-icons'
import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { parseLocalDate, getMonth, getYear } from '@/utils/date-utils'
import { Info } from 'lucide-react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { usePrivacy } from '@/contexts/privacy-context'
import { maskCurrencyValue } from '@/utils/privacy'

interface PNLData {
  month: string
  peakProfit: number
  peakLoss: number
  bookedPnl: number
}


export function PnlOverviewChart() {
  const [trades, setTrades] = useState<Trade[]>([])
  const { isPrivacyMode } = usePrivacy()

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
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Group by month and year - only include months with actual trades
    const monthlyData = new Map<string, { wins: number, losses: number, total: number, monthIndex: number, year: number, isCurrentMonth: boolean }>()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Process trades and only add months that have trades
    trades.forEach(trade => {
      const tradeDate = parseLocalDate(trade.closeDate || trade.openDate)
      const monthIndex = getMonth(tradeDate)
      const year = getYear(tradeDate)
      const monthKey = `${monthNames[monthIndex]} ${year}`
      const isCurrentMonth = monthIndex === currentMonth && year === currentYear
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { wins: 0, losses: 0, total: 0, monthIndex, year, isCurrentMonth })
      }
      
      const monthStats = monthlyData.get(monthKey)!
      
      if (trade.netPnl > 0) {
        monthStats.wins += trade.netPnl  // Peak Profit = sum of all winning trades
      } else {
        monthStats.losses += Math.abs(trade.netPnl)  // Peak Loss = sum of all losing trades
      }
    })

    // Convert to chart format and sort by chronological order (year first, then month)
    return Array.from(monthlyData.entries())
      .map(([month, stats]) => ({
        month: month.split(' ')[0], // Just show month name for display
        fullMonth: month, // Keep full month+year for sorting
        peakProfit: stats.wins,  // All winning trades combined
        peakLoss: stats.losses,  // All losing trades combined
        bookedPnl: stats.wins - stats.losses,  // Peak Profit - Peak Loss
        monthIndex: stats.monthIndex,
        year: stats.year,
        isCurrentMonth: stats.isCurrentMonth
      }))
      .sort((a, b) => {
        // Sort by year first, then by month
        if (a.year !== b.year) return a.year - b.year
        return a.monthIndex - b.monthIndex
      })
  }, [trades])

  // Get current data (real or empty)
  const currentData = realPnlData.length > 0 ? realPnlData : []

  // Show empty state if no trades or no data for selected period
  if (!trades.length || currentData.length === 0) {
    return (
      <RadixTooltip.Provider delayDuration={400}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6"
          style={{ height: '432px' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">P&L Overview</h3>
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
                    Monthly P&L breakdown showing your trading performance. Green bars show total profits, red bars show total losses, and blue bars display net P&L for each month. Track your consistency and growth over time.
                    <RadixTooltip.Arrow className="fill-white dark:fill-[#0f0f0f]" />
                  </RadixTooltip.Content>
                </RadixTooltip.Portal>
              </RadixTooltip.Root>
            </div>
          </div>
          
          {/* Header Divider */}
          <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
          
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div>No P&L data available</div>
              <div className="text-sm mt-1">Import your CSV to see monthly performance</div>
            </div>
          </div>
        </motion.div>
      </RadixTooltip.Provider>
    )
  }
  
  return (
    <RadixTooltip.Provider delayDuration={400}>
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
                    Monthly P&L breakdown showing your trading performance. Green bars show total profits, red bars show total losses, and blue bars display net P&L for each month. Track your consistency and growth over time.
                    <RadixTooltip.Arrow className="fill-white dark:fill-[#0f0f0f]" />
                  </RadixTooltip.Content>
                </RadixTooltip.Portal>
              </RadixTooltip.Root>
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
                <span className="text-xs text-gray-600 dark:text-gray-400">PNL</span>
              </div>
            </div>
            
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
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => {
                  if (isPrivacyMode) {
                    return maskCurrencyValue(value, true)
                  }
                  if (value === 0) return '$0'
                  const absValue = Math.abs(value)
                  if (absValue >= 1000) {
                    return `${value < 0 ? '-' : ''}$${(absValue / 1000).toFixed(1)}k`
                  }
                  return `${value < 0 ? '-' : ''}$${absValue}`
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  
                  // Find the data point to check if it's current month
                  const dataPoint = currentData.find(d => d.month === label)
                  const isCurrentMonth = dataPoint?.isCurrentMonth || false
                  
                  return (
                    <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {label}
                      </div>
                      {payload.map((entry, index) => {
                        let formattedValue: string
                        const value = entry.value as number
                        
                        if (isPrivacyMode) {
                          formattedValue = maskCurrencyValue(value, true)
                        } else if (value === 0) {
                          formattedValue = '$0'
                        } else if (Math.abs(value) >= 1000) {
                          formattedValue = `$${(value / 1000).toFixed(1)}k`
                        } else {
                          formattedValue = `$${value.toLocaleString()}`
                        }
                        
                        // Dynamic label based on current month
                        let displayName = entry.name as string
                        if (entry.dataKey === 'bookedPnl') {
                          displayName = isCurrentMonth ? 'Current PNL' : 'Booked PNL'
                        }
                        
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-700 dark:text-gray-300">
                              {displayName}: {formattedValue}
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
                name="PNL"
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
    </RadixTooltip.Provider>
  )
}