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
  const [hoveredBar, setHoveredBar] = useState<{index: number, type: string, value: number} | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'Last Year' | 'This Year' | 'Last Month'>('Last Year')
  
  // Get current data based on selected period
  const currentData = pnlDataSets[selectedPeriod]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none" style={{ height: '385px' }}>
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
                  className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
                >
                  <span>{selectedPeriod}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-600 shadow-lg min-w-[120px]"
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
        <div className="relative overflow-visible">
          <div className="flex h-72">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-56 py-2 pr-4 text-right">
              <span className="text-xs text-gray-600 dark:text-gray-400">$60K</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">$45K</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">$30K</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">$15K</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">$0</span>
            </div>
            
            {/* Chart bars */}
            <div className="flex items-end justify-center space-x-6 flex-1 px-4 relative">
              {currentData.map((item, index) => {
                const maxValue = Math.max(...currentData.map(d => Math.max(d.peakProfit, d.peakLoss, d.bookedPnl)))
                const maxHeight = 180
                const peakProfitHeight = (item.peakProfit / maxValue) * maxHeight
                const peakLossHeight = (item.peakLoss / maxValue) * maxHeight
                const bookedPnlHeight = (item.bookedPnl / maxValue) * maxHeight
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2 relative">
                    <div className="flex items-end space-x-1 h-48">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: peakProfitHeight }}
                        transition={{ duration: 1.2, delay: index * 0.1 }}
                        className="w-4 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ height: `${peakProfitHeight}px` }}
                        onMouseEnter={() => setHoveredBar({index, type: 'Peak Profit', value: item.peakProfit})}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: peakLossHeight }}
                        transition={{ duration: 1.2, delay: index * 0.1 + 0.2 }}
                        className="w-4 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ height: `${peakLossHeight}px` }}
                        onMouseEnter={() => setHoveredBar({index, type: 'Peak Loss', value: item.peakLoss})}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: bookedPnlHeight }}
                        transition={{ duration: 1.2, delay: index * 0.1 + 0.4 }}
                        className="w-4 rounded-t-sm shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ height: `${bookedPnlHeight}px`, backgroundColor: '#3559E9' }}
                        onMouseEnter={() => setHoveredBar({index, type: 'Booked PNL', value: item.bookedPnl})}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {item.month}
                    </span>
                    
                    {/* Tooltip */}
                    {hoveredBar && hoveredBar.index === index && (
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-200 dark:border-gray-600 whitespace-nowrap z-10">
                        {hoveredBar.type}: ${hoveredBar.value}K
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}