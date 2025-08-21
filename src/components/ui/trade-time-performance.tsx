'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Info, Settings } from 'lucide-react'
import { Button } from './button'
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import { useTheme } from '@/hooks/use-theme'

const sampleTradeTimeData = [
  // Pre-market and market open (9:30-10:30)
  { x: 9.5, y: 450 },
  { x: 9.75, y: -200 },
  { x: 10.0, y: 800 },
  { x: 10.25, y: 650 },
  
  // Mid-morning (10:30-12:00)
  { x: 10.5, y: -300 },
  { x: 10.75, y: 1200 },
  { x: 11.0, y: 900 },
  { x: 11.25, y: -500 },
  { x: 11.5, y: 750 },
  { x: 11.75, y: -150 },
  
  // Lunch time (12:00-13:00) - typically slower
  { x: 12.0, y: -100 },
  { x: 12.25, y: 200 },
  { x: 12.5, y: -250 },
  { x: 12.75, y: 150 },
  
  // Afternoon (13:00-15:00)
  { x: 13.0, y: 1100 },
  { x: 13.25, y: 850 },
  { x: 13.5, y: -400 },
  { x: 13.75, y: 1350 },
  { x: 14.0, y: 950 },
  { x: 14.25, y: -600 },
  { x: 14.5, y: 1500 },
  { x: 14.75, y: 700 },
  
  // Power hour (15:00-16:00)
  { x: 15.0, y: 1800 },
  { x: 15.25, y: -800 },
  { x: 15.5, y: 2200 },
  { x: 15.75, y: 1600 },
  { x: 16.0, y: 950 }
]

export const TradeTimePerformance = React.memo(function TradeTimePerformance() {
  const { theme } = useTheme()
  // Detect dark mode using document class to avoid comparing against a 'system' literal when theme typing doesn't include it
  const isDark = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) || theme === 'dark'

  const formatYAxis = (value: number) => {
    if (value === 0) return '$0'
    if (Math.abs(value) >= 1000) {
      const thousands = value / 1000
      // Show one decimal for non-integers to avoid label collisions (e.g., 1.5k vs 2k)
      const decimals = Number.isInteger(thousands) ? 0 : 1
      return `$${thousands.toFixed(decimals)}k`
    }
    return `$${value}`
  }

  const formatXAxis = (value: number) => {
    const hours = Math.floor(value)
    const minutes = Math.round((value - hours) * 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Derive domains and add slight jitter to reduce overlap
  const jitter = (n: number) => n + (Math.random() - 0.5) * 0.02
  const data = sampleTradeTimeData.map(d => ({ x: jitter(d.x), y: d.y }))
  const xs = data.map(d => d.x)
  const ys = data.map(d => d.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const padX = Math.max(0.05, (maxX - minX) * 0.05)
  // const padY = Math.max(100, (maxY - minY) * 0.05)

  const winners = data.filter(d => d.y >= 0)
  const losers = data.filter(d => d.y < 0)

  const tooltipBg = isDark ? 'bg-[#171717]' : 'bg-white'
  const tooltipBorder = isDark ? 'border-gray-600' : 'border-gray-200'

  // Build hourly x-axis ticks for better readability
  const startHour = Math.floor(Math.min(minX, 9.5))
  const endHour = Math.ceil(Math.max(maxX, 16))
  const hourlyTicks: number[] = []
  for (let h = startHour; h <= endHour; h += 0.5) {
    hourlyTicks.push(h)
  }

  // Generate fixed Y-axis ticks to prevent duplicates and stay within data range
  // Use symmetric bounds around zero with 500 steps
  const DATA_MIN = Math.min(-2000, Math.floor(minY / 500) * 500)
  const DATA_MAX = Math.max(2500, Math.ceil(maxY / 500) * 500)
  const niceMinY = DATA_MIN
  const niceMaxY = DATA_MAX
  const uniqueYTicks: number[] = []
  for (let y = niceMinY; y <= niceMaxY; y += 500) uniqueYTicks.push(y)

  const Dot = ({ cx, cy, fill, stroke }: { cx: number; cy: number; fill: string; stroke: string }) => (
    <circle cx={cx} cy={cy} r={4} fill={fill} stroke={stroke} strokeWidth={1.5} fillOpacity={0.9} />
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.8 }}
      className="focus:outline-none"
    >
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 text-gray-900 dark:text-white relative focus:outline-none [--grid:#e5e7eb] dark:[--grid:#262626]" style={{ height: '385px' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Trade time performance
            </h3>
            <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 py-1 h-7"
            >
              <Settings className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 py-1 h-7"
            >
              <Info className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="h-[320px] -ml-6 overflow-visible" style={{ width: 'calc(100% + 24px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 15, left: 0, bottom: 25 }}
            >
              <XAxis 
                type="number"
                dataKey="x"
                name="time"
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
                tickFormatter={formatXAxis}
                interval="preserveStartEnd"
              />
              {uniqueYTicks.map((y) => (
                <ReferenceLine
                  key={`grid-y-${y}`}
                  y={y}
                  stroke="var(--grid)"
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                  style={{ shapeRendering: 'crispEdges' }}
                />
              ))}
              <YAxis 
                type="number"
                dataKey="y"
                name="pnl"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 11, 
                  fill: '#9ca3af'
                }}
                className="dark:fill-gray-400"
                tickFormatter={formatYAxis}
                domain={[ niceMinY, niceMaxY ]}
                ticks={uniqueYTicks}
                width={55}
              />
              
              
              
              <Tooltip cursor={false} content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const p = payload[0].payload as { x: number; y: number }
                const time = formatXAxis(p.x)
                const pnl = p.y
                const signed = `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toLocaleString()}`
                return (
                  <div className={`${tooltipBg} border ${tooltipBorder} rounded-md px-2 py-1 text-xs shadow focus:outline-none`}>
                    <div className="font-medium mb-0.5">{time}</div>
                    <div className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>{signed}</div>
                  </div>
                )
              }} />
              {/* Legend intentionally omitted to match the reference look */}
              
              <Scatter 
                name="Profits"
                data={winners}
                fill="#10b981"
                stroke="#10b981"
                fillOpacity={0.8}
                isAnimationActive={false}
                shape={(props: any) => <Dot cx={props.cx} cy={props.cy} fill={props.fill} stroke={props.stroke} />}
              />
              <Scatter 
                name="Losses"
                data={losers}
                fill="#ef4444"
                stroke="#ef4444"
                fillOpacity={0.8}
                isAnimationActive={false}
                shape={(props: any) => <Dot cx={props.cx} cy={props.cy} fill={props.fill} stroke={props.stroke} />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
})