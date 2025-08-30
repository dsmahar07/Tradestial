'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from './button'
import { MoreHorizontal, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'

// Generate dynamic data for the last 12 days
const generateMetricsData = () => {
  const data = []
  const today = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Generate realistic trading metrics with some volatility
    const baseWinRate = 55 + Math.sin(i * 0.5) * 10 + (Math.random() - 0.5) * 5
    const baseAvgWin = 800 + Math.sin(i * 0.3) * 200 + (Math.random() - 0.5) * 100
    const baseAvgLoss = 400 + Math.sin(i * 0.4) * 150 + (Math.random() - 0.5) * 80
    
    data.push({
      date: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`,
      winRate: Math.max(20, Math.min(80, baseWinRate)),
      avgWin: Math.max(500, Math.min(1200, baseAvgWin)),
      avgLoss: Math.max(200, Math.min(600, baseAvgLoss))
    })
  }
  
  return data
}

const metricsData = generateMetricsData()

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <p className="text-gray-900 dark:text-white font-medium">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.dataKey === 'winRate' 
              ? `Win Rate: ${entry.value.toFixed(1)}%`
              : entry.dataKey === 'avgWin'
              ? `Avg Win: $${entry.value.toFixed(0)}`
              : `Avg Loss: $${entry.value.toFixed(0)}`
            }
          </p>
        ))}
      </div>
    )
  }
  return null
}

export const MetricsOverTimeChart = React.memo(function MetricsOverTimeChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: '385px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Metrics Over Time</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
              >
                <span>Last 12 days</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-600 shadow-lg min-w-[120px]"
            >
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Last 12 days
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Last 30 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="h-72 w-full outline-none focus:outline-none">
          <ResponsiveContainer width="100%" height="100%" className="focus:outline-none [&>*]:focus:outline-none">
            <LineChart
              data={metricsData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              {/* Left Y-axis for win rate percentage */}
              <YAxis 
                yAxisId="percentage"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                width={40}
              />
              
              {/* Right Y-axis for dollar amounts */}
              <YAxis 
                yAxisId="dollars"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={(value) => `$${value}`}
                domain={[0, 1400]}
                width={35}
              />
              
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                height={10}
                tickMargin={0}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '8px',
                  fontSize: '11px'
                }}
                iconType="circle"
              />
              
              {/* Win Rate Line (percentage) */}
              <Line
                yAxisId="percentage"
                type="monotone"
                dataKey="winRate"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                name="Win %"
              />
              
              {/* Average Win Line (dollars) */}
              <Line
                yAxisId="dollars"
                type="monotone"
                dataKey="avgWin"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                name="Avg Win ($)"
              />
              
              {/* Average Loss Line (dollars) */}
              <Line
                yAxisId="dollars"
                type="monotone"
                dataKey="avgLoss"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                name="Avg Loss ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
})