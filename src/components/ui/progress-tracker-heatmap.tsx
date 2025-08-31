'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { Button } from './button'

interface ProgressData {
  date: Date
  score: number
  completed: number
  total: number
}

interface ProgressTrackerHeatmapProps {
  todayScore?: number
  todayCompleted?: number
  todayTotal?: number
  history?: Record<string, { completed: number; total: number; score: number }>
  onOpenDailyChecklist?: () => void
}

const toKey = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfWeekSun = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay() // 0 = Sun
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

const getIntensity = (score: number): string => {
  if (score === 0) return 'bg-gray-100 dark:bg-gray-700'
  if (score <= 20) return 'bg-blue-200 dark:bg-blue-900'
  if (score <= 40) return 'bg-blue-300 dark:bg-blue-800'
  if (score <= 60) return 'bg-blue-400 dark:bg-blue-700'
  if (score <= 80) return 'bg-blue-500 dark:bg-blue-600'
  return 'bg-blue-600 dark:bg-blue-500'
}

export function ProgressTrackerHeatmap({ 
  todayScore = 0, 
  todayCompleted = 0, 
  todayTotal = 0,
  history = {},
  onOpenDailyChecklist
}: ProgressTrackerHeatmapProps = {}) {
  const gridAreaRef = useRef<HTMLDivElement | null>(null)
  const firstRowCellsRef = useRef<HTMLDivElement | null>(null)
  const [cellSize, setCellSize] = useState<number>(16)

  useEffect(() => {
    const computeSize = () => {
      setCellSize(16) 
    }
    computeSize()
  }, [])
  
  const todayData = useMemo(() => {
    return {
      date: new Date(),
      score: todayScore,
      completed: todayCompleted,
      total: todayTotal
    }
  }, [todayScore, todayCompleted, todayTotal])

  const weeks = useMemo(() => {
    const today = new Date()
    const startThisWeek = startOfWeekSun(today)
    const weeks: Date[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(startThisWeek)
      d.setDate(d.getDate() - i * 7)
      weeks.push(d)
    }
    return weeks
  }, [])

  const historyWithToday = useMemo(() => {
    const merged = { ...history }
    const k = toKey(todayData.date)
    merged[k] = {
      completed: todayData.completed,
      total: todayData.total,
      score: todayData.total > 0 ? Math.round((todayData.completed / todayData.total) * 100) : 0,
    }
    return merged
  }, [history, todayData])

  const monthHeaders = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthRanges: { month: string; startWeek: number; weekCount: number }[] = []
    
    // Group consecutive weeks by month
    let currentMonth = ''
    let currentStart = 0
    let currentCount = 0
    
    weeks.forEach((startOfWeek, weekIndex) => {
      const month = months[startOfWeek.getMonth()]
      
      if (month !== currentMonth) {
        // Save previous month if it had weeks
        if (currentMonth && currentCount > 0) {
          monthRanges.push({ 
            month: currentMonth, 
            startWeek: currentStart, 
            weekCount: currentCount 
          })
        }
        
        // Start new month
        currentMonth = month
        currentStart = weekIndex
        currentCount = 1
      } else {
        currentCount++
      }
    })
    
    // Add the last month
    if (currentMonth && currentCount > 0) {
      monthRanges.push({ 
        month: currentMonth, 
        startWeek: currentStart, 
        weekCount: currentCount 
      })
    }
    
    // Only show months with significant presence (at least 2 weeks)
    return monthRanges.filter(({ weekCount }) => weekCount >= 2)
  }, [weeks])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: '385px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Progress tracker
            </h3>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <Button
            variant="ghost" 
            size="sm"
            className="text-[#3559E9] hover:text-[#2947d1] px-0 text-sm font-medium"
          >
            View more
          </Button>
        </div>
        
        {/* Fixed Height Content Area */}
        <div className="h-72 flex flex-col px-1 overflow-visible">
          {/* Month Headers - Optimized Layout */}
          <div className="flex mb-3">
            <div className="w-10"></div> {/* Space for day labels */}
            <div className="flex-1 grid grid-cols-12 gap-1.5">
              {monthHeaders.map(({ month, startWeek, weekCount }) => (
                <div
                  key={month}
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center bg-gray-50 dark:bg-gray-800 rounded px-1 py-0.5"
                  style={{
                    gridColumn: `${startWeek + 1} / ${startWeek + weekCount + 1}`
                  }}
                >
                  {month}
                </div>
              ))}
            </div>
          </div>
          
          {/* Weekly Calendar Grid - Optimized */}
          <div ref={gridAreaRef} className="mb-4 flex-1">
            <div className="grid grid-cols-[40px_1fr] gap-2">
              {/* Day Labels */}
              <div className="space-y-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                  <div key={dayName} className="h-4 flex items-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {dayName}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-12 gap-1.5">
                {weeks.map((startOfWeek, weekIndex) => (
                  <div key={weekIndex} className="space-y-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                      const cellDate = new Date(startOfWeek)
                      cellDate.setDate(cellDate.getDate() + dayIndex)
                      const key = toKey(cellDate)
                      const entry = historyWithToday[key]
                      const score = entry?.score ?? 0
                      const title = `${cellDate.toDateString()} — ${entry ? `${entry.completed}/${entry.total} (${score}%)` : 'No data'}`
                      const intensity = entry ? getIntensity(score) : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'

                      return (
                        <div
                          key={dayIndex}
                          className={`w-4 h-4 rounded-sm ${intensity} transition-colors hover:ring-1 hover:ring-blue-300`}
                          title={title}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700"></div>
              <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900/60"></div>
              <div className="w-3 h-3 bg-blue-300 dark:bg-blue-800/70"></div>
              <div className="w-3 h-3 bg-blue-400 dark:bg-blue-700/80"></div>
              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-600/90"></div>
              <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500"></div>
            </div>
            <span>More</span>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
          
          {/* Bottom Section */}
          <div className="flex items-center justify-between pt-1">
            {/* Today's Score */}
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Today's score</span>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-900 dark:text-white min-w-[56px]">
                  {todayData.completed}/{todayData.total}
                </span>
                <div className="flex-1 max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-[#3559E9] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${todayData.total > 0 ? (todayData.completed / todayData.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Daily Checklist Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDailyChecklist}
              className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:text-gray-900 dark:hover:text-white text-sm"
            >
              Daily checklist
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}