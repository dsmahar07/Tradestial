'use client'

import { motion } from 'framer-motion'
import { ChevronDown, Calendar, Clock } from 'lucide-react'
import { Button } from './button'
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
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { useState } from 'react'

const dailyPerformance = [
  { day: 'Monday', avgPnl: 145.60, trades: 52, winRate: 65.4 },
  { day: 'Tuesday', avgPnl: 178.30, trades: 48, winRate: 70.8 },
  { day: 'Wednesday', avgPnl: 201.50, trades: 61, winRate: 73.8 },
  { day: 'Thursday', avgPnl: 167.20, trades: 55, winRate: 69.1 },
  { day: 'Friday', avgPnl: 189.80, trades: 46, winRate: 76.1 }
]

const hourlyPerformance = [
  { hour: '9:00', pnl: 1250, volume: 15 },
  { hour: '9:30', pnl: 2180, volume: 28 },
  { hour: '10:00', pnl: 1890, volume: 22 },
  { hour: '10:30', pnl: 3420, volume: 34 },
  { hour: '11:00', pnl: 2750, volume: 31 },
  { hour: '11:30', pnl: 1560, volume: 18 },
  { hour: '12:00', pnl: -450, volume: 8 },
  { hour: '12:30', pnl: -280, volume: 6 },
  { hour: '13:00', pnl: 890, volume: 12 },
  { hour: '13:30', pnl: 2340, volume: 26 },
  { hour: '14:00', pnl: 3780, volume: 41 },
  { hour: '14:30', pnl: 4200, volume: 45 },
  { hour: '15:00', pnl: 3950, volume: 38 },
  { hour: '15:30', pnl: 2890, volume: 29 }
]

const monthlyStats = [
  { month: 'Jan', profitableDays: 18, totalDays: 21, percentage: 85.7 },
  { month: 'Feb', profitableDays: 16, totalDays: 20, percentage: 80.0 },
  { month: 'Mar', profitableDays: 19, totalDays: 22, percentage: 86.4 },
  { month: 'Apr', profitableDays: 17, totalDays: 21, percentage: 81.0 },
  { month: 'May', profitableDays: 15, totalDays: 22, percentage: 68.2 },
  { month: 'Jun', profitableDays: 20, totalDays: 21, percentage: 95.2 },
  { month: 'Jul', profitableDays: 18, totalDays: 22, percentage: 81.8 },
  { month: 'Aug', profitableDays: 14, totalDays: 23, percentage: 60.9 },
  { month: 'Sep', profitableDays: 16, totalDays: 21, percentage: 76.2 },
  { month: 'Oct', profitableDays: 19, totalDays: 22, percentage: 86.4 },
  { month: 'Nov', profitableDays: 17, totalDays: 22, percentage: 77.3 },
  { month: 'Dec', profitableDays: 18, totalDays: 21, percentage: 85.7 }
]

export function PerformanceByTime() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'hourly' | 'monthly'>('daily')

  const timeframes = [
    { id: 'daily', label: 'Daily Performance' },
    { id: 'hourly', label: 'Hourly Breakdown' },
    { id: 'monthly', label: 'Monthly Consistency' }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1">
            {selectedTimeframe === 'daily' && (
              <>
                <div className={`flex items-center justify-between space-x-4 ${
                  data.avgPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <span>Avg P&L:</span>
                  <span className="font-semibold">${data.avgPnl.toFixed(2)}</span>
                </div>
                <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
                  <span>Trades:</span>
                  <span>{data.trades}</span>
                </div>
                <div className="text-purple-600 dark:text-purple-400 flex items-center justify-between space-x-4">
                  <span>Win Rate:</span>
                  <span>{data.winRate}%</span>
                </div>
              </>
            )}
            {selectedTimeframe === 'hourly' && (
              <>
                <div className={`flex items-center justify-between space-x-4 ${
                  data.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <span>P&L:</span>
                  <span className="font-semibold">${data.pnl.toLocaleString()}</span>
                </div>
                <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
                  <span>Volume:</span>
                  <span>{data.volume}</span>
                </div>
              </>
            )}
            {selectedTimeframe === 'monthly' && (
              <>
                <div className="text-green-600 dark:text-green-400 flex items-center justify-between space-x-4">
                  <span>Profitable Days:</span>
                  <span className="font-semibold">{data.profitableDays}/{data.totalDays}</span>
                </div>
                <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
                  <span>Success Rate:</span>
                  <span>{data.percentage.toFixed(1)}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    switch (selectedTimeframe) {
      case 'daily':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                className="dark:fill-gray-300"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                className="dark:fill-gray-400"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="avgPnl"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#dailyGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'hourly':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="hour" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                className="dark:fill-gray-300"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                className="dark:fill-gray-400"
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'monthly':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                className="dark:fill-gray-300"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                className="dark:fill-gray-400"
                tickFormatter={(value) => `${value}%`}
                domain={[50, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#monthlyGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getInsights = () => {
    switch (selectedTimeframe) {
      case 'daily':
        return {
          title: 'Weekly Performance Insights',
          points: [
            'Wednesday shows the highest average P&L at $201.50',
            'Friday has the best win rate at 76.1%',
            'Tuesday and Wednesday are the most consistent performers'
          ]
        }
      case 'hourly':
        return {
          title: 'Intraday Trading Patterns',
          points: [
            'Peak performance between 2:30-3:00 PM with $4,200 P&L',
            'Lunch period (12:00-1:00 PM) shows negative performance',
            'Market open (9:30-10:30 AM) provides strong opportunities'
          ]
        }
      case 'monthly':
        return {
          title: 'Monthly Consistency Analysis',
          points: [
            'June shows exceptional consistency at 95.2% profitable days',
            'August was the most challenging month at 60.9%',
            'Overall monthly consistency averages 79.5%'
          ]
        }
      default:
        return { title: '', points: [] }
    }
  }

  const insights = getInsights()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white dark:bg-[#171717] rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance by Time
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analyze trading performance across different time periods
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700"
            >
              {timeframes.find(t => t.id === selectedTimeframe)?.label}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {timeframes.map((timeframe) => (
              <DropdownMenuItem
                key={timeframe.id}
                onClick={() => setSelectedTimeframe(timeframe.id as any)}
                className={selectedTimeframe === timeframe.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
              >
                {timeframe.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="h-80 mb-6">
        {renderChart()}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {insights.title}
            </h4>
            <ul className="space-y-1">
              {insights.points.map((point, index) => (
                <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}