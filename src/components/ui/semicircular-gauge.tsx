'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

interface GaugeData {
  name: string
  value: number
  color: string
}

interface SemicircularGaugeProps {
  data: GaugeData[]
  delay?: number
  className?: string
  size?: number
}

export function SemicircularGauge({ data, delay = 0, className = "", size = 100 }: SemicircularGaugeProps) {
  // Safety check
  if (!data || data.length === 0) {
    return null
  }

  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const winPercentage = total > 0 ? (data[0]?.value / total) * 100 : 0
  const lossPercentage = total > 0 ? (data[2]?.value / total) * 100 : 0
  
  const chartData = [
    {
      name: 'wins',
      value: winPercentage,
      fill: '#10b981'
    },
    {
      name: 'losses', 
      value: lossPercentage,
      fill: '#ef4444'
    }
  ]

  return (
    <div className="w-full h-full flex items-center space-x-3 px-1">
      {/* Content on left */}
      <div className="flex-1 flex flex-col justify-center space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Wins</span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {data[0]?.value || 0}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Losses</span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {data[2]?.value || 0}
          </span>
        </div>
      </div>

      {/* Chart on right */}
      <div className="flex items-center justify-center" style={{ width: size + 30, height: size + 30 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="45%" 
            innerRadius={30}
            outerRadius={45}
            data={chartData}
            startAngle={180}
            endAngle={0}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              stroke="none"
              animationBegin={delay}
              animationDuration={1200}
              background={{ fill: '#e5e7eb' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Center percentage */}
        <div className="absolute flex items-center justify-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {winPercentage.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  )
}