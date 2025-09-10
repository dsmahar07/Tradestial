'use client'

import { logger } from '@/lib/logger'

import { useState, useMemo } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { useAnalytics } from '@/hooks/use-analytics'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getYear } from '@/utils/date-utils'

// P&L thresholds for color intensity
const PNL_THRESHOLDS = {
  highProfit: 500,
  mediumProfit: 200,
  lowProfit: 50,
  breakeven: 0,
  lowLoss: -50,
  mediumLoss: -200,
  highLoss: -500
}

// Generate real trading data for heatmap from imported trades
const generateRealTradingData = (trades: any[], year: number) => {
  const data: Record<string, { pnl: number; trades: number }> = {}
  
  if (!trades?.length) return data

  // Filter trades for the specified year and group by date
  trades.forEach(trade => {
    const tradeYear = getYear(trade.openDate)
    
    if (tradeYear === year) {
      const dateKey = trade.openDate.split('T')[0] // YYYY-MM-DD format
      
      if (!data[dateKey]) {
        data[dateKey] = { pnl: 0, trades: 0 }
      }
      
      data[dateKey].pnl += trade.netPnl
      data[dateKey].trades += 1
    }
  })

  return data
}

export default function CalendarPage() {
  usePageTitle('Analytics - Calendar')
  
  // Get real trade data
  const { trades, loading, error } = useAnalytics()
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const tradingData = useMemo(() => generateRealTradingData(trades || [], selectedYear), [trades, selectedYear])
  
  const handleTabChange = (tabId: string) => {
    logger.debug('Active tab:', tabId)
  }

  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    logger.debug(`Selected ${itemId} from ${tabId} tab`)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get border color based on P&L using configuration
  const getBorderColor = (pnl: number, hasData: boolean = true) => {
    if (!hasData) return 'border border-gray-200 dark:border-[#2a2a2a]'
    
    if (pnl > PNL_THRESHOLDS.highProfit) return 'border border-emerald-500'
    if (pnl > PNL_THRESHOLDS.mediumProfit) return 'border border-emerald-400'
    if (pnl > PNL_THRESHOLDS.lowProfit) return 'border border-emerald-300'
    if (pnl > PNL_THRESHOLDS.breakeven) return 'border border-emerald-200'
    if (pnl === PNL_THRESHOLDS.breakeven) return 'border border-gray-300 dark:border-[#2a2a2a]'
    if (pnl > PNL_THRESHOLDS.lowLoss) return 'border border-rose-200'
    if (pnl > PNL_THRESHOLDS.mediumLoss) return 'border border-rose-300'
    if (pnl > PNL_THRESHOLDS.highLoss) return 'border border-rose-400'
    return 'border border-rose-500'
  }

  // Get text color for cells
  const getTextColor = (pnl: number, hasData: boolean = true) => {
    if (!hasData) return 'text-gray-400 dark:text-gray-600'
    return 'text-gray-700 dark:text-gray-200'
  }

  // Get calendar days for a specific month
  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = tradingData[dateKey]
      days.push({
        day,
        dateKey,
        pnl: dayData?.pnl || 0,
        trades: dayData?.trades || 0,
        hasData: !!dayData
      })
    }

    return days
  }

  // Calculate monthly summary statistics
  const getMonthSummary = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let totalPnl = 0
    let totalTrades = 0
    let tradingDays = 0
    let winningDays = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = tradingData[dateKey]
      
      if (dayData) {
        totalPnl += dayData.pnl
        totalTrades += dayData.trades
        tradingDays++
        if (dayData.pnl > 0) winningDays++
      }
    }

    return {
      totalPnl,
      totalTrades,
      tradingDays,
      winningDays,
      winRate: tradingDays > 0 ? (winningDays / tradingDays) * 100 : 0,
      avgDailyPnl: tradingDays > 0 ? totalPnl / tradingDays : 0
    }
  }

  // Calculate yearly summary
  const getYearSummary = (year: number) => {
    let totalPnl = 0
    let totalTrades = 0
    let tradingDays = 0
    let winningDays = 0

    for (let month = 0; month < 12; month++) {
      const monthSummary = getMonthSummary(year, month)
      totalPnl += monthSummary.totalPnl
      totalTrades += monthSummary.totalTrades
      tradingDays += monthSummary.tradingDays
      winningDays += monthSummary.winningDays
    }

    return {
      totalPnl,
      totalTrades,
      tradingDays,
      winningDays,
      winRate: tradingDays > 0 ? (winningDays / tradingDays) * 100 : 0,
      avgDailyPnl: tradingDays > 0 ? totalPnl / tradingDays : 0
    }
  }

  const yearSummary = getYearSummary(selectedYear)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#0f0f0f]">
          <AnalyticsTabNavigation 
            tabs={analyticsNavigationConfig.map(tab => ({
              ...tab,
              isActive: tab.id === 'calendar'
            }))}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
          <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Calendar</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Daily trading performance heatmap across {selectedYear}
                </p>
              </div>
              
              {/* Year Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedYear(prev => prev - 1)}
                  className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="text-xl font-semibold text-gray-900 dark:text-white min-w-[80px] text-center">
                  {selectedYear}
                </div>
                <button
                  onClick={() => setSelectedYear(prev => prev + 1)}
                  className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Loading / Error / Empty States */}
            {loading && (
              <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">Loading calendar data...</div>
            )}
            {error && !loading && (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
            
            {/* No Data State */}
            {!loading && !error && (!trades || trades.length === 0) && (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No trading data available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Import your CSV file to view your trading calendar
                </p>
                <button 
                  onClick={() => window.location.href = '/import-data'}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Import Trading Data
                </button>
              </div>
            )}

            {/* Year Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-5 shadow-sm">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Total P&L</div>
                <div className={cn(
                  "text-xl font-bold",
                  yearSummary.totalPnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  ${yearSummary.totalPnl.toFixed(0)}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {yearSummary.totalPnl >= 0 ? '↗' : '↘'} {selectedYear}
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-5 shadow-sm">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Trading Days</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {yearSummary.tradingDays}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  of {(selectedYear % 4 === 0 && selectedYear % 100 !== 0) || selectedYear % 400 === 0 ? 366 : 365} days
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-5 shadow-sm">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Win Rate</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {yearSummary.winRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {yearSummary.winningDays} winning days
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-5 shadow-sm">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Avg Daily P&L</div>
                <div className={cn(
                  "text-xl font-bold",
                  yearSummary.avgDailyPnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  ${yearSummary.avgDailyPnl.toFixed(0)}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  per trading day
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {monthNames.map((monthName, monthIndex) => {
                const calendarDays = getCalendarDays(selectedYear, monthIndex)
                const monthSummary = getMonthSummary(selectedYear, monthIndex)
                
                return (
                  <div key={monthIndex} className="bg-white dark:bg-[#0f0f0f] rounded-lg p-3 shadow-sm">
                    {/* Month Header */}
                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white text-center">
                        {monthName.slice(0, 3)}
                      </h3>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {dayAbbreviations.map(day => (
                        <div key={day} className="text-center text-xs text-gray-400 dark:text-gray-500 py-0.5">
                          {day.slice(0, 1)}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {calendarDays.map((dayData, index) => (
                        <div
                          key={index}
                          className={cn(
                            "aspect-square flex items-center justify-center text-xs font-medium rounded relative group cursor-pointer transition-all duration-150 bg-white dark:bg-[#0f0f0f]",
                            dayData
                              ? `${getBorderColor(dayData.pnl, dayData.hasData)} ${getTextColor(dayData.pnl, dayData.hasData)} hover:opacity-80`
                              : "border border-gray-100 dark:border-[#2a2a2a]"
                          )}
                          title={dayData 
                            ? dayData.hasData 
                              ? `${dayData.dateKey}: ${dayData.trades} trades, $${dayData.pnl.toFixed(0)} P&L`
                              : `${dayData.dateKey}: No trades`
                            : ""
                          }
                        >
                          {dayData && (
                            <>
                              {dayData.day}
                              {dayData.hasData && dayData.trades > 0 && (
                                <div className="absolute -top-px -right-px w-1 h-1 bg-blue-500 rounded-full">
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Month Summary */}
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {monthSummary.tradingDays}d
                        </span>
                        <span className={cn(
                          "font-medium",
                          monthSummary.totalPnl >= 0 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-rose-600 dark:text-rose-400"
                        )}>
                          ${monthSummary.totalPnl.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Performance Legend</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Daily P&L Border Colors</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-white dark:bg-[#0f0f0f] rounded border border-rose-500"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">${PNL_THRESHOLDS.highLoss}+</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-white dark:bg-[#0f0f0f] rounded border border-rose-400"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">${PNL_THRESHOLDS.mediumLoss}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-white dark:bg-[#0f0f0f] rounded border border-rose-200"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">${PNL_THRESHOLDS.lowLoss}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-white dark:bg-[#0f0f0f] rounded border border-gray-300 dark:border-[#2a2a2a]"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">${PNL_THRESHOLDS.breakeven}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-white dark:bg-[#0f0f0f] rounded border border-emerald-200"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">+${PNL_THRESHOLDS.lowProfit}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-white dark:bg-[#0f0f0f] rounded border border-emerald-400"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">+${PNL_THRESHOLDS.mediumProfit}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-white dark:bg-[#0f0f0f] rounded border border-emerald-500"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">+${PNL_THRESHOLDS.highProfit}+</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Trading activity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-white dark:bg-[#0f0f0f] rounded border border-gray-200 dark:border-[#2a2a2a]"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">No trades</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}