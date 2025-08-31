'use client'

import { motion } from 'framer-motion'
import { ChevronDown, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
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
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts'
import { useState } from 'react'

const comparativeData = [
  { month: 'Jan', myStrategy: 12500, benchmark: 8900, spx: 7200 },
  { month: 'Feb', myStrategy: 9300, benchmark: 9800, spx: 8100 },
  { month: 'Mar', myStrategy: 18200, benchmark: 12400, spx: 9900 },
  { month: 'Apr', myStrategy: 33800, benchmark: 18700, spx: 12800 },
  { month: 'May', myStrategy: 28400, benchmark: 17200, spx: 11200 },
  { month: 'Jun', myStrategy: 50500, benchmark: 26800, spx: 15600 },
  { month: 'Jul', myStrategy: 69250, benchmark: 34500, spx: 18900 },
  { month: 'Aug', myStrategy: 66450, benchmark: 35800, spx: 17800 },
  { month: 'Sep', myStrategy: 79850, benchmark: 42300, spx: 21400 },
  { month: 'Oct', myStrategy: 99050, benchmark: 51200, spx: 25100 },
  { month: 'Nov', myStrategy: 106700, benchmark: 54900, spx: 26800 },
  { month: 'Dec', myStrategy: 120784, benchmark: 62300, spx: 29500 }
]

const performanceMetrics = [
  {
    metric: 'Total Return',
    myStrategy: '120.8%',
    benchmark: '62.3%',
    spx: '29.5%',
    better: true
  },
  {
    metric: 'Annualized Return',
    myStrategy: '38.2%',
    benchmark: '18.7%',
    spx: '12.4%',
    better: true
  },
  {
    metric: 'Volatility',
    myStrategy: '18.2%',
    benchmark: '15.4%',
    spx: '16.8%',
    better: false
  },
  {
    metric: 'Sharpe Ratio',
    myStrategy: '1.94',
    benchmark: '1.21',
    spx: '0.74',
    better: true
  },
  {
    metric: 'Max Drawdown',
    myStrategy: '8.7%',
    benchmark: '12.4%',
    spx: '22.1%',
    better: true
  },
  {
    metric: 'Calmar Ratio',
    myStrategy: '4.39',
    benchmark: '1.51',
    spx: '0.56',
    better: true
  }
]

const correlationData = [
  { name: 'My Strategy vs S&P 500', correlation: 0.23, description: 'Low correlation provides diversification' },
  { name: 'My Strategy vs Benchmark', correlation: 0.67, description: 'Moderate correlation with enhanced returns' },
  { name: 'Benchmark vs S&P 500', correlation: 0.89, description: 'High correlation as expected' }
]

const rollingReturns = [
  { period: '1 Month', myStrategy: 14.1, benchmark: 8.2, spx: 3.4 },
  { period: '3 Months', myStrategy: 22.8, benchmark: 12.5, spx: 7.8 },
  { period: '6 Months', myStrategy: 45.6, benchmark: 28.3, spx: 15.2 },
  { period: '1 Year', myStrategy: 120.8, benchmark: 62.3, spx: 29.5 }
]

export function ComparativeAnalysis() {
  const [selectedComparison, setSelectedComparison] = useState<'cumulative' | 'rolling' | 'correlation'>('cumulative')

  const comparisons = [
    { id: 'cumulative', label: 'Cumulative Performance' },
    { id: 'rolling', label: 'Rolling Returns' },
    { id: 'correlation', label: 'Correlation Analysis' }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label} 2024</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {entry.dataKey === 'myStrategy' ? 'My Strategy' :
                     entry.dataKey === 'benchmark' ? 'Benchmark' : 'S&P 500'}:
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    switch (selectedComparison) {
      case 'cumulative':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparativeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="myStrategy"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="spx"
                stroke="#6b7280"
                strokeWidth={2}
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 3 }}
                strokeDasharray="2 2"
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'rolling':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rollingReturns} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="myStrategyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="spxGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="period" 
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
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value}%`,
                  name === 'myStrategy' ? 'My Strategy' :
                  name === 'benchmark' ? 'Benchmark' : 'S&P 500'
                ]}
              />
              <Area
                type="monotone"
                dataKey="myStrategy"
                stackId="1"
                stroke="#10b981"
                fill="url(#myStrategyGradient)"
              />
              <Area
                type="monotone"
                dataKey="benchmark"
                stackId="2"
                stroke="#3b82f6"
                fill="url(#benchmarkGradient)"
              />
              <Area
                type="monotone"
                dataKey="spx"
                stackId="3"
                stroke="#6b7280"
                fill="url(#spxGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'correlation':
        return (
          <div className="h-full flex flex-col justify-center space-y-6">
            {correlationData.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.correlation.toFixed(2)}
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.abs(item.correlation) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </div>
              </motion.div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
      className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comparative Analysis
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Performance comparison vs benchmarks and market indices
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-gray-700"
            >
              {comparisons.find(c => c.id === selectedComparison)?.label}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {comparisons.map((comparison) => (
              <DropdownMenuItem
                key={comparison.id}
                onClick={() => setSelectedComparison(comparison.id as any)}
                className={selectedComparison === comparison.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
              >
                {comparison.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 h-80">
          {renderChart()}
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Performance Comparison
          </h4>
          
          <div className="space-y-3">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={metric.metric}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 + index * 0.1 }}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {metric.metric}
                  </div>
                  {metric.better ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">My Strategy</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {metric.myStrategy}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Benchmark</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {metric.benchmark}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">S&P 500</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.spx}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-green-600 rounded"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">My Strategy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-blue-600 rounded border-dashed border border-blue-600"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Benchmark</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-gray-600 rounded border-dotted border border-gray-600"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">S&P 500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
              Performance Summary
            </h4>
            <p className="text-xs text-green-700 dark:text-green-300">
              Your strategy significantly outperforms both the benchmark and S&P 500 with 
              {' '}120.8% total return vs 62.3% and 29.5% respectively. The Sharpe ratio of 1.94 
              indicates excellent risk-adjusted returns, while the low correlation (0.23) with 
              the S&P 500 provides valuable diversification benefits.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}