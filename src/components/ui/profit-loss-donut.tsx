'use client'

import { motion } from 'framer-motion'

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
  size = 60,
  strokeWidth = 8,
  animate = true,
}: ProfitLossDonutProps) {
  const normalizedProfit = Math.max(0, Math.min(100, profitPercentage))
  const normalizedLoss = Math.max(0, Math.min(100, lossPercentage ?? (100 - normalizedProfit)))

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const profitDash = (circumference * normalizedProfit) / 100
  const lossDash = (circumference * normalizedLoss) / 100

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Profit segment */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10b981"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${profitDash} ${circumference}`}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${profitDash} ${circumference}` }}
          transition={{ duration: animate ? 1.0 : 0, delay: 0.2, ease: 'easeOut' }}
        />

        {/* Loss segment */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${lossDash} ${circumference}`}
          strokeDashoffset={`-${profitDash}`}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${lossDash} ${circumference}` }}
          transition={{ duration: animate ? 1.0 : 0, delay: 0.4, ease: 'easeOut' }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium text-emerald-500">{Math.round(normalizedProfit)}%</span>
        <span className="text-[9px] text-gray-500">profit</span>
      </div>
    </div>
  )
}


