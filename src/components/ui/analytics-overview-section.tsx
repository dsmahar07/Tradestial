'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Info, ChevronDown } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Custom Tooltip Component for dark theme support
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-zinc-600 rounded-md shadow-lg px-2 py-1.5 text-xs">
        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-zinc-900 dark:text-white">
            <span className="font-medium">{formatter ? formatter(entry.value)[1] : entry.name}:</span>{' '}
            <span style={{ color: entry.color }}>{formatter ? formatter(entry.value)[0] : entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function AnalyticsOverviewSection() {
  return (
    <div className="space-y-6">
      {/* P&L Toggle and Top Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white dark:bg-[#171717] rounded-xl p-6">
          {/* P&L Toggle */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">P&L SHOWING</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-zinc-200 dark:border-zinc-700 text-gray-900 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 shadow-sm text-xs h-8"
                >
                  <span>GROSS P&L</span>
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="bg-white dark:bg-[#171717] shadow-lg min-w-[120px] border-0"
              >
                <DropdownMenuItem className="text-zinc-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer text-xs">
                  Gross P&L
                </DropdownMenuItem>
                <DropdownMenuItem className="text-zinc-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer text-xs">
                  Net P&L
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Your Stats Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">YOUR STATS</h2>
              <Info className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">(ALL DATES)</p>
          </div>

          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Best month</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">$4,337.5</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">in Jul 2025</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Lowest month</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">$687.5</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">in Jun 2025</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Average</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">$2,512.5</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">per Month</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Statistics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="bg-white dark:bg-[#171717] rounded-xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total P&L</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">$5,025</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average daily volume</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">1.78</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average winning trade</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">$1,069.77</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average losing trade</span>
                <span className="text-sm font-semibold text-red-600">-$561.87</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total number of trades</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">23</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Number of winning trades</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">11</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Number of losing trades</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">12</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Number of break even trades</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">0</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Max consecutive wins</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">4</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Max consecutive losses</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">4</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total commissions</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">$0</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total fees</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">$0</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total swap</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">$0</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Largest profit</span>
                <span className="text-sm font-semibold text-teal-600">$3,510</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Largest loss</span>
                <span className="text-sm font-semibold text-red-600">-$1,655</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average hold time (All trades)</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">1 hour, 34 minutes</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average hold time (Winning trades)</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">32 minutes</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average hold time (Losing trades)</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">2 hours, 30 minutes</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average hold time (Scratch trades)</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">N/A</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average trade P&L</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">$91.36</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Profit factor</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">1.75</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Open trades</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">1</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total trading days</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">18</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Winning days</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">10</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Losing days</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">7</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Breakeven days</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">1</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Logged days</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">2</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Max consecutive winning days</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">4</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Max consecutive losing days</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">2</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average daily P&L</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">$279.17</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average winning day P&L</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">$1,092.25</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average losing day P&L</span>
                <span className="text-sm font-semibold text-red-600">-$842.5</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Largest profitable day (Profits)</span>
                <span className="text-sm font-semibold text-teal-600">$3,082.5</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Largest losing day (Losses)</span>
                <span className="text-sm font-semibold text-red-600">-$2,725</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average planned R-Multiple</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">0R</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average realized R-Multiple</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">0R</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Trade expectancy</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">$218.48</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Max drawdown</span>
                <span className="text-sm font-semibold text-red-600">-$2,725</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Max drawdown, %</span>
                <span className="text-sm font-semibold text-red-600">-79.45</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average drawdown</span>
                <span className="text-sm font-semibold text-red-600">-$986.88</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average drawdown, %</span>
                <span className="text-sm font-semibold text-red-600">-58.76</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Gross Cumulative P&L Chart */}
          <div className="bg-white dark:bg-[#171717] rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">DAILY GROSS CUMULATIVE P&L</h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">(ALL DATES)</span>
              <div className="w-2 h-2 rounded-full bg-blue-500 ml-auto"></div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { date: '06/17/25', value: -2000 },
                  { date: '06/25/25', value: 1500 },
                  { date: '07/15/25', value: 3500 },
                  { date: '07/23/25', value: 5000 }
                ]}>
                  <defs>
                    <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={(value: any) => [`$${value}`, 'Cumulative P&L']} />}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#cumulativeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gross Daily P&L Bar Chart */}
          <div className="bg-white dark:bg-[#171717] rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">GROSS DAILY P&L</h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">(ALL DATES)</span>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { date: '06/18/25', value: -1000 },
                  { date: '06/19/25', value: -500 },
                  { date: '06/20/25', value: 3000 },
                  { date: '06/21/25', value: 200 },
                  { date: '06/27/25', value: -800 },
                  { date: '06/28/25', value: -300 },
                  { date: '07/01/25', value: 3000 },
                  { date: '07/16/25', value: -2500 },
                  { date: '07/17/25', value: 3000 },
                  { date: '07/18/25', value: 700 },
                  { date: '07/19/25', value: -500 },
                  { date: '07/24/25', value: 800 }
                ]}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={(value: any) => [`$${value}`, 'Daily P&L']} />}
                  />
                  <Bar dataKey="value">
                    {[
                      { date: '06/18/25', value: -1000 },
                      { date: '06/19/25', value: -500 },
                      { date: '06/20/25', value: 3000 },
                      { date: '06/21/25', value: 200 },
                      { date: '06/27/25', value: -800 },
                      { date: '06/28/25', value: -300 },
                      { date: '07/01/25', value: 3000 },
                      { date: '07/16/25', value: -2500 },
                      { date: '07/17/25', value: 3000 },
                      { date: '07/18/25', value: 700 },
                      { date: '07/19/25', value: -500 },
                      { date: '07/24/25', value: 800 }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}