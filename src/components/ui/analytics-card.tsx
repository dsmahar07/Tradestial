'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, MoreHorizontal, LucideIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { SemicircularGauge } from './semicircular-gauge'

interface GaugeData {
  name: string
  value: number
  color: string
}

interface AnalyticsCardProps {
  title: string
  value: string
  change: number
  changeLabel: string
  className?: string
  delay?: number
  dotColor?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>
  iconColor?: string
  customIcon?: boolean
  valueColor?: string
  showSemicircularIndicator?: boolean
  gaugeData?: GaugeData[]
  showDonutIndicator?: boolean
  donutData?: GaugeData[]
  showHorizontalBars?: boolean
  horizontalBarsData?: GaugeData[]
}

export function AnalyticsCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  className,
  delay = 0,
  dotColor = "#6366f1",
  icon: Icon,
  iconColor = "#6366f1",
  customIcon = false,
  valueColor,
  showSemicircularIndicator = false,
  gaugeData = [],
  showDonutIndicator = false,
  donutData = [],
  showHorizontalBars = false,
  horizontalBarsData = []
}: AnalyticsCardProps) {
  const isPositive = change > 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className={cn(
        "bg-white dark:bg-[#171717] rounded-xl p-5 text-gray-900 dark:text-white",
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center space-x-3">
              {Icon && (
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Icon size={24} />
                </div>
              )}
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3 relative">
          <div 
            className="text-3xl font-bold"
            style={{ color: valueColor || undefined }}
          >
            <span className={!valueColor ? "text-gray-900 dark:text-white" : ""}>
              {value}
            </span>
          </div>
          
          {showSemicircularIndicator && gaugeData.length > 0 && (
            <div className="absolute -top-2 right-0 scale-75 origin-top-right">
              <SemicircularGauge 
                data={gaugeData}
                delay={delay}
              />
            </div>
          )}
          
          {showDonutIndicator && donutData.length > 0 && (
            <div className="absolute -top-2 right-0 scale-90 origin-top-right">
              <div className="relative">
                <svg width="170" height="90" viewBox="0 0 170 90" className="transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="85"
                    cy="45"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  {/* Profit segment */}
                  <motion.circle
                    cx="85"
                    cy="45"
                    r="35"
                    stroke={donutData[0]?.color || "#10b981"}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${219.9 * (donutData[0]?.value || 0) / 100} ${219.9}`}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${219.9}` }}
                    animate={{ strokeDasharray: `${219.9 * (donutData[0]?.value || 0) / 100} ${219.9}` }}
                    transition={{ duration: 1.2, delay: delay + 0.3, ease: "easeOut" }}
                  />
                  {/* Loss segment */}
                  <motion.circle
                    cx="85"
                    cy="45"
                    r="35"
                    stroke={donutData[1]?.color || "#ef4444"}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${219.9 * (donutData[1]?.value || 0) / 100} ${219.9}`}
                    strokeDashoffset={`-${219.9 * (donutData[0]?.value || 0) / 100}`}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${219.9}` }}
                    animate={{ strokeDasharray: `${219.9 * (donutData[1]?.value || 0) / 100} ${219.9}` }}
                    transition={{ duration: 1.2, delay: delay + 0.5, ease: "easeOut" }}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-medium" style={{ color: donutData[0]?.color || "#10b981" }}>
                    {donutData[0]?.value || 0}%
                  </span>
                  <span className="text-xs text-gray-500">profit</span>
                </div>
              </div>
            </div>
          )}

          {showHorizontalBars && horizontalBarsData.length > 0 && (
            <div className="absolute -top-2 right-0 scale-100 origin-top-right">
              <div className="flex flex-col space-y-3 w-32">
                {horizontalBarsData.map((bar, index) => {
                  const maxValue = Math.max(...horizontalBarsData.map(b => b.value));
                  const barWidth = (bar.value / maxValue) * 80;
                  return (
                    <div key={bar.name} className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {bar.name}
                        </span>
                        <span className="text-xs font-bold" style={{ color: bar.color }}>
                          ${bar.value}
                        </span>
                      </div>
                      <motion.div 
                        className="h-3 rounded-full"
                        style={{ backgroundColor: bar.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}px` }}
                        transition={{ duration: 1.2, delay: delay + 0.3 + (index * 0.2), ease: "easeOut" }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-xs">
            <div className={cn(
              "flex items-center space-x-1",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
            <span className="text-gray-600 dark:text-gray-500">{changeLabel}</span>
          </div>
          
          <div className="pt-2">
            <button className="text-xs text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center">
              View Report 
              <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}