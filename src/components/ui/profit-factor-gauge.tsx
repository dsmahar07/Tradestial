'use client'

import { motion } from 'framer-motion'

interface ProfitFactorGaugeProps {
  value: number
  size?: number
  animate?: boolean
}

export function ProfitFactorGauge({ 
  value, 
  size = 50, 
  animate = true 
}: ProfitFactorGaugeProps) {
  // Normalize value to percentage (profit factor of 1.0 = 50%, 2.0 = 100%)
  const percentage = Math.min((value / 2) * 100, 100)
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Color based on profit factor value
  const getColor = (val: number) => {
    if (val >= 1.5) return '#10b981' // Green - excellent
    if (val >= 1.0) return '#f59e0b' // Yellow - good
    return '#ef4444' // Red - poor
  }

  const color = getColor(value)

  const gaugeComponent = (
    <div style={{ width: size, height: size / 2 + 10 }} className="relative">
      <svg
        width={size}
        height={size / 2 + 10}
        className="transform"
        style={{ overflow: 'visible' }}
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: strokeDasharray }}
          animate={{ strokeDashoffset: animate ? strokeDashoffset : strokeDashoffset }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        {/* Center indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={3}
          fill={color}
        />
      </svg>
      {/* Value labels */}
      <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-500 px-1">
        <span>0</span>
        <span>1</span>
        <span>2</span>
      </div>
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {gaugeComponent}
      </motion.div>
    )
  }

  return gaugeComponent
}