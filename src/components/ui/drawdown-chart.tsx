'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { LineChart, Line, Area, ComposedChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'

interface DrawdownData {
  date: string
  drawdown: number
  formattedDate: string
}

const sampleDrawdownData: DrawdownData[] = [
  { date: '06/17/25', drawdown: -100, formattedDate: '06/17/25' },
  { date: '06/18/25', drawdown: -800, formattedDate: '06/18/25' },
  { date: '06/19/25', drawdown: -1200, formattedDate: '06/19/25' },
  { date: '06/20/25', drawdown: -1800, formattedDate: '06/20/25' },
  { date: '06/21/25', drawdown: -1650, formattedDate: '06/21/25' },
  { date: '06/22/25', drawdown: -1200, formattedDate: '06/22/25' },
  { date: '06/23/25', drawdown: -800, formattedDate: '06/23/25' },
  { date: '06/24/25', drawdown: -200, formattedDate: '06/24/25' },
  { date: '06/25/25', drawdown: 0, formattedDate: '06/25/25' },
  { date: '06/26/25', drawdown: 0, formattedDate: '06/26/25' },
  { date: '06/27/25', drawdown: 0, formattedDate: '06/27/25' },
  { date: '06/28/25', drawdown: 0, formattedDate: '06/28/25' },
  { date: '06/29/25', drawdown: 0, formattedDate: '06/29/25' },
  { date: '06/30/25', drawdown: 0, formattedDate: '06/30/25' },
  { date: '07/01/25', drawdown: 0, formattedDate: '07/01/25' },
  { date: '07/02/25', drawdown: 0, formattedDate: '07/02/25' },
  { date: '07/03/25', drawdown: 0, formattedDate: '07/03/25' },
  { date: '07/04/25', drawdown: 0, formattedDate: '07/04/25' },
  { date: '07/05/25', drawdown: 0, formattedDate: '07/05/25' },
  { date: '07/06/25', drawdown: 0, formattedDate: '07/06/25' },
  { date: '07/07/25', drawdown: 0, formattedDate: '07/07/25' },
  { date: '07/08/25', drawdown: 0, formattedDate: '07/08/25' },
  { date: '07/09/25', drawdown: 0, formattedDate: '07/09/25' },
  { date: '07/10/25', drawdown: 0, formattedDate: '07/10/25' },
  { date: '07/11/25', drawdown: 0, formattedDate: '07/11/25' },
  { date: '07/12/25', drawdown: 0, formattedDate: '07/12/25' },
  { date: '07/13/25', drawdown: -200, formattedDate: '07/13/25' },
  { date: '07/14/25', drawdown: -800, formattedDate: '07/14/25' },
  { date: '07/15/25', drawdown: -2700, formattedDate: '07/15/25' },
  { date: '07/16/25', drawdown: -1800, formattedDate: '07/16/25' },
  { date: '07/17/25', drawdown: -800, formattedDate: '07/17/25' },
  { date: '07/18/25', drawdown: -200, formattedDate: '07/18/25' },
  { date: '07/19/25', drawdown: 0, formattedDate: '07/19/25' },
  { date: '07/20/25', drawdown: 0, formattedDate: '07/20/25' },
  { date: '07/21/25', drawdown: 0, formattedDate: '07/21/25' },
  { date: '07/22/25', drawdown: -300, formattedDate: '07/22/25' },
  { date: '07/23/25', drawdown: -100, formattedDate: '07/23/25' }
]

export const DrawdownChart = React.memo(function DrawdownChart() {
  const formatYAxis = (value: number) => {
    if (value === 0) return '$0'
    if (value <= -1000) return `-$${Math.abs(value / 1000).toFixed(1)}k`
    return `-$${Math.abs(value)}`
  }

  const yTicks = [0, -500, -1000, -1500, -2000, -2500, -3000]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.6 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '385px' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Drawdown
            </h3>
            <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm"
              >
                <span>All time</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-600 shadow-lg min-w-[120px]"
            >
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                All time
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Last month
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1f1f1f] cursor-pointer">
                Last week
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="h-[300px] w-full outline-none focus:outline-none">
          <ResponsiveContainer width="100%" height="100%" className="focus:outline-none [&>*]:focus:outline-none">
            <ComposedChart
              data={sampleDrawdownData}
              margin={{ top: 20, right: 15, left: 0, bottom: 25 }}
            >
              {yTicks.map((y) => (
                <ReferenceLine
                  key={`grid-y-${y}`}
                  y={y}
                  stroke="var(--grid)"
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                  style={{ shapeRendering: 'crispEdges' }}
                />
              ))}
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E93544" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#E93544" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 12, 
                  fill: '#9ca3af',
                  fontWeight: 600
                }}
                className="dark:fill-gray-400"
                height={25}
                tickMargin={5}
                tickFormatter={(value) => {
                  const parts = value.split('/')
                  return `${parts[0]}/${parts[1]}`
                }}
                interval="preserveStartEnd"
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 11, 
                  fill: '#9ca3af'
                }}
                className="dark:fill-gray-400"
                tickFormatter={formatYAxis}
                domain={[-3000, 0]}
                ticks={yTicks}
                padding={{ top: 5, bottom: 0 }}
                width={55}
              />
              
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="none"
                fill="url(#drawdownGradient)"
                fillOpacity={0.7}
                isAnimationActive={false}
                connectNulls={true}
              />
              
              <Line
                type="monotone"
                dataKey="drawdown"
                stroke="#2547D0"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls={true}
                activeDot={{
                  r: 6,
                  fill: "#2547D0",
                  stroke: "#fff",
                  strokeWidth: 2
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
})