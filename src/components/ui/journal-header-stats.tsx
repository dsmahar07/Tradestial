'use client'

import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts'

export interface HeaderStatsData {
  totalTrades: number
  winners: number
  losers: number
  winrate: string
  grossPnl: number
  volume: number
  commissions: number
  profitFactor: number
}

export interface TimePoint { time: string; value: number }

interface JournalHeaderStatsProps {
  chartData: TimePoint[]
  stats: HeaderStatsData
}

export default function JournalHeaderStats({ chartData, stats }: JournalHeaderStatsProps) {
  const formatCurrency = (v: number) => (v < 0 ? `-$${Math.abs(v)}` : `$${v}`)
  const processChartData = (data: TimePoint[]) => {
    if (!data || data.length === 0) return [{ time: '09:30', value: 0 }, { time: '16:00', value: 0 }]
    const processed: TimePoint[] = []
    for (let i = 0; i < data.length; i++) {
      const curr = data[i]
      const next = data[i + 1]
      processed.push(curr)
      if (next) {
        const a = curr.value || 0
        const b = next.value || 0
        const crosses = (a > 0 && b < 0) || (a < 0 && b > 0)
        const involvesZero = a === 0 || b === 0
        if (crosses && !involvesZero) {
          const ratio = Math.abs(a) / (Math.abs(a) + Math.abs(b))
          let crossingTime = curr.time
          try {
            const [h1, m1] = curr.time.split(':').map(Number)
            const [h2, m2] = next.time.split(':').map(Number)
            const t1 = h1 * 60 + m1
            const t2 = h2 * 60 + m2
            const diff = (t2 - t1 + 24 * 60) % (24 * 60)
            const cross = t1 + diff * ratio
            const ch = Math.floor(cross / 60) % 24
            const cm = Math.floor(cross % 60)
            crossingTime = `${String(ch).padStart(2, '0')}:${String(cm).padStart(2, '0')}`
          } catch {}
          processed.push({ time: crossingTime, value: 0 })
        }
      }
    }
    return processed
  }

  return (
    <div className="w-full flex flex-row gap-8">
      <div className="flex-shrink-0 w-full sm:w-[380px] h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processChartData(chartData)} margin={{ top: 5, right: 5, left: 40, bottom: 5 }}>
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={false} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `$${v}`} domain={[0, 'dataMax + 10']} width={35} />
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d: any = payload[0].payload
                  return (
                    <div className="bg-background border rounded-lg p-2">
                      <p className="text-xs font-medium">{d.time}</p>
                      <p className="text-xs font-medium" style={{ color: d.value >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(d.value)}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <defs>
              <linearGradient id="greenGradientHeader" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                <stop offset="100%" stopColor="rgba(34, 197, 94, 0.3)" />
              </linearGradient>
              <linearGradient id="redGradientHeader" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.3)" />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey={(d: any) => (d.value > 0 ? d.value : 0)} stroke="none" fill="url(#greenGradientHeader)" fillOpacity={0.7} isAnimationActive={false} baseValue={0} connectNulls />
            <Area type="monotone" dataKey={(d: any) => (d.value < 0 ? d.value : 0)} stroke="none" fill="url(#redGradientHeader)" fillOpacity={0.7} isAnimationActive={false} baseValue={0} connectNulls />
            <Area type="monotone" dataKey="value" stroke="#3559E9" strokeWidth={2} fill="transparent" isAnimationActive={false} dot={false} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" strokeWidth={1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-6">
        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
          <div className="pr-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total trades</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalTrades}</div>
          </div>
          <div className="px-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winners</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.winners}</div>
          </div>
          <div className="px-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross P&L</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.grossPnl)}</div>
          </div>
          <div className="pl-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Commissions</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.commissions)}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
          <div className="pr-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winrate</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.winrate}</div>
          </div>
          <div className="px-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Losers</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.losers}</div>
          </div>
          <div className="px-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Volume</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.volume}</div>
          </div>
          <div className="pl-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Profit factor</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.profitFactor}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
