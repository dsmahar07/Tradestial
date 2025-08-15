'use client'

import { motion } from 'framer-motion'

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
  height = 8, 
  animate = true,
  colors = {
    win: '#10b981',
    loss: '#ef4444'
  }
}: HorizontalWinLossBarProps) {
  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(0)}`
  }

  const barComponent = (
    <div className="space-y-2">
      <div className="flex">
        <div 
          className="flex-1 rounded-l"
          style={{ 
            backgroundColor: colors.win, 
            height: `${height}px` 
          }}
        />
        <div 
          className="flex-1 rounded-r"
          style={{ 
            backgroundColor: colors.loss, 
            height: `${height}px` 
          }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-green-600 dark:text-green-400 font-medium">
          {formatValue(winAmount)}
        </span>
        <span className="text-red-600 dark:text-red-400 font-medium">
          -{formatValue(lossAmount)}
        </span>
      </div>
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {barComponent}
      </motion.div>
    )
  }

  return barComponent
}