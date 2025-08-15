'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

interface RunningPnlChartProps {
  trade: any
}

// Sample running P&L data
const runningPnlData = [
  { time: '19:45', value: 0 },
  { time: '19:50', value: 400 },
  { time: '19:55', value: 800 },
  { time: '20:00', value: 1200 },
  { time: '20:05', value: 1000 },
  { time: '20:10', value: 1400 },
  { time: '20:15', value: 1600 },
  { time: '20:20', value: 1800 },
  { time: '20:25', value: 1600 },
  { time: '20:30', value: 1900 },
  { time: '20:35', value: 2100 },
  { time: '20:40', value: 2025 }
]

export function RunningPnlChart({ trade }: RunningPnlChartProps) {
  return (
    <div className="p-6 bg-white dark:bg-[#171717] h-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">
          Running P&L
        </h3>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={runningPnlData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="runningPnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#runningPnlGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}