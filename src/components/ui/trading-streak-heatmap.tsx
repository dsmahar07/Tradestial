'use client'

import { motion } from 'framer-motion'
import { ChevronDown, Flame } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
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

// Generate monthly trading streak data with deterministic values
const generateMonthData = (): DayData[] => {
  // Use a fixed seed for consistent generation
  const baseSeed = 12345
  let seedCounter = 0
  
  // Use fixed date for consistency (current month of 2024)
  const currentYear = 2024
  const currentMonth = 0 // January
  const todayDate = 15 // Fixed to 15th
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  
  const data: DayData[] = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    data.push({
      date: 0,
      trades: 0,
      pnl: 0,
      isToday: false,
      isWeekend: false,
      isEmpty: true
    })
  }
  
  // Add actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const isToday = day === todayDate
    const isFuture = day > todayDate
    
    let trades = 0
    let pnl = 0
    
    if (!isFuture) {
      const seed1 = baseSeed + seedCounter++
      const seed2 = baseSeed + seedCounter++
      const seed3 = baseSeed + seedCounter++
      
      if (!isWeekend) {
        // Weekday trading activity
        const activity = seededRandom(seed1)
        if (activity > 0.1) { // 90% chance of trading on weekdays
          trades = Math.floor(seededRandom(seed2) * 20) + 1
          pnl = (seededRandom(seed3) - 0.45) * 1000
        }
      } else {
        // Weekend trading (less frequent)
        const activity = seededRandom(seed1)
        if (activity > 0.7) { // 30% chance of trading on weekends
          trades = Math.floor(seededRandom(seed2) * 5) + 1
          pnl = (seededRandom(seed3) - 0.5) * 500
        }
      }
    }
    
    data.push({
      date: day,
      trades,
      pnl: Math.round(pnl),
      isToday,
      isWeekend,
      isEmpty: false
    })
  }
  
  return data
}

const monthData = generateMonthData()

// Intensity based on absolute P&L magnitude (heatmap strength)
const getPnlOpacity = (pnl: number): string => {
  const a = Math.abs(pnl)
  if (a === 0) return '20'
  if (a < 200) return '30'
  if (a < 500) return '50'
  if (a < 1000) return '70'
  return '90'
}

// Background color from profit/loss
const getCellBg = (trades: number, pnl: number): string => {
  if (trades === 0) return 'bg-gray-50 dark:bg-gray-800/50'
  const opacity = getPnlOpacity(pnl)
  return pnl >= 0 ? `bg-green-500/${opacity}` : `bg-red-500/${opacity}`
}

// Border color to ensure outlines are visible for traded days
const getCellBorder = (trades: number, pnl: number): string => {
  if (trades === 0) return 'border-gray-100 dark:border-gray-700/70'
  return pnl >= 0 ? 'border-green-400 dark:border-green-700' : 'border-red-400 dark:border-red-700'
}

// const months = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December'
// ]

const timeRanges = ['This Month', 'Last Month', 'This Quarter', 'Custom']

export function TradingStreakHeatmap() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Month')
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)
  
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const totalTrades = monthData.reduce((sum, day) => sum + day.trades, 0)
  const tradingDays = monthData.filter(day => !day.isEmpty && day.trades > 0).length
  // const bestDay = monthData.reduce((best, curr) => curr.pnl > best.pnl ? curr : best, monthData[0])
  const currentStreak = calculateCurrentStreak()
  
  function calculateCurrentStreak(): number {
    let streak = 0
    const today = new Date().getDate()
    
    for (let i = today; i >= 1; i--) {
      const dayData = monthData.find(d => d.date === i)
      if (dayData && dayData.trades > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.4 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: '385px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trading Streak</h3>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-300">
              <Flame className="w-3.5 h-3.5" /> {currentStreak} day{currentStreak === 1 ? '' : 's'}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="hidden sm:flex items-center gap-2">
              <span>Trading days</span>
              <span className="font-semibold text-gray-900 dark:text-white">{tradingDays}</span>
              <span className="mx-1 text-gray-300">•</span>
              <span>Total trades</span>
              <span className="font-semibold text-gray-900 dark:text-white">{totalTrades}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 py-1 h-7">
                  <span className="text-xs">{selectedTimeRange.replace('This ', '').replace('Last ', '')}</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28">
                {timeRanges.map((range) => (
                  <DropdownMenuItem key={range} onClick={() => setSelectedTimeRange(range)} className={selectedTimeRange === range ? 'bg-gray-100 dark:bg-gray-800' : ''}>
                    <span className="text-xs">{range}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Heatmap */}
        <div className="h-72 relative overflow-visible">
          <div className="mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{currentMonth}</h4>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-xs text-gray-500 dark:text-gray-400 text-center py-0.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthData.map((day, index) => (
                <div
                  key={index}
                  className={`
                    relative h-8 sm:h-9 w-full rounded-md cursor-pointer transition-transform duration-150 border
                    ${day.isEmpty ? 'invisible' : ''}
                    ${getCellBg(day.trades, day.pnl)}
                    ${getCellBorder(day.trades, day.pnl)}
                    ${day.isToday ? 'ring-1 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-700'}
                  `}
                  onMouseEnter={() => !day.isEmpty && setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {!day.isEmpty && (
                    <div className={`absolute left-1 top-1 text-[10px] sm:text-[11px] font-medium mix-blend-difference ${day.trades === 0 ? 'text-gray-800 dark:text-gray-200' : 'text-white'}`}>
                      {day.date}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          {hoveredDay && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 whitespace-nowrap pointer-events-none">
              <div className="font-semibold mb-1">
                {currentMonth.split(' ')[0]} {hoveredDay.date}, {currentMonth.split(' ')[1]}
              </div>
              <div className="flex items-center gap-3">
                <div>Trades: <span className="font-medium">{hoveredDay.trades}</span></div>
                <div className={hoveredDay.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  P&L: ${hoveredDay.pnl.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-0 right-0 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span>Loss</span>
            <div className="h-2 w-28 rounded-full bg-gradient-to-r from-red-500 via-gray-300 to-green-500 dark:from-red-500/80 dark:via-gray-700 dark:to-green-500/80" />
            <span>Profit</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}