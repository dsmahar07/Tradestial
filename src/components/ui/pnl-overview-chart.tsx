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
import { BudgetIncomeIcon, BudgetExpensesIcon, BudgetScheduledIcon, PNLOverviewIcon } from './custom-icons'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

interface PNLData {
  month: string
  peakProfit: number
  peakLoss: number
  bookedPnl: number
}

const pnlDataSets = {
  'Last Year': [
    { month: 'J', peakProfit: 45, peakLoss: 15, bookedPnl: 30 },
    { month: 'F', peakProfit: 38, peakLoss: 12, bookedPnl: 26 },
    { month: 'M', peakProfit: 52, peakLoss: 18, bookedPnl: 34 },
    { month: 'A', peakProfit: 35, peakLoss: 22, bookedPnl: 13 },
    { month: 'M', peakProfit: 48, peakLoss: 8, bookedPnl: 40 },
    { month: 'J', peakProfit: 55, peakLoss: 20, bookedPnl: 35 },
    { month: 'J', peakProfit: 42, peakLoss: 16, bookedPnl: 26 },
    { month: 'A', peakProfit: 49, peakLoss: 14, bookedPnl: 35 },
    { month: 'S', peakProfit: 38, peakLoss: 18, bookedPnl: 20 },
    { month: 'O', peakProfit: 46, peakLoss: 12, bookedPnl: 34 },
    { month: 'N', peakProfit: 51, peakLoss: 19, bookedPnl: 32 },
    { month: 'D', peakProfit: 58, peakLoss: 15, bookedPnl: 43 },
  ],
  'This Year': [
    { month: 'J', peakProfit: 62, peakLoss: 18, bookedPnl: 44 },
    { month: 'F', peakProfit: 55, peakLoss: 25, bookedPnl: 30 },
    { month: 'M', peakProfit: 48, peakLoss: 15, bookedPnl: 33 },
    { month: 'A', peakProfit: 71, peakLoss: 28, bookedPnl: 43 },
    { month: 'M', peakProfit: 59, peakLoss: 22, bookedPnl: 37 },
    { month: 'J', peakProfit: 65, peakLoss: 19, bookedPnl: 46 },
    { month: 'J', peakProfit: 53, peakLoss: 24, bookedPnl: 29 },
    { month: 'A', peakProfit: 67, peakLoss: 16, bookedPnl: 51 },
    { month: 'S', peakProfit: 44, peakLoss: 21, bookedPnl: 23 },
    { month: 'O', peakProfit: 58, peakLoss: 17, bookedPnl: 41 },
    { month: 'N', peakProfit: 63, peakLoss: 26, bookedPnl: 37 },
    { month: 'D', peakProfit: 69, peakLoss: 20, bookedPnl: 49 },
  ],
  'Last Month': [
    { month: 'W1', peakProfit: 15, peakLoss: 8, bookedPnl: 7 },
    { month: 'W2', peakProfit: 22, peakLoss: 12, bookedPnl: 10 },
    { month: 'W3', peakProfit: 18, peakLoss: 6, bookedPnl: 12 },
    { month: 'W4', peakProfit: 25, peakLoss: 14, bookedPnl: 11 },
  ]
}

export function PnlOverviewChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<'Last Year' | 'This Year' | 'Last Month'>('Last Year')
  
  // Get current data based on selected period
  const currentData = pnlDataSets[selectedPeriod]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none [--tooltip-bg:white] dark:[--tooltip-bg:#171717] [--tooltip-border:#e5e7eb] dark:[--tooltip-border:#2a2a2a] [--tooltip-text:#374151] dark:[--tooltip-text:white]" style={{ height: '385px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <PNLOverviewIcon size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PNL Overview</h3>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Legend */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Peak Profit</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Peak Loss</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#3559E9]"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Booked PNL</span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
                >
                  <span>{selectedPeriod}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] shadow-lg min-w-[120px]"
              >
                <DropdownMenuItem 
                  className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer"
                  onClick={() => setSelectedPeriod('Last Year')}
                >
                  Last Year
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer"
                  onClick={() => setSelectedPeriod('This Year')}
                >
                  This Year
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer"
                  onClick={() => setSelectedPeriod('Last Month')}
                >
                  Last Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barGap={4}
              barCategoryGap="20%"
            >
              <XAxis 
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                className="dark:fill-gray-400"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                className="dark:fill-gray-400"
                tickFormatter={(value) => `$${value}K`}
              />
              <Tooltip
                formatter={(value, name) => [`$${value}K`, name]}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, white)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  color: 'var(--tooltip-text, #374151)'
                }}
                labelStyle={{ color: 'var(--tooltip-text, #374151)', fontWeight: '500' }}
              />
              <Bar 
                dataKey="peakProfit" 
                fill="url(#emeraldGradient)"
                name="Peak Profit"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
              />
              <Bar 
                dataKey="peakLoss" 
                fill="url(#redGradient)"
                name="Peak Loss"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationBegin={200}
                animationDuration={1200}
              />
              <Bar 
                dataKey="bookedPnl" 
                fill="#3559E9"
                name="Booked PNL"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationBegin={400}
                animationDuration={1200}
              />
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f87171" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}