'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

// interface WinLossData {
//   name: string
//   value: number
//   color: string
//   label?: string
// }

interface WinLossBarChartProps {
  winAmount: number
  lossAmount: number
  height?: number
  animate?: boolean
  showLabels?: boolean
  colors?: {
    win: string
    loss: string
  }
}

export function WinLossBarChart({ 
  winAmount, 
  lossAmount, 
  height = 40, 
  animate = true,
  showLabels = true,
  colors = {
    win: '#10b981',
    loss: '#ef4444'
  }
}: WinLossBarChartProps) {
  const data = [
    {
      name: 'comparison',
      win: Math.abs(winAmount),
      loss: Math.abs(lossAmount)
    }
  ]

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(0)}`
  }

  const chartComponent = (
    <div className="w-full space-y-2">
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Bar dataKey="win" fill={colors.win} radius={[2, 2, 2, 2]} />
            <Bar dataKey="loss" fill={colors.loss} radius={[2, 2, 2, 2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-600 dark:text-green-400 font-medium">
            {formatValue(winAmount)}
          </span>
          <span className="text-red-600 dark:text-red-400 font-medium">
            -{formatValue(lossAmount)}
          </span>
        </div>
      )}
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {chartComponent}
      </motion.div>
    )
  }

  return chartComponent
}