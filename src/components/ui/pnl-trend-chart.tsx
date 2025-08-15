'use client'

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

interface PnLTrendData {
  period: string
  value: number
}

interface PnLTrendChartProps {
  data: PnLTrendData[]
  color?: string
  height?: number
  animate?: boolean
}

export function PnLTrendChart({ 
  data, 
  color = '#ef4444', 
  height = 60, 
  animate = true 
}: PnLTrendChartProps) {
  const chartComponent = (
    <div style={{ height: `${height}px` }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="period" 
            hide 
          />
          <YAxis hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            strokeDasharray="0"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {chartComponent}
      </motion.div>
    )
  }

  return chartComponent
}