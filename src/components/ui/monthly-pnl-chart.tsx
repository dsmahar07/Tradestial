'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { useState } from 'react'

const monthlyData = [
  { month: 'Jan', pnl: 12500, cumulative: 12500, trades: 45 },
  { month: 'Feb', pnl: -3200, cumulative: 9300, trades: 38 },
  { month: 'Mar', pnl: 8900, cumulative: 18200, trades: 52 },
  { month: 'Apr', pnl: 15600, cumulative: 33800, trades: 61 },
  { month: 'May', pnl: -5400, cumulative: 28400, trades: 42 },
  { month: 'Jun', pnl: 22100, cumulative: 50500, trades: 67 },
  { month: 'Jul', pnl: 18750, cumulative: 69250, trades: 59 },
  { month: 'Aug', pnl: -2800, cumulative: 66450, trades: 35 },
  { month: 'Sep', pnl: 13400, cumulative: 79850, trades: 48 },
  { month: 'Oct', pnl: 19200, cumulative: 99050, trades: 63 },
  { month: 'Nov', pnl: 7650, cumulative: 106700, trades: 41 },
  { month: 'Dec', pnl: 14084, cumulative: 120784, trades: 55 }
]

const timeRanges = ['This Year', '2023', '2022', 'All Time']

export function MonthlyPnlChart() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Year')
  const [chartType, setChartType] = useState<'monthly' | 'cumulative'>('cumulative')

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label} 2024</p>
          <div className="space-y-1">
            {chartType === 'monthly' ? (
              <div className={`flex items-center justify-between space-x-4 ${
                data.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <span>Monthly P&L:</span>
                <span className="font-semibold">${data.pnl.toLocaleString()}</span>
              </div>
            ) : (
              <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
                <span>Cumulative P&L:</span>
                <span className="font-semibold">${data.cumulative.toLocaleString()}</span>
              </div>
            )}
            <div className="text-gray-600 dark:text-gray-300 flex items-center justify-between space-x-4">
              <span>Trades:</span>
              <span>{data.trades}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            P&L Performance
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {chartType === 'monthly' ? 'Monthly' : 'Cumulative'} profit and loss over time
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                chartType === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setChartType('cumulative')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                chartType === 'cumulative'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Cumulative
            </button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-gray-700"
              >
                {selectedTimeRange}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {timeRanges.map((range) => (
                <DropdownMenuItem
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={selectedTimeRange === range ? 'bg-gray-100 dark:bg-gray-800' : ''}
                >
                  {range}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartType === 'monthly' ? "#10b981" : "#3b82f6"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={chartType === 'monthly' ? "#10b981" : "#3b82f6"} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            {chartType === 'monthly' && <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />}
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={chartType === 'monthly' ? 'pnl' : 'cumulative'}
              stroke={chartType === 'monthly' ? "#10b981" : "#3b82f6"}
              strokeWidth={2}
              fill="url(#pnlGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}