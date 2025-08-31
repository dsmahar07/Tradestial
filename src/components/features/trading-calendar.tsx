'use client'

import { useState, useMemo } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'

// Custom Trading Calendar Icon - High Quality Dashboard Style
const TradingCalendarIcon = ({ className = "", size = 24 }: { className?: string, size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="calendarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="calendarGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
      </linearGradient>
    </defs>
    
    {/* Calendar base */}
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      fill="url(#calendarGrad)"
      fillOpacity="0.15"
      stroke="url(#calendarGrad)"
      strokeWidth="2"
    />
    
    {/* Glass effect */}
    <rect
      x="3"
      y="5"
      width="18"
      height="8"
      rx="2"
      fill="url(#calendarGlass)"
    />
    
    {/* Calendar header */}
    <rect
      x="3"
      y="5"
      width="18"
      height="4"
      rx="2"
      fill="url(#calendarGrad)"
      fillOpacity="0.3"
    />
    
    {/* Calendar rings */}
    <rect x="7" y="2" width="1.5" height="4" rx="0.75" fill="url(#calendarGrad)" />
    <rect x="15.5" y="2" width="1.5" height="4" rx="0.75" fill="url(#calendarGrad)" />
    
    {/* Trading P&L heatmap dots */}
    <circle cx="7" cy="12" r="1.2" fill="#10b981" fillOpacity="0.8" />
    <circle cx="11" cy="12" r="1.2" fill="#ef4444" fillOpacity="0.8" />
    <circle cx="15" cy="12" r="1.2" fill="#10b981" fillOpacity="0.8" />
    <circle cx="19" cy="12" r="1.2" fill="#f59e0b" fillOpacity="0.6" />
    
    <circle cx="7" cy="15" r="1.2" fill="#10b981" fillOpacity="0.6" />
    <circle cx="11" cy="15" r="1.2" fill="#10b981" fillOpacity="0.8" />
    <circle cx="15" cy="15" r="1.2" fill="#ef4444" fillOpacity="0.6" />
    <circle cx="19" cy="15" r="1.2" fill="#10b981" fillOpacity="0.4" />
    
    <circle cx="7" cy="18" r="1.2" fill="#ef4444" fillOpacity="0.4" />
    <circle cx="11" cy="18" r="1.2" fill="#10b981" fillOpacity="0.9" />
    <circle cx="15" cy="18" r="1.2" fill="#10b981" fillOpacity="0.7" />
    
    {/* Trending upward indicator */}
    <path
      d="M18 7L20 5L22 7"
      stroke="url(#calendarGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 5V8"
      stroke="url(#calendarGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

// Trading data interface
interface DayData {
  date: string
  pnl: number
  trades: number
  winRate: number
  isTrading: boolean
}

interface MonthStats {
  month: string
  netPnl: number
  winRate: number
  tradingDays: number
  totalTrades: number
}

// Generate mock trading data for the year
const generateYearData = (year: number): Record<string, DayData> => {
  const data: Record<string, DayData> = {}
  const startDate = new Date(year, 0, 1) // January 1 of selected year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  const daysInYear = isLeapYear ? 366 : 365
  
  for (let i = 0; i < daysInYear; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    
    // Skip weekends (assuming no trading on weekends)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isTrading = !isWeekend && Math.random() > 0.3 // 70% chance of trading on weekdays
    
    if (isTrading) {
      const trades = Math.floor(Math.random() * 10) + 1
      const winRate = Math.random() * 100
      const pnl = (Math.random() - 0.4) * 2000 // Slightly positive bias
      
      data[dateStr] = {
        date: dateStr,
        pnl: Math.round(pnl * 100) / 100,
        trades,
        winRate: Math.round(winRate),
        isTrading: true
      }
    } else {
      data[dateStr] = {
        date: dateStr,
        pnl: 0,
        trades: 0,
        winRate: 0,
        isTrading: false
      }
    }
  }
  
  return data
}

// Get color class based on P&L
const getPnlColor = (pnl: number, isTrading: boolean): string => {
  if (!isTrading) return 'bg-gray-100 dark:bg-gray-800'
  
  if (pnl > 500) return 'bg-green-500'
  if (pnl > 200) return 'bg-green-400'
  if (pnl > 50) return 'bg-green-300'
  if (pnl > 0) return 'bg-green-200'
  if (pnl === 0) return 'bg-yellow-200'
  if (pnl > -50) return 'bg-red-200'
  if (pnl > -200) return 'bg-red-300'
  if (pnl > -500) return 'bg-red-400'
  return 'bg-red-500'
}

// Month component
interface MonthCalendarProps {
  year: number
  month: number
  data: Record<string, DayData>
  stats: MonthStats
}

const MonthCalendar = ({ year, month, data, stats }: MonthCalendarProps) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  
  // Create calendar grid
  const calendarDays = []
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    const dayData = data[dateStr]
    
    calendarDays.push({
      day,
      dateStr,
      data: dayData
    })
  }
  
  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-lg shadow-sm p-4">
      {/* Month Header */}
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
          {monthNames[month]} {year}
        </h3>
        
        {/* Month Stats */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center space-x-2">
            {stats.netPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={cn(
              "font-medium",
              stats.netPnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toLocaleString()}
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {stats.winRate}% WR • {stats.tradingDays} days
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className="h-6 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayInfo, index) => {
          if (!dayInfo) {
            return <div key={index} className="h-8" />
          }
          
          const { day, data: dayData } = dayInfo
          const colorClass = getPnlColor(dayData?.pnl || 0, dayData?.isTrading || false)
          
          return (
            <Tooltip.Root key={index} delayDuration={200}>
              <Tooltip.Trigger asChild>
                <div
                  className={cn(
                    "h-8 w-8 flex items-center justify-center text-xs font-medium rounded cursor-pointer transition-all hover:scale-105 hover:z-10 relative",
                    colorClass,
                    dayData?.isTrading ? "text-white shadow-sm" : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {day}
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="top"
                  className="z-50 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-md"
                  sideOffset={5}
                >
                  <div className="text-center">
                    <div className="font-medium">{monthNames[month]} {day}, {year}</div>
                    {dayData?.isTrading ? (
                      <>
                        <div className={cn(
                          "text-lg font-bold",
                          dayData.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {dayData.pnl >= 0 ? '+' : ''}${dayData.pnl}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {dayData.trades} trades • {dayData.winRate}% WR
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400">No trading</div>
                    )}
                  </div>
                  <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )
        })}
      </div>
    </div>
  )
}

// Main Trading Calendar Component
export const TradingCalendar = () => {
  const [selectedYear, setSelectedYear] = useState(2024)
  const yearData = useMemo(() => generateYearData(selectedYear), [selectedYear])
  
  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const stats: MonthStats[] = []
    
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(selectedYear, month, 1).toLocaleDateString('en-US', { month: 'long' })
      const monthData = Object.values(yearData).filter(day => {
        const date = new Date(day.date)
        return date.getFullYear() === selectedYear && date.getMonth() === month && day.isTrading
      })
      
      const netPnl = monthData.reduce((sum, day) => sum + day.pnl, 0)
      const totalTrades = monthData.reduce((sum, day) => sum + day.trades, 0)
      const winningDays = monthData.filter(day => day.pnl > 0).length
      const winRate = monthData.length > 0 ? Math.round((winningDays / monthData.length) * 100) : 0
      
      stats.push({
        month: monthName,
        netPnl: Math.round(netPnl * 100) / 100,
        winRate,
        tradingDays: monthData.length,
        totalTrades
      })
    }
    
    return stats
  }, [yearData, selectedYear])
  
  // Calculate yearly totals
  const yearlyStats = useMemo(() => {
    const totalPnl = monthlyStats.reduce((sum, month) => sum + month.netPnl, 0)
    const totalTradingDays = monthlyStats.reduce((sum, month) => sum + month.tradingDays, 0)
    const totalTrades = monthlyStats.reduce((sum, month) => sum + month.totalTrades, 0)
    const profitableMonths = monthlyStats.filter(month => month.netPnl > 0).length
    const monthlyWinRate = monthlyStats.length > 0 ? Math.round((profitableMonths / monthlyStats.length) * 100) : 0
    
    return {
      totalPnl: Math.round(totalPnl * 100) / 100,
      totalTradingDays,
      totalTrades,
      monthlyWinRate
    }
  }, [monthlyStats])
  
  return (
    <Tooltip.Provider>
      <div className="space-y-6">
        {/* Year Overview */}
        <div className="bg-white dark:bg-[#0f0f0f] rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TradingCalendarIcon />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Trading Calendar {selectedYear}
              </h2>
            </div>
            
            {/* Year Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedYear(prev => prev - 1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={selectedYear <= 2020}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedYear}
                </span>
              </div>
              
              <button
                onClick={() => setSelectedYear(prev => prev + 1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={selectedYear >= new Date().getFullYear()}
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Yearly Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={cn(
                "text-2xl font-medium mb-1",
                yearlyStats.totalPnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {yearlyStats.totalPnl >= 0 ? '+' : ''}${yearlyStats.totalPnl.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total P&L</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-gray-900 dark:text-white mb-1">
                {yearlyStats.monthlyWinRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Profitable Months</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-gray-900 dark:text-white mb-1">
                {yearlyStats.totalTradingDays}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Trading Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-gray-900 dark:text-white mb-1">
                {yearlyStats.totalTrades}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Trades</div>
            </div>
          </div>
        </div>
        
        
        {/* 12 Month Calendars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }, (_, month) => (
            <MonthCalendar
              key={month}
              year={selectedYear}
              month={month}
              data={yearData}
              stats={monthlyStats[month]}
            />
          ))}
        </div>
      </div>
    </Tooltip.Provider>
  )
}