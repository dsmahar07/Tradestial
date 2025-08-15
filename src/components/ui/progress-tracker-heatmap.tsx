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
}

// Generate calendar data for July and August
const generateCalendarData = (): ProgressData[] => {
  const data: ProgressData[] = []
  const currentYear = 2024
  
  // Generate data for July and August
  for (let month = 6; month <= 7; month++) {
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, month, day)
      const isToday = date.toDateString() === new Date().toDateString()
      const isPast = date < new Date()
      
      let score = 0
      let completed = 0
      let total = 0
      
      if (isPast && !isToday) {
        const seed = day + month * 31
        const random = Math.sin(seed) * 10000
        const normalizedRandom = random - Math.floor(random)
        
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        const activityChance = isWeekend ? 0.3 : 0.7
        
        if (normalizedRandom < activityChance) {
          total = Math.floor(normalizedRandom * 7) + 3
          completed = Math.floor(normalizedRandom * total * 1.2)
          completed = Math.min(completed, total)
          score = total > 0 ? Math.round((completed / total) * 100) : 0
        }
      } else if (isToday) {
        total = 6
        completed = 0 // Current actual progress
        score = Math.round((completed / total) * 100)
      }
      
      data.push({ date, score, completed, total })
    }
  }
  
  return data
}

// Get color intensity based on score - matching design exactly
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
  todayTotal = 0 
}: ProgressTrackerHeatmapProps = {}) {
  const progressData = useMemo(() => generateCalendarData(), [])
  const gridAreaRef = useRef<HTMLDivElement | null>(null)
  const firstRowCellsRef = useRef<HTMLDivElement | null>(null)
  const [cellSize, setCellSize] = useState<number>(16)

  // Dynamically compute cell size to fit 12 columns without wrapping or scroll
  useEffect(() => {
    const container = gridAreaRef.current
    if (!container) return

    const computeSize = () => {
      const containerWidth = container.clientWidth
      // Each row has: left day label (w-8) + gap (approx 8px) + left padding pl-2 (~8px)
      // We measure the usable width by subtracting the label block width and gaps between cells
      const dayLabelWidth = 32 // w-8 ~ 32px
      const leftGap = 8 // gap between label and grid ~ gap-2
      const leftPadding = 8 // pl-2
      const gapBetweenCells = 6 // gap-1.5 ~ 6px
      const columns = 12
      const totalGaps = (columns - 1) * gapBetweenCells
      const usable = Math.max(0, containerWidth - dayLabelWidth - leftGap - leftPadding)
      const idealCell = Math.floor((usable - totalGaps) / columns)

      // Constrain to a sensible range so it also fits vertically in h-72
      const clamped = Math.max(12, Math.min(24, idealCell))
      setCellSize(clamped)
    }

    computeSize()

    const ro = new ResizeObserver(() => computeSize())
    ro.observe(container)
    return () => ro.disconnect()
  }, [])
  
  // Get today's data - use real data from props
  const todayData = useMemo(() => {
    return {
      date: new Date(),
      score: todayScore,
      completed: todayCompleted,
      total: todayTotal
    }
  }, [todayScore, todayCompleted, todayTotal])
  
  // No additional processing needed for the new layout
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.6 }}
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
          {/* Month Headers */}
          <div className="flex justify-center gap-6 mb-2 text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Nov</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Dec</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Jan</div>
          </div>
          
          {/* Weekly Calendar Grid */}
          <div ref={gridAreaRef} className="mb-3 flex-1 overflow-x-hidden overflow-y-visible pr-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, dayIndex) => (
              <div key={dayName} className="flex items-center gap-2 mb-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 w-8 text-left">
                  {dayName}
                </div>
                
                {/* 12 weeks of calendar cells */}
                <div
                  className="flex gap-1.5 pl-2 items-center flex-nowrap"
                  ref={dayIndex === 0 ? firstRowCellsRef : undefined}
                >
                  {Array.from({ length: 12 }, (_, weekIndex) => {
                    // Generate some sample data
                    const seed = dayIndex * 12 + weekIndex
                    const random = Math.sin(seed) * 10000
                    const normalizedRandom = random - Math.floor(random)
                    
                    let intensity = ''
                    if (normalizedRandom < 0.2) {
                      intensity = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
                    } else if (normalizedRandom < 0.4) {
                      intensity = 'bg-blue-100 dark:bg-blue-900/20'
                    } else if (normalizedRandom < 0.6) {
                      intensity = 'bg-blue-200 dark:bg-blue-800/40'
                    } else if (normalizedRandom < 0.8) {
                      intensity = 'bg-blue-400 dark:bg-blue-600'
                    } else {
                      intensity = 'bg-blue-600 dark:bg-blue-500'
                    }
                    
                    return (
                      <div
                        key={weekIndex}
                        className={`rounded-[4px] ${intensity}`}
                        style={{ width: `${cellSize}px`, height: `${cellSize}px`, flex: '0 0 auto' }}
                        title={`Week ${weekIndex + 1}, ${dayName}`}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
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