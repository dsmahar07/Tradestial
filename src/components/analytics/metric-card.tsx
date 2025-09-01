'use client'

import { HelpCircle, ExternalLink } from 'lucide-react'
import { MetricValue } from '@/types/performance'
import { Card, CardContent } from '@/components/ui/card'
import { StialScale } from './stial-scale'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: MetricValue
  hasTooltip?: boolean
  hasExternalLink?: boolean
  className?: string
}

export function MetricCard({ 
  label, 
  value, 
  hasTooltip = false, 
  hasExternalLink = false,
  className 
}: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    
    // Handle currency formatting
    if (label.toLowerCase().includes('pnl') || 
        label.toLowerCase().includes('p&l') ||
        label.toLowerCase().includes('expectancy') ||
        label.toLowerCase().includes('drawdown') ||
        label.toLowerCase().includes('profitable') ||
        label.toLowerCase().includes('losing') ||
        label.toLowerCase().includes('trade')) {
      
      if (Math.abs(val) >= 1000000) {
        return `$${(val / 1000000).toFixed(2)}M`
      } else if (Math.abs(val) >= 1000) {
        return `$${(val / 1000).toFixed(1)}K`
      } else {
        return `$${val.toFixed(2)}`
      }
    }
    
    // Handle percentage formatting
    if (label.toLowerCase().includes('win') || 
        label.toLowerCase().includes('rate') ||
        label.toLowerCase().includes('%')) {
      return `${val.toFixed(2)}%`
    }
    
    // Handle time formatting
    if (label.toLowerCase().includes('time') || 
        label.toLowerCase().includes('duration')) {
      // val is in minutes; show with two decimals
      if (val >= 60) {
        const hours = Math.floor(val / 60)
        let minutes = Number((val - hours * 60).toFixed(2))
        // Handle edge case like 59.999 -> 60.00 after rounding
        if (minutes >= 60) {
          return `${hours + 1}h`
        }
        return minutes > 0 ? `${hours}h ${minutes.toFixed(2)}m` : `${hours}h`
      }
      return `${val.toFixed(2)}m`
    }
    
    // Handle days
    if (label.toLowerCase().includes('days')) {
      return `${val}`
    }
    
    // Default number formatting
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(2)}M`
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`
    } else if (val % 1 === 0) {
      return `${val}`
    } else {
      return `${val.toFixed(2)}`
    }
  }

  const getValueColor = () => {
    if (value.isPositive === undefined) return 'text-gray-900 dark:text-gray-100'
    if (value.isPositive) return 'text-[#10B981] dark:text-[#10B981]'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label with icons */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>
        {hasTooltip && (
          <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
        )}
        {hasExternalLink && (
          <ExternalLink className="w-3 h-3 text-blue-500 hover:text-blue-700 cursor-pointer" />
        )}
      </div>
      
      {/* Value */}
      <div className={cn("text-2xl font-semibold", getValueColor())}>
        {value.formatted || formatValue(value.value)}
      </div>
      
      {/* Change indicator */}
      {value.change !== undefined && (
        <div className={cn(
          "text-xs flex items-center gap-1",
          value.change >= 0 ? "text-[#10B981] dark:text-[#10B981]" : "text-red-600 dark:text-red-400"
        )}>
          <span>{value.change >= 0 ? '+' : ''}{formatValue(value.change)}</span>
          {value.changePercent !== undefined && (
            <span>({value.changePercent >= 0 ? '+' : ''}{value.changePercent.toFixed(2)}%)</span>
          )}
        </div>
      )}
    </div>
  )
}

interface MetricGridProps {
  metrics: Array<{
    label: string
    value: MetricValue
    hasTooltip?: boolean
    hasExternalLink?: boolean
  }>
  columns?: number
  className?: string
  stialScale?: {
    current: number
    max: number
    color: 'red' | 'yellow' | 'green'
  }
}

export function MetricGrid({ metrics, columns = 4, className, stialScale }: MetricGridProps) {
  return (
    <Card className={cn("border-0 shadow-none bg-white dark:bg-[#0f0f0f]", className)}>
      <CardContent className="p-6">
        <div className={cn(
          stialScale ? "grid grid-cols-1 lg:grid-cols-4 gap-6" : "",
          !stialScale && columns === 2 && "grid grid-cols-1 md:grid-cols-2 gap-6",
          !stialScale && columns === 3 && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", 
          !stialScale && columns === 4 && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
          !stialScale && columns === 5 && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
        )}>
          {/* Metrics Grid */}
          <div className={cn(
            stialScale ? "lg:col-span-3" : "col-span-full",
            "grid gap-6",
            columns === 2 && "grid-cols-1 md:grid-cols-2",
            columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", 
            columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
            columns === 5 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          )}>
            {metrics.map((metric, index) => (
              <MetricCard
                key={index}
                label={metric.label}
                value={metric.value}
                hasTooltip={metric.hasTooltip}
                hasExternalLink={metric.hasExternalLink}
              />
            ))}
          </div>
          
          {/* Stial Scale */}
          {stialScale && (
            <div className="lg:col-span-1 flex items-center">
              <StialScale 
                current={stialScale.current}
                max={stialScale.max}
                color={stialScale.color}
                className="w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}