'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface ProfitLossDonutProps {
  profitPercentage: number
  lossPercentage?: number
  size?: number
  strokeWidth?: number
  animate?: boolean
}

export function ProfitLossDonut({
  profitPercentage,
  lossPercentage,
  size = 90,
  strokeWidth = 8,
  animate = true,
}: ProfitLossDonutProps) {
  const normalizedProfit = Math.max(0, Math.min(100, profitPercentage))
  const normalizedLoss = lossPercentage ?? (100 - normalizedProfit)

  const data = [
    { name: 'Profit', value: normalizedProfit },
    { name: 'Loss', value: normalizedLoss }
  ]

  const COLORS = ['#10b981', '#ef4444']

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
            {normalizedProfit.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Losses</span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {normalizedLoss.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart on right */}
      <div className="flex items-center justify-center" style={{ width: size + 30, height: size + 30 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={30}
              outerRadius={40}
              startAngle={90}
              endAngle={450}
              dataKey="value"
              stroke="none"
              animationBegin={animate ? 200 : 0}
              animationDuration={animate ? 1200 : 0}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index]}
                  strokeWidth={0}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}