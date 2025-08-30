'use client'

import React, { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'

interface ModelChartProps {
  trades: any[]
  title?: string
  height?: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  // Read from payload value first, then fallback to original datum to avoid nulls from split series
  const raw = payload[0]
  const value = raw?.value ?? raw?.payload?.value

  if (value === undefined || value === null) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className="font-semibold text-gray-500">No data</div>
      </div>
    )
  }

  const formattedValue = value >= 0 ? `$${Number(value).toLocaleString()}` : `-$${Math.abs(Number(value)).toLocaleString()}`

  return (
    <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
      <div className={`font-semibold ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formattedValue}</div>
    </div>
  )
}

export const ModelChart = React.memo(function ModelChart({ 
  trades, 
  title = "Cumulative P&L",
  height = 264
}: ModelChartProps) {
  // Calculate cumulative P&L data
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return []
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => {
      const dateA = new Date(a.openDate || a.date || 0).getTime()
      const dateB = new Date(b.openDate || b.date || 0).getTime()
      return dateA - dateB
    })
    
    let cumulativePnL = 0
    const dataPoints: { time: string; value: number; positiveValue: number | null; negativeValue: number | null; index: number }[] = []
    
    // Start with first trade to avoid artificial $0 point
    // Remove baseline point to prevent red dot on $0 axis
    
    let prevValue: number | null = null
    let runningIndex = 0
    sortedTrades.forEach((trade) => {
      const pnl = typeof trade.netPnl === 'number' ? trade.netPnl : 
                  typeof trade.pnl === 'number' ? trade.pnl : 
                  parseFloat(String(trade.netPnl || trade.pnl || 0))
      
      if (!isNaN(pnl)) {
        cumulativePnL += pnl
      }
      
      const date = new Date(trade.openDate || trade.date || Date.now())
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formattedDate = `${month}/${day}`
      
      const currentValue = cumulativePnL

      // If crossing zero between prev and current, insert a zero point first to meet at axis
      if (prevValue !== null && ((prevValue > 0 && currentValue < 0) || (prevValue < 0 && currentValue > 0))) {
        dataPoints.push({
          time: formattedDate,
          value: 0,
          positiveValue: 0,
          negativeValue: 0,
          index: runningIndex++
        })
      }

      dataPoints.push({
        time: formattedDate,
        value: currentValue,
        positiveValue: currentValue > 0 ? currentValue : null,
        negativeValue: currentValue < 0 ? currentValue : null,
        index: runningIndex++
      })

      prevValue = currentValue
    })
    
    return dataPoints
  }, [trades])

  if (!chartData.length) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 h-full" style={{ height }}>
        <div className="flex items-center mb-4">
          <h3 className="text-base font-semibold text-gray-500/80 dark:text-gray-400/70">{title}</h3>
        </div>
        <div className="my-2 -mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a]" />
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded">
          <p className="text-sm text-gray-500 dark:text-gray-400">No trade data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 h-full" style={{ height }}>
      <div className="flex items-center mb-4">
        <h3 className="text-base font-semibold text-gray-500/80 dark:text-gray-400/70">{title}</h3>
      </div>
      <div className="my-2 -mx-6 h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      <div className="-mx-3" style={{ height: height - 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 12, left: -4, bottom: 20 }}>
            <defs>
              {/* Green gradient for positive areas */}
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              {/* Red gradient for negative areas */}
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                {/* Stronger near the zero line (top), fading downward */}
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="index"
              type="number"
              domain={["dataMin", "dataMax"]}
              allowDecimals={false}
              scale="linear"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: '#9ca3af',
                fontWeight: 600
              }}
              tickFormatter={(value) => {
                const v = typeof value === 'number' ? value : Number(value)
                const d = chartData.find(pt => pt.index === v)
                const label = d?.time || ''
                return label
              }}
              interval="preserveStartEnd"
              minTickGap={20}
              hide={false}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: '#9ca3af'
              }}
              tickFormatter={(value) => {
                if (value === 0) return '$0';
                return `$${(value/1000).toFixed(1)}k`;
              }}
              domain={([dataMin, dataMax]: [number, number]) => [
                Math.min(0, dataMin),
                Math.max(0, dataMax)
              ]}
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
            />
            
            <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" strokeWidth={1} />
            
            {/* Positive area - only fills when line is above zero */}
            <Area
              type="linear"
              dataKey="positiveValue"
              stroke="none"
              fill="url(#positiveGradient)"
              fillOpacity={1}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-in-out"
              baseValue={0}
            />
            
            {/* Negative area - only fills when line is below zero */}
            <Area
              type="linear"
              dataKey="negativeValue"
              stroke="none"
              fill="url(#negativeGradient)"
              fillOpacity={1}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-in-out"
              baseValue={0}
            />
            
            {/* Main line stroke */}
            <Area
              type="linear"
              dataKey="value"
              stroke="#5B2CC9"
              strokeWidth={2.5}
              fill="none"
              connectNulls={true}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#5B2CC9",
                stroke: "#fff",
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})