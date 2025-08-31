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
  ComposedChart,
  Bar,
  Line,
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

const strategyData = [
  {
    name: 'Momentum',
    totalPnl: 45680,
    trades: 156,
    winRate: 68.6,
    avgWin: 425.30,
    avgLoss: -187.50,
    maxDrawdown: 5.2,
    sharpe: 1.8,
    allocation: 35,
    color: '#10b981'
  },
  {
    name: 'Mean Reversion',
    totalPnl: 32150,
    trades: 98,
    winRate: 72.4,
    avgWin: 380.20,
    avgLoss: -145.80,
    maxDrawdown: 3.8,
    sharpe: 2.1,
    allocation: 25,
    color: '#3b82f6'
  },
  {
    name: 'Breakout',
    totalPnl: 28740,
    trades: 74,
    winRate: 59.5,
    avgWin: 520.40,
    avgLoss: -235.60,
    maxDrawdown: 8.1,
    sharpe: 1.4,
    allocation: 20,
    color: '#f59e0b'
  },
  {
    name: 'Scalping',
    totalPnl: 18920,
    trades: 267,
    winRate: 78.3,
    avgWin: 125.80,
    avgLoss: -89.20,
    maxDrawdown: 2.1,
    sharpe: 1.6,
    allocation: 15,
    color: '#8b5cf6'
  },
  {
    name: 'News Trading',
    totalPnl: -4706,
    trades: 23,
    winRate: 43.5,
    avgWin: 680.90,
    avgLoss: -425.30,
    maxDrawdown: 12.4,
    sharpe: -0.3,
    allocation: 5,
    color: '#ef4444'
  }
]

const symbolPerformance = [
  { symbol: 'NQ', strategy: 'Momentum', pnl: 12450, trades: 45, winRate: 66.7 },
  { symbol: 'ES', strategy: 'Mean Reversion', pnl: 8920, trades: 32, winRate: 75.0 },
  { symbol: 'YM', strategy: 'Breakout', pnl: 6780, trades: 18, winRate: 61.1 },
  { symbol: 'RTY', strategy: 'Momentum', pnl: 5640, trades: 28, winRate: 71.4 },
  { symbol: 'CL', strategy: 'Scalping', pnl: 4320, trades: 67, winRate: 80.6 },
  { symbol: 'GC', strategy: 'Mean Reversion', pnl: 3890, trades: 21, winRate: 76.2 }
]

export function StrategyBreakdown() {
  const [selectedView, setSelectedView] = useState<'strategy' | 'symbol'>('strategy')
  const [selectedMetric, setSelectedMetric] = useState<'pnl' | 'winRate' | 'sharpe'>('pnl')

  const views = [
    { id: 'strategy', label: 'By Strategy' },
    { id: 'symbol', label: 'By Symbol' }
  ]

  const metrics = [
    { id: 'pnl', label: 'Total P&L' },
    { id: 'winRate', label: 'Win Rate' },
    { id: 'sharpe', label: 'Sharpe Ratio' }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="font-medium text-gray-900 dark:text-white mb-3">{label}</p>
          <div className="space-y-2">
            {selectedView === 'strategy' ? (
              <>
                <div className={`flex items-center justify-between space-x-4 ${
                  data.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <span>Total P&L:</span>
                  <span className="font-semibold">${data.totalPnl.toLocaleString()}</span>
                </div>
                <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
                  <span>Trades:</span>
                  <span>{data.trades}</span>
                </div>
                <div className="text-purple-600 dark:text-purple-400 flex items-center justify-between space-x-4">
                  <span>Win Rate:</span>
                  <span>{data.winRate.toFixed(1)}%</span>
                </div>
                <div className="text-orange-600 dark:text-orange-400 flex items-center justify-between space-x-4">
                  <span>Sharpe Ratio:</span>
                  <span>{data.sharpe.toFixed(2)}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 flex items-center justify-between space-x-4">
                  <span>Max DD:</span>
                  <span>{data.maxDrawdown.toFixed(1)}%</span>
                </div>
              </>
            ) : (
              <>
                <div className={`flex items-center justify-between space-x-4 ${
                  data.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <span>P&L:</span>
                  <span className="font-semibold">${data.pnl.toLocaleString()}</span>
                </div>
                <div className="text-blue-600 dark:text-blue-400 flex items-center justify-between space-x-4">
                  <span>Trades:</span>
                  <span>{data.trades}</span>
                </div>
                <div className="text-purple-600 dark:text-purple-400 flex items-center justify-between space-x-4">
                  <span>Win Rate:</span>
                  <span>{data.winRate.toFixed(1)}%</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 flex items-center justify-between space-x-4">
                  <span>Strategy:</span>
                  <span>{data.strategy}</span>
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
              <span>Allocation:</span>
              <span className="font-semibold">{data.allocation}%</span>
            </div>
            <div className={`flex items-center justify-between space-x-4 ${
              data.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <span>P&L:</span>
              <span>${data.totalPnl.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const getChartData = () => {
    if (selectedView === 'strategy') {
      return strategyData.map(item => ({
        ...item,
        value: selectedMetric === 'pnl' ? item.totalPnl : 
               selectedMetric === 'winRate' ? item.winRate : item.sharpe
      }))
    } else {
      return symbolPerformance.map(item => ({
        ...item,
        value: selectedMetric === 'pnl' ? item.pnl : item.winRate
      }))
    }
  }

  const chartData = getChartData()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Strategy & Symbol Analysis
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Performance breakdown by trading strategies and symbols
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-gray-700"
              >
                {views.find(v => v.id === selectedView)?.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {views.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => setSelectedView(view.id as any)}
                  className={selectedView === view.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
                >
                  {view.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-gray-700"
              >
                {metrics.find(m => m.id === selectedMetric)?.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {metrics.map((metric) => (
                <DropdownMenuItem
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric.id as any)}
                  className={selectedMetric === metric.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
                >
                  {metric.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey={selectedView === 'strategy' ? 'name' : 'symbol'}
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
                tickFormatter={(value) => 
                  selectedMetric === 'pnl' ? `$${(value / 1000).toFixed(0)}k` :
                  selectedMetric === 'winRate' ? `${value}%` :
                  value.toFixed(1)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
              {selectedView === 'strategy' && (
                <Line
                  type="monotone"
                  dataKey="trades"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  yAxisId="right"
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Strategy Allocation Pie Chart */}
        {selectedView === 'strategy' && (
          <div className="h-80">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Capital Allocation
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={strategyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="allocation"
                >
                  {strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Symbol Performance Table */}
        {selectedView === 'symbol' && (
          <div className="h-80 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Performance Summary
            </h4>
            <div className="space-y-2">
              {symbolPerformance.map((item, index) => (
                <div 
                  key={item.symbol}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {item.symbol}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.symbol}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.strategy}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      item.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${item.pnl.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.winRate.toFixed(1)}% • {item.trades} trades
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strategy Performance Summary */}
      {selectedView === 'strategy' && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {strategyData.filter(s => s.totalPnl > 0).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Profitable</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {strategyData.reduce((sum, s) => sum + s.trades, 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Trades</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {(strategyData.reduce((sum, s) => sum + s.winRate * s.trades, 0) / 
                strategyData.reduce((sum, s) => sum + s.trades, 0)).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Win Rate</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {Math.max(...strategyData.map(s => s.maxDrawdown)).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Max Drawdown</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {(strategyData.reduce((sum, s) => sum + s.sharpe * Math.abs(s.totalPnl), 0) / 
                strategyData.reduce((sum, s) => sum + Math.abs(s.totalPnl), 0)).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Sharpe</div>
          </div>
        </div>
      )}
    </motion.div>
  )
}