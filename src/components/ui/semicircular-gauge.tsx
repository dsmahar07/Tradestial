'use client'

import { motion } from 'framer-motion'

interface GaugeData {
  name: string
  value: number
  color: string
}

interface SemicircularGaugeProps {
  data: GaugeData[]
  delay?: number
  className?: string
}

export function SemicircularGauge({ data, delay = 0, className = "" }: SemicircularGaugeProps) {
  // Safety check
  if (!data || data.length === 0) {
    return null
  }

  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = 75
  const strokeWidth = 22
  const circumference = Math.PI * radius // Half circle circumference
  
  // Calculate stroke offsets for each segment
  let cumulativeOffset = 0
  const segments = data.map((item) => {
    const percentage = item.value / total
    const dashLength = circumference * percentage
    const segment = {
      ...item,
      dashLength,
      dashOffset: cumulativeOffset
    }
    cumulativeOffset += dashLength
    return segment
  })

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Semicircular Gauge */}
      <div className="relative">
        <svg width="170" height="90" viewBox="0 0 170 90" className="overflow-visible">
          {/* Background semicircle */}
          <path
            d="M 15,82 A 70,70 0 0,1 155,82"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
            className="dark:stroke-gray-700"
          />
          
          {/* Data segments */}
          {segments.map((segment, index) => (
            <motion.path
              key={segment.name}
              d="M 15,82 A 70,70 0 0,1 155,82"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${segment.dashLength} ${circumference}`}
              strokeDashoffset={-segment.dashOffset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${segment.dashLength} ${circumference}` }}
              transition={{ 
                duration: 1.2, 
                delay: delay + 0.2 + (index * 0.1), 
                ease: "easeOut" 
              }}
            />
          ))}
        </svg>
      </div>
      
      {/* Data Labels */}
      <div className="flex space-x-1 mt-1">
        {data.map((item, index) => (
          <motion.div
            key={item.name}
            className="px-1.5 py-0.5 rounded-md text-center"
            style={{ backgroundColor: `${item.color}20` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay + 0.3 + (index * 0.1) }}
          >
            <span 
              className="text-xs font-medium"
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}