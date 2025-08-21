'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, MoreHorizontal, LucideIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { SemicircularGauge } from './semicircular-gauge'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, RadialBarChart, RadialBar, Tooltip } from 'recharts'

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
  showFullPieChart?: boolean
  pieChartData?: GaugeData[]
  showVerticalBars?: boolean
  verticalBarsData?: GaugeData[]
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
  horizontalBarsData = [],
  showFullPieChart = false,
  pieChartData = [],
  showVerticalBars = false,
  verticalBarsData = []
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
            <div className="absolute -top-2 right-0 scale-105 origin-top-right">
              <div className="relative">
                <ResponsiveContainer width={120} height={80}>
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx={60}
                      cy={60}
                      startAngle={180}
                      endAngle={0}
                      innerRadius={25}
                      outerRadius={50}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      strokeWidth={0}
                      cornerRadius={4}
                      isAnimationActive={true}
                      animationBegin={delay * 1000 + 300}
                      animationDuration={1200}
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value}`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#374151', fontWeight: '500' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {showDonutIndicator && donutData.length > 0 && (
            <div className="absolute -top-6 right-0 scale-90 origin-top-right">
              <div className="relative">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx={50}
                      cy={50}
                      innerRadius={25}
                      outerRadius={45}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      strokeWidth={0}
                      cornerRadius={4}
                      isAnimationActive={true}
                      animationBegin={delay * 1000 + 300}
                      animationDuration={1200}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#374151', fontWeight: '500' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
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
                      <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full"
                          style={{ backgroundColor: bar.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}px` }}
                          transition={{ duration: 1.2, delay: delay + 0.3 + (index * 0.2), ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showFullPieChart && pieChartData.length > 0 && (
            <div className="absolute -top-4 right-0 scale-90 origin-top-right">
              <div className="relative w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={40}
                      fill="#8884d8"
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      strokeWidth={0}
                      isAnimationActive={true}
                      animationBegin={delay * 1000 + 300}
                      animationDuration={1200}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#374151', fontWeight: '500' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {showVerticalBars && verticalBarsData.length > 0 && (
            <div className="absolute top-2 right-2 scale-100 origin-top-right">
              <div className="flex items-end space-x-2 h-12">
                {verticalBarsData.map((bar, index) => {
                  const maxValue = Math.max(...verticalBarsData.map(b => b.value));
                  const barHeight = (bar.value / maxValue) * 40; // Max height 40px
                  return (
                    <div key={bar.name} className="flex flex-col items-center space-y-1">
                      <motion.div
                        className="w-4 rounded-t-sm bg-opacity-90 hover:bg-opacity-100 transition-opacity cursor-pointer"
                        style={{ 
                          backgroundColor: bar.color,
                          height: `${barHeight}px`,
                          minHeight: '8px' // Minimum visible height
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}px` }}
                        transition={{ 
                          duration: 1.2, 
                          delay: delay + 0.3 + (index * 0.2), 
                          ease: "easeOut" 
                        }}
                        title={`${bar.name}: ${bar.value}`} // Simple tooltip
                      />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {bar.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {change !== 0 && (
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
          )}
          
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