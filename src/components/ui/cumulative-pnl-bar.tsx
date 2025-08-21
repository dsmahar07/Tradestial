'use client'

import { motion } from 'framer-motion'
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { useState } from 'react'

interface PnlPeriod {
  period: string
  name: string
  cumulativePnl: number
  dailyPnl: number
  trades: number
  color: string
}

// Generate realistic daily cumulative PnL data
const generatePnlData = (): PnlPeriod[] => {
  const data: PnlPeriod[] = []
  let cumulativePnl = 0
  
  // Generate last 14 days of data
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // Simulate daily P&L with realistic volatility
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    let dailyPnl = 0
    let trades = 0
    
    if (!isWeekend) {
      // Trading days: simulate realistic P&L
      const volatility = Math.random() * 0.8 + 0.2 // 0.2 to 1.0
      const trend = Math.sin(i * 0.2) * 0.2 // Add some wave pattern
      dailyPnl = (Math.random() - 0.45 + trend) * 800 * volatility
      trades = Math.floor(Math.random() * 12) + 3
    } else {
      // Weekends: minimal or no trading
      dailyPnl = Math.random() > 0.8 ? (Math.random() - 0.5) * 200 : 0
      trades = Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0
    }
    
    cumulativePnl += dailyPnl
    
    data.push({
      period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      name: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      cumulativePnl: Math.round(cumulativePnl),
      dailyPnl: Math.round(dailyPnl),
      trades,
      color: cumulativePnl >= 0 ? '#10b981' : '#ef4444'
    })
  }
  
  return data
}

const pnlData = generatePnlData()

const timeRanges = ['Last 14 Days', 'Last 7 Days', 'This Month', 'All Time']
const metrics = ['Cumulative P&L', 'Daily P&L', 'Trade Count']

export function CumulativePnlBar() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 14 Days')
  const [selectedMetric, setSelectedMetric] = useState('Cumulative P&L')

  // Get data based on selected metric
  const getChartData = () => {
    switch (selectedMetric) {
      case 'Cumulative P&L':
        return pnlData.map(item => ({ 
          period: item.period, 
          name: item.name,
          value: item.cumulativePnl,
          color: item.cumulativePnl >= 0 ? '#10b981' : '#ef4444'
        }))
      case 'Daily P&L':
        return pnlData.map(item => ({ 
          period: item.period, 
          name: item.name,
          value: item.dailyPnl,
          color: item.dailyPnl >= 0 ? '#10b981' : '#ef4444'
        }))
      case 'Trade Count':
        return pnlData.map(item => ({ 
          period: item.period, 
          name: item.name,
          value: item.trades,
          color: '#3b82f6'
        }))
      default:
        return []
    }
  }

  const chartData = getChartData()

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="font-medium text-gray-900 dark:text-white mb-1">
            {data.period} - {data.name}
          </p>
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedMetric}: {
                selectedMetric === 'Trade Count' 
                  ? data.value
                  : `$${data.value.toLocaleString()}`
              }
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  // Format Y-axis labels
  const formatYAxisLabel = (value: number) => {
    if (selectedMetric === 'Trade Count') {
      return value.toString()
    }
    return `$${(value/1000).toFixed(0)}k`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: '385px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cumulative P&L
            </h3>
          </div>
          
          <div className="flex items-center space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm px-2 py-1 h-7"
                >
                  <span className="text-xs">{selectedMetric.split(' ')[0]}</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {metrics.map((metric) => (
                  <DropdownMenuItem
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={selectedMetric === metric ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  >
                    <span className="text-xs">{metric}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm px-2 py-1 h-7"
                >
                  <span className="text-xs">{selectedTimeRange.replace('Last ', '').replace(' Days', 'D').replace('This ', '').replace('All ', '')}</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28">
                {timeRanges.map((range) => (
                  <DropdownMenuItem
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={selectedTimeRange === range ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  >
                    <span className="text-xs">{range}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 5, left: -10, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                className="dark:stroke-gray-600"
                vertical={false}
              />
              <XAxis 
                dataKey="period" 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 12, 
                  fill: '#9ca3af',
                  fontWeight: 600
                }}
                className="dark:fill-gray-400"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 11, 
                  fill: '#9ca3af'
                }}
                className="dark:fill-gray-400"
                tickFormatter={formatYAxisLabel}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}