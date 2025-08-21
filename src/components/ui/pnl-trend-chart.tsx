'use client'

import { AreaChart, Area, ResponsiveContainer, Line, LineChart } from 'recharts'

interface PnLTrendData {
  period: string
  value: number
}

interface PnLTrendChartProps {
  data: PnLTrendData[]
  color?: string
  height?: number
  animate?: boolean
}

export function PnLTrendChart({ 
  data, 
  color = '#ef4444', 
  height = 40, 
  animate = true 
}: PnLTrendChartProps) {
  // Determine if trend is positive or negative for styling
  const isPositive = data.length > 0 && data[data.length - 1].value > data[0].value
  const trendColor = isPositive ? '#10b981' : '#ef4444'
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ height: height + 10 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={trendColor} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={trendColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={false}
              animationDuration={animate ? 1500 : 0}
              animationBegin={animate ? 300 : 0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}