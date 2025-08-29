'use client'

import { useState, useRef, useEffect } from 'react'
import { Root as FancyButtonRoot } from './fancy-button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { InlineLoading } from './loading-spinner'

interface JournalDatePickerProps {
  onDateSelect: (date: Date) => void
  isNavigating?: boolean
  className?: string
}

export function JournalDatePicker({ 
  onDateSelect, 
  isNavigating = false, 
  className = "" 
}: JournalDatePickerProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateSelect = (date: Date) => {
    setIsDatePickerOpen(false)
    onDateSelect(date)
  }

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({
        date: prevDate.getDate(),
        fullDate: prevDate,
        isCurrentMonth: false
      })
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day)
      days.push({
        date: day,
        fullDate,
        isCurrentMonth: true
      })
    }
    
    // Next month's days to complete the grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({
        date: day,
        fullDate: nextDate,
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <FancyButtonRoot
        variant="neutral"
        size="small"
        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
        disabled={isNavigating}
        aria-haspopup="menu"
        aria-expanded={isDatePickerOpen}
      >
        {isNavigating ? (
          <InlineLoading
            text="Opening..."
            size="sm"
            className="relative z-10 [&>p]:text-white"
          />
        ) : (
          <span>Journal</span>
        )}
      </FancyButtonRoot>

      {/* Compact Date Picker Dropdown */}
      {isDatePickerOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 w-64">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-sm">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-1 text-center font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(day.fullDate)}
                className={`p-1 text-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  day.isCurrentMonth 
                    ? 'text-gray-900 dark:text-gray-100' 
                    : 'text-gray-400 dark:text-gray-600'
                } ${day.fullDate.toDateString() === new Date().toDateString() 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                  : ''}`}
              >
                {day.date}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}