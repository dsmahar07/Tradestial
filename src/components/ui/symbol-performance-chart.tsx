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

interface SymbolPerformance {
  symbol: string
  name: string
  pnl: number
  trades: number
  winRate: number
  avgTrade: number
  volume: number
}

// Sample futures symbols performance data
const symbolsData: SymbolPerformance[] = [
  {
    symbol: 'NQ',
    name: 'NASDAQ-100',
    pnl: 2850.75,
    trades: 24,
    winRate: 62.5,
    avgTrade: 118.78,
    volume: 48
  },
  {
    symbol: 'ES',
    name: 'S&P 500',
    pnl: 1420.50,
    trades: 18,
    winRate: 55.6,
    avgTrade: 78.92,
    volume: 36
  },
  {
    symbol: 'YM',
    name: 'Dow Jones',
    pnl: -245.25,
    trades: 8,
    winRate: 37.5,
    avgTrade: -30.66,
    volume: 16
  },
  {
    symbol: 'RTY',
    name: 'Russell 2000',
    pnl: 890.25,
    trades: 15,
    winRate: 60.0,
    avgTrade: 59.35,
    volume: 30
  },
  {
    symbol: 'CL',
    name: 'Crude Oil',
    pnl: 567.80,
    trades: 12,
    winRate: 58.3,
    avgTrade: 47.32,
    volume: 24
  },
  {
    symbol: 'GC',
    name: 'Gold',
    pnl: 1125.40,
    trades: 20,
    winRate: 65.0,
    avgTrade: 56.27,
    volume: 40
  }
]

const timeRanges = ['Today', 'This Week', 'This Month', 'All Time']
const metrics = ['P&L', 'Trade Count', 'Win Rate', 'Avg Trade']

export function SymbolPerformanceChart() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Month')
  const [selectedMetric, setSelectedMetric] = useState('P&L')

  // Get data based on selected metric
  const getChartData = () => {
    switch (selectedMetric) {
      case 'P&L':
        return symbolsData.map(item => ({ 
          symbol: item.symbol, 
          name: item.name,
          value: item.pnl,
          color: item.pnl >= 0 ? '#10b981' : '#ef4444'
        }))
      case 'Trade Count':
        return symbolsData.map(item => ({ 
          symbol: item.symbol, 
          name: item.name,
          value: item.trades,
          color: '#3b82f6'
        }))
      case 'Win Rate':
        return symbolsData.map(item => ({ 
          symbol: item.symbol, 
          name: item.name,
          value: item.winRate,
          color: item.winRate >= 50 ? '#10b981' : '#f59e0b'
        }))
      case 'Avg Trade':
        return symbolsData.map(item => ({ 
          symbol: item.symbol, 
          name: item.name,
          value: item.avgTrade,
          color: item.avgTrade >= 0 ? '#10b981' : '#ef4444'
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
            {data.symbol} - {data.name}
          </p>
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedMetric}: {
                selectedMetric === 'P&L' || selectedMetric === 'Avg Trade' 
                  ? `$${data.value.toFixed(2)}`
                  : selectedMetric === 'Win Rate'
                  ? `${data.value.toFixed(1)}%`
                  : data.value
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
    if (selectedMetric === 'P&L' || selectedMetric === 'Avg Trade') {
      return `$${value}`
    } else if (selectedMetric === 'Win Rate') {
      return `${value}%`
    }
    return value.toString()
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
              Symbol Performance
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
                >
                  <span>{selectedMetric}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {metrics.map((metric) => (
                  <DropdownMenuItem
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={selectedMetric === metric ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  >
                    {metric}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
                >
                  <span>{selectedTimeRange}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
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
                dataKey="symbol" 
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