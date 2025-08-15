'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

interface CircularProgressData {
  name: string
  value: number
  color: string
}

interface CircularProgressChartProps {
  percentage: number
  size?: number
  strokeWidth?: number
  colors?: {
    progress: string
    background: string
    secondary?: string
  }
  animate?: boolean
  showLabels?: boolean
  showSplit?: boolean
  winCount?: number
  lossCount?: number
}

export function CircularProgressChart({ 
  percentage, 
  size = 80, 
  strokeWidth = 8,
  colors = {
    progress: '#10b981',
    background: '#e5e7eb'
  },
  animate = true,
  showLabels = false,
  showSplit = false,
  winCount = 0,
  lossCount = 0
}: CircularProgressChartProps) {
  // Use actual win/loss counts if provided and showSplit is true
  const actualData = showSplit && (winCount > 0 || lossCount > 0) ? [
    { name: 'wins', value: winCount, color: colors.progress },
    { name: 'losses', value: lossCount, color: colors.secondary || '#ef4444' }
  ] : showSplit ? [
    { name: 'wins', value: percentage, color: colors.progress },
    { name: 'losses', value: 100 - percentage, color: colors.secondary || '#ef4444' }
  ] : [
    { name: 'progress', value: percentage, color: colors.progress },
    { name: 'remaining', value: 100 - percentage, color: colors.background }
  ]
  
  const data = actualData

  const chartComponent = (
    <div style={{ width: size, height: size }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius={size * 0.3}
            outerRadius={size * 0.45}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {showLabels && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {chartComponent}
      </motion.div>
    )
  }

  return chartComponent
}