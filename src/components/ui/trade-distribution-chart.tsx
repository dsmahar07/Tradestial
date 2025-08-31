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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { useState } from 'react'

const pnlDistribution = [
  { range: '< -$500', count: 12, percentage: 8.7 },
  { range: '-$500 to -$100', count: 18, percentage: 13.0 },
  { range: '-$100 to $0', count: 35, percentage: 25.4 },
  { range: '$0 to $100', count: 28, percentage: 20.3 },
  { range: '$100 to $500', count: 32, percentage: 23.2 },
  { range: '> $500', count: 13, percentage: 9.4 }
]

const tradeTypeData = [
  { name: 'Long Trades', value: 78, count: 267, color: '#10b981' },
  { name: 'Short Trades', value: 22, count: 75, color: '#ef4444' }
]

const timeDistribution = [
  { time: '9-10 AM', trades: 45, avgPnl: 125.50 },
  { time: '10-11 AM', trades: 62, avgPnl: 89.20 },
  { time: '11 AM-12 PM', trades: 38, avgPnl: 156.80 },
  { time: '12-1 PM', trades: 25, avgPnl: -23.40 },
  { time: '1-2 PM', trades: 41, avgPnl: 78.90 },
  { time: '2-3 PM', trades: 59, avgPnl: 201.30 },
  { time: '3-4 PM', trades: 72, avgPnl: 167.20 }
]

const durationData = [
  { duration: '< 1 min', count: 89, percentage: 26.0, avgPnl: 45.20 },
  { duration: '1-5 min', count: 127, percentage: 37.1, avgPnl: 78.50 },
  { duration: '5-15 min', count: 83, percentage: 24.3, avgPnl: 156.80 },
  { duration: '15-60 min', count: 35, percentage: 10.2, avgPnl: 234.60 },
  { duration: '> 1 hour', count: 8, percentage: 2.4, avgPnl: 487.30 }
]

export function TradeDistributionChart() {
  const [selectedChart, setSelectedChart] = useState<'pnl' | 'type' | 'time' | 'duration'>('pnl')

  const charts = [
    { id: 'pnl', label: 'P&L Distribution' },
    { id: 'type', label: 'Trade Types' },
    { id: 'time', label: 'Time Analysis' },
    { id: 'duration', label: 'Duration Analysis' }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1">
            {selectedChart === 'pnl' && (
              <>
                <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
                  <span>Trades:</span>
                  <span className="font-semibold">{data.count}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 flex items-center justify-between space-x-4">
                  <span>Percentage:</span>
                  <span>{data.percentage}%</span>
                </div>
              </>
            )}
            {selectedChart === 'time' && (
              <>
                <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
                  <span>Trades:</span>
                  <span className="font-semibold">{data.trades}</span>
                </div>
                <div className={`flex items-center justify-between space-x-4 ${
                  data.avgPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <span>Avg P&L:</span>
                  <span>${data.avgPnl.toFixed(2)}</span>
                </div>
              </>
            )}
            {selectedChart === 'duration' && (
              <>
                <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
                  <span>Trades:</span>
                  <span className="font-semibold">{data.count}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 flex items-center justify-between space-x-4">
                  <span>Percentage:</span>
                  <span>{data.percentage}%</span>
                </div>
                <div className="text-green-600 dark:text-green-400 flex items-center justify-between space-x-4">
                  <span>Avg P&L:</span>
                  <span>${data.avgPnl.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <div className="space-y-1">
            <div className="font-medium text-gray-900 dark:text-white">{data.name}</div>
            <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
              <span>Percentage:</span>
              <span className="font-semibold">{data.value}%</span>
            </div>
            <div className="text-gray-600 dark:text-gray-300 flex items-center justify-between space-x-4">
              <span>Count:</span>
              <span>{data.count}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    switch (selectedChart) {
      case 'pnl':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pnlDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="range" 
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'type':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tradeTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {tradeTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'time':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="time" 
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="trades" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'duration':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={durationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="duration" 
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trade Distribution Analysis
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analyze trading patterns and distributions
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-gray-700"
            >
              {charts.find(c => c.id === selectedChart)?.label}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {charts.map((chart) => (
              <DropdownMenuItem
                key={chart.id}
                onClick={() => setSelectedChart(chart.id as any)}
                className={selectedChart === chart.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
              >
                {chart.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="h-80">
        {renderChart()}
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-gray-900 dark:text-white">73.2%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">$156.80</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Win</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-red-600 dark:text-red-400">$87.40</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Loss</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">342</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Trades</div>
        </div>
      </div>
    </motion.div>
  )
}