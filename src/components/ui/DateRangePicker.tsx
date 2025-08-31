'use client'

import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from './button'

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangePickerProps {
  value?: DateRange
  onValueChange?: (range: DateRange) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({ 
  value, 
  onValueChange, 
  placeholder = "Pick a date range",
  className = "" 
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tempRange, setTempRange] = useState<DateRange>(value || { from: undefined, to: undefined })

  const handleDateClick = (date: Date) => {
    if (!tempRange.from || (tempRange.from && tempRange.to)) {
      // Start new selection
      setTempRange({ from: date, to: undefined })
    } else if (tempRange.from && !tempRange.to) {
      // Complete selection
      const newRange = date >= tempRange.from 
        ? { from: tempRange.from, to: date }
        : { from: date, to: tempRange.from }
      setTempRange(newRange)
    }
  }

  const handleApply = () => {
    if (tempRange.from && tempRange.to) {
      onValueChange?.(tempRange)
      setIsOpen(false)
    }
  }

  const handleCancel = () => {
    setTempRange(value || { from: undefined, to: undefined })
    setIsOpen(false)
  }

  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, monthIndex, -i)
      days.push({
        date: prevDate.getDate(),
        fullDate: prevDate,
        isCurrentMonth: false
      })
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, monthIndex, day)
      days.push({
        date: day,
        fullDate,
        isCurrentMonth: true
      })
    }
    
    // Next month's days to complete the grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, monthIndex + 1, day)
      days.push({
        date: day,
        fullDate: nextDate,
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isDateInRange = (date: Date) => {
    if (!tempRange.from || !tempRange.to) return false
    return date >= tempRange.from && date <= tempRange.to
  }

  const isDateRangeStart = (date: Date) => {
    return tempRange.from && date.toDateString() === tempRange.from.toDateString()
  }

  const isDateRangeEnd = (date: Date) => {
    return tempRange.to && date.toDateString() === tempRange.to.toDateString()
  }

  const formatDateRange = () => {
    if (!value?.from) return placeholder
    if (!value.to) return value.from.toLocaleDateString()
    return `${value.from.toLocaleDateString()} - ${value.to.toLocaleDateString()}`
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className={className}>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80 z-50"
            align="start"
            sideOffset={8}
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-sm">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-xs mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
              {generateCalendarDays(currentMonth).map((day, index) => {
                const isInRange = isDateInRange(day.fullDate)
                const isStart = isDateRangeStart(day.fullDate)
                const isEnd = isDateRangeEnd(day.fullDate)
                const isToday = day.fullDate.toDateString() === new Date().toDateString()

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day.fullDate)}
                    className={`
                      p-2 text-center rounded transition-colors
                      ${day.isCurrentMonth 
                        ? 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700' 
                        : 'text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                      ${isToday && !isInRange && !isStart && !isEnd
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                        : ''
                      }
                      ${isStart || isEnd
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : ''
                      }
                      ${isInRange && !isStart && !isEnd
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                        : ''
                      }
                    `}
                  >
                    {day.date}
                  </button>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-600 dark:text-gray-400"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!tempRange.from || !tempRange.to}
              >
                Apply
              </Button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
