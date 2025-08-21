'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useState } from 'react'

interface DayData {
  date: number
  trades: number
  pnl: number
  isToday: boolean
  isWeekend: boolean
  isEmpty: boolean
}

// Deterministic pseudo-random number generator using seed
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Generate monthly data for a given view date (includes leading/trailing placeholders)
const generateMonthData = (viewDate: Date): DayData[] => {
  const baseSeed = 12345 + viewDate.getFullYear() * 100 + viewDate.getMonth()
  let seedCounter = 0

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun..6=Sat

  const today = new Date()
  const isSameMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDate = isSameMonth ? today.getDate() : -1

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

    let trades = 0
    let pnl = 0

    if (!isFuture) {
      const seed1 = baseSeed + seedCounter++
      const seed2 = baseSeed + seedCounter++
      const seed3 = baseSeed + seedCounter++

      if (!isWeekend) {
        const activity = seededRandom(seed1)
        if (activity > 0.1) { // 90% chance of weekday trading
          trades = Math.floor(seededRandom(seed2) * 20) + 1
          pnl = (seededRandom(seed3) - 0.45) * 1000
        }
      } else {
        const activity = seededRandom(seed1)
        if (activity > 0.7) { // 30% chance of weekend trading
          trades = Math.floor(seededRandom(seed2) * 5) + 1
          pnl = (seededRandom(seed3) - 0.5) * 500
        }
      }
    }

    data.push({ date: day, trades, pnl: Math.round(pnl), isToday, isWeekend, isEmpty: false })
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
  const monthData = generateMonthData(viewDate)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const goPrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  const goNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.4 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-5 text-gray-900 dark:text-white relative focus:outline-none flex flex-col" style={{ height: '385px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Heatmap</h3>
            <Info className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goPrevMonth} className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[120px] text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
              {monthLabel}
            </div>
            <button onClick={goNextMonth} className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 relative flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekdays.map((d) => (
              <div key={d} className="text-xs text-gray-600 dark:text-gray-300 text-center py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#171717]">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
            {monthData.map((day, idx) => {
              if (day.isEmpty) {
                return (
                  <div key={idx} className="h-full w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#171717]" />
                )
              }

              const traded = day.trades > 0
              const positive = day.pnl >= 0
              const baseCell = 'relative h-full w-full rounded-md border flex items-center justify-center text-sm'
              const colorCell = traded
                ? positive
                  ? 'bg-[#1FC16B]/15 border-[#1FC16B]/40 text-gray-900 dark:text-white dark:bg-[#1FC16B]/20 dark:border-[#1FC16B]/50'
                  : 'bg-[#FB3748]/15 border-[#FB3748]/40 text-gray-900 dark:text-white dark:bg-[#FB3748]/20 dark:border-[#FB3748]/50'
                : 'bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300'

              return (
                <div key={idx} className={`${baseCell} ${colorCell}`}>
                  {!day.isToday && <span className="font-medium">{day.date}</span>}
                  {day.isToday && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold shadow">
                      {day.date}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}