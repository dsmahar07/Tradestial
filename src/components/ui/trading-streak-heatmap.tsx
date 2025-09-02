'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { parseLocalDate, getMonth, getYear, getDayOfWeek } from '@/utils/date-utils'
import { Tooltip } from './tooltip'

interface DayData {
  date: number
  trades: number
  pnl: number
  isToday: boolean
  isWeekend: boolean
  isEmpty: boolean
}

// Generate monthly data for a given view date using real trade data
const generateMonthData = (viewDate: Date, trades: Trade[]): DayData[] => {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun..6=Sat

  const today = new Date()
  const isSameMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDate = isSameMonth ? today.getDate() : -1

  // Group trades by date for the current month
  const dailyTradeMap = new Map<number, { trades: number; pnl: number }>()
  
  trades.forEach(trade => {
    const tradeDate = parseLocalDate(trade.closeDate || trade.openDate)
    if (getYear(trade.closeDate || trade.openDate) === year && getMonth(trade.closeDate || trade.openDate) === month) {
      const day = tradeDate.getDate()
      const existing = dailyTradeMap.get(day) || { trades: 0, pnl: 0 }
      existing.trades += 1
      existing.pnl += trade.netPnl
      dailyTradeMap.set(day, existing)
    }
  })

  const data: DayData[] = []

  // Leading placeholders
  for (let i = 0; i < firstDay; i++) {
    data.push({ date: 0, trades: 0, pnl: 0, isToday: false, isWeekend: false, isEmpty: true })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day)
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
    const isToday = isSameMonth && day === todayDate
    const isFuture = !isSameMonth ? false : day > todayDate

    const dayData = dailyTradeMap.get(day) || { trades: 0, pnl: 0 }

    data.push({ 
      date: day, 
      trades: dayData.trades, 
      pnl: Math.round(dayData.pnl), 
      isToday, 
      isWeekend, 
      isEmpty: false 
    })
  }

  // Trailing placeholders to complete last week
  const remainder = data.length % 7
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      data.push({ date: 0, trades: 0, pnl: 0, isToday: false, isWeekend: false, isEmpty: true })
    }
  }

  return data
}

// removed heatmap helpers in favor of calendar-style display

// const months = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December'
// ]

export function TradingStreakHeatmap() {
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [trades, setTrades] = useState<Trade[]>([])
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Load trades and subscribe to changes
  useEffect(() => {
    setTrades(DataStore.getAllTrades())
    const unsubscribe = DataStore.subscribe(() => {
      setTrades(DataStore.getAllTrades())
    })
    return unsubscribe
  }, [])

  const monthData = useMemo(() => generateMonthData(viewDate, trades), [viewDate, trades])
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const goPrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  const goNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

  if (!trades.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="focus:outline-none"
      >
        <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none flex flex-col" style={{ height: '432px' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Heatmap</h3>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400 text-center">
              <div>No heatmap data available</div>
              <div className="text-sm mt-1">Import your CSV to see trading activity heatmap</div>
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
      transition={{ duration: 0.5, delay: 1.4 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl pt-4 px-6 pb-6 text-gray-900 dark:text-white relative focus:outline-none flex flex-col" style={{ height: '432px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Heatmap</h3>
            <Info className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goPrevMonth} className="p-1 rounded-md border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-gray-800">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[120px] text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
              {monthLabel}
            </div>
            <button onClick={goNextMonth} className="p-1 rounded-md border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-gray-800">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Header Divider */}
        <div className="-mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a] mb-4"></div>
        {/* Body */}
        <div className="flex-1 relative flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekdays.map((d) => (
              <div key={d} className="text-xs text-gray-600 dark:text-gray-300 text-center py-1 rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f]">
                {d}
              </div>
            ))}
          </div>

          {/* Chart Container */}
          <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
            {monthData.map((day, idx) => {
              if (day.isEmpty) {
                return (
                  <div key={idx} className="h-full w-full rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f]" />
                )
              }

              const traded = day.trades > 0
              const positive = day.pnl >= 0
              const baseCell = 'relative h-full w-full rounded-md border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-center p-2'
              const colorCell = traded
                ? positive
                  ? 'shadow-[inset_0_0_20px_-8px_rgba(31,193,107,0.8)] text-gray-900 dark:text-white'
                  : 'shadow-[inset_0_0_20px_-8px_rgba(255,77,59,0.7)] text-gray-900 dark:text-white'
                : 'bg-white text-gray-700 dark:bg-[#0f0f0f] dark:text-gray-300'

              return (
                <div 
                  key={idx} 
                  className={`${baseCell} ${colorCell} cursor-pointer hover:scale-105 transition-transform duration-200 relative group`}
                >
                  <span className={`text-xs ${day.isToday ? "font-normal" : "font-medium"}`}>{day.date}</span>
                  
                  {/* Inline tooltip positioned relative to cell */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] whitespace-nowrap border border-gray-200 dark:border-[#2a2a2a]">
                    {viewDate.toLocaleDateString('en-US', { month: 'short' })} {day.date}
                    {day.trades > 0 ? (
                      <><br/>{day.trades} trade{day.trades > 1 ? 's' : ''}<br/>
                      <span className={day.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {day.pnl >= 0 ? '+' : ''}${day.pnl.toLocaleString()}
                      </span></>
                    ) : (
                      <><br/>No trades</>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}