'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Settings, Calendar } from 'lucide-react'
import { Root as FancyButton } from '@/components/ui/fancy-button'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface CalendarDay {
  date: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasTrades?: boolean
  pnl?: number
}

interface MonthlyCalendarProps {
  className?: string
  onDateSelect?: (date: Date) => void
  tradingDays?: Array<{
    date: string
    pnl: number
    isProfit: boolean
  }>
}

export function MonthlyCalendar({ className, onDateSelect, tradingDays = [] }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of month and how many days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Get days from previous month to fill first week
  const daysFromPrevMonth = startingDayOfWeek
  const prevMonth = new Date(currentYear, currentMonth - 1, 0)
  const daysInPrevMonth = prevMonth.getDate()

  // Generate calendar days
  const calendarDays: CalendarDay[] = []

  // Previous month days
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
    })
  }

  // Current month days
  for (let date = 1; date <= daysInMonth; date++) {
    const dayDate = new Date(currentYear, currentMonth, date)
    const isToday = dayDate.toDateString() === today.toDateString()
    const isSelected = selectedDate?.toDateString() === dayDate.toDateString()
    
    // Check if this day has trading activity
    const tradingDay = tradingDays.find(td => {
      // Parse different date formats (e.g., "Tue, Apr 23, 2024")
      let tradeDate: Date
      try {
        tradeDate = new Date(td.date)
        // If parsing fails, try alternative parsing
        if (isNaN(tradeDate.getTime())) {
          // Handle format like "Tue, Apr 23, 2024"
          const dateStr = td.date.replace(/^\w+,\s*/, '') // Remove day name
          tradeDate = new Date(dateStr)
        }
      } catch {
        return false
      }
      
      return tradeDate.getDate() === date && 
             tradeDate.getMonth() === currentMonth && 
             tradeDate.getFullYear() === currentYear
    })

    calendarDays.push({
      date,
      isCurrentMonth: true,
      isToday,
      isSelected,
      hasTrades: !!tradingDay,
      pnl: tradingDay?.pnl
    })
  }

  // Next month days to complete the grid
  const remainingDays = 42 - calendarDays.length // 6 weeks * 7 days
  for (let date = 1; date <= remainingDays; date++) {
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
    })
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const handleTodayClick = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
    onDateSelect?.(today)
  }

  const handleDateClick = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      const newSelectedDate = new Date(currentYear, currentMonth, day.date)
      setSelectedDate(newSelectedDate)
      onDateSelect?.(newSelectedDate)
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn("bg-white dark:bg-[#0f0f0f] rounded-xl p-8 min-h-[750px] w-full", className)}>
      {/* Main Title */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Trade Calendar
        </h1>
        {/* Custom Tradestial Logo */}
        <div className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div className="w-7 h-7 relative">
            <Image
              src="/new-tradtrace-logo.png"
              alt="Tradestial Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
        </div>
      </div>
      
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <FancyButton
            variant="basic"
            size="small"
            onClick={handlePrevMonth}
            className="!h-10 !w-10 !p-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </FancyButton>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white min-w-[160px]">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          
          <FancyButton
            variant="basic"
            size="small"
            onClick={handleNextMonth}
            className="!h-10 !w-10 !p-0"
          >
            <ChevronRight className="h-5 w-5" />
          </FancyButton>
        </div>
        
        <div className="flex items-center space-x-3">
          <FancyButton
            variant="basic"
            size="small"
            onClick={handleTodayClick}
            className="!text-xs !font-medium !bg-white dark:!bg-[#0f0f0f] !border-gray-300 dark:!border-[#2a2a2a] !text-gray-600 dark:!text-gray-300 hover:!bg-gray-50 dark:hover:!bg-[#2a2a2a]"
          >
            TODAY
          </FancyButton>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-3"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(day)}
            className={cn(
              "relative h-20 w-full flex items-center justify-center text-base transition-colors rounded-xl",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              "border border-gray-200 dark:border-[#2a2a2a]",
              day.isCurrentMonth 
                ? "text-gray-900 dark:text-white" 
                : "text-gray-400 dark:text-gray-600",
              day.isSelected && "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
              day.hasTrades && !day.isSelected && !day.isToday && "bg-gray-50 dark:bg-gray-800/50",
              day.hasTrades && day.pnl && day.pnl > 0 && !day.isSelected && !day.isToday && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-[#2a2a2a]",
              day.hasTrades && day.pnl && day.pnl < 0 && !day.isSelected && !day.isToday && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-[#2a2a2a]",
              !day.isCurrentMonth && "cursor-default bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-[#2a2a2a]"
            )}
            disabled={!day.isCurrentMonth}
          >
            {day.isToday && !day.isSelected ? (
              <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center font-medium">
                {day.date}
              </div>
            ) : day.hasTrades && day.pnl !== undefined ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {day.date}
                </span>
                <span className={cn(
                  "text-sm font-bold",
                  day.pnl > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {day.pnl > 0 ? '+' : ''}${Math.abs(day.pnl)}
                </span>
              </div>
            ) : (
              <span className={cn(
                "font-medium",
                day.isToday && day.isSelected && "text-white"
              )}>
                {day.date}
              </span>
            )}
          </button>
        ))}
      </div>


    </div>
  )
}