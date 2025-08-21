'use client'

import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts'

interface HorizontalWinLossBarProps {
  winAmount: number
  lossAmount: number
  height?: number
  animate?: boolean
  colors?: {
    win: string
    loss: string
  }
}

export function HorizontalWinLossBar({ 
  winAmount, 
  lossAmount, 
  height = 12, 
  animate = true,
  colors = {
    win: '#10b981',
    loss: '#ef4444'
  }
}: HorizontalWinLossBarProps) {
  const total = winAmount + Math.abs(lossAmount)
  const winPercent = total > 0 ? (winAmount / total) * 100 : 0
  const lossPercent = total > 0 ? (Math.abs(lossAmount) / total) * 100 : 0
  
  const data = [
    {
      name: 'comparison',
      win: winPercent,
      loss: lossPercent,
    }
  ]

  return (
    <div className="w-full h-full flex flex-col justify-center space-y-3">
      {/* Values */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            ${winAmount.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            ${Math.abs(lossAmount).toFixed(0)}
          </span>
          <div className="w-3 h-3 rounded-sm bg-red-500"></div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full" style={{ height: height + 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barSize={height}
          >
            <XAxis type="number" domain={[0, 100]} hide />
            <Bar 
              dataKey="win" 
              stackId="stack" 
              fill={colors.win}
              radius={[6, 0, 0, 6]}
              animationDuration={animate ? 1200 : 0}
              animationBegin={animate ? 200 : 0}
            />
            <Bar 
              dataKey="loss" 
              stackId="stack" 
              fill={colors.loss}
              radius={[0, 6, 6, 0]}
              animationDuration={animate ? 1200 : 0}
              animationBegin={animate ? 400 : 0}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Percentages */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{winPercent.toFixed(1)}% wins</span>
        <span>{lossPercent.toFixed(1)}% losses</span>
      </div>
    </div>
  )
}