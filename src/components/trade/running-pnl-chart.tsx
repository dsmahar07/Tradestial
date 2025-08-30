'use client'

import { useMemo, useId } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'

interface RunningPnlChartProps {
  trade: any
}

export function RunningPnlChart({ trade }: RunningPnlChartProps) {
  // Build running P&L from trade if possible, else fallback to a small demo series
  const baseSeries = useMemo(() => {
    const fallback = [
      { time: '09:30', value: 0 },
      { time: '09:45', value: 150 },
      { time: '10:00', value: -50 },
      { time: '10:15', value: 200 },
      { time: '10:30', value: 120 },
    ]
    if (!trade) return fallback
    const entry = Number(trade.entryPrice || 0)
    const exit = Number(trade.exitPrice || entry)
    const pnl = Number(trade.netPnl || 0)
    const qty = Number(trade.contractsTraded || 1)
    const sideMul = trade.side === 'SHORT' ? -1 : 1
    const totalPoints = 40
    const arr: { time: string; value: number }[] = []
    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints
      const price = entry + t * (exit - entry)
      const noise = (Math.sin(i / 3) * (Math.abs(exit - entry) * 0.15))
      const curPrice = price + noise
      const v = (curPrice - entry) * qty * sideMul
      const hh = 9 + Math.floor((t * 120) / 60) // 9..11 ish
      const mm = Math.floor((t * 120) % 60).toString().padStart(2, '0')
      arr.push({ time: `${hh}:${mm}`, value: Math.round(v * 100) / 100 })
    }
    if (arr.length) arr[arr.length - 1].value = pnl
    return arr
  }, [trade])

  // Map to numeric index, insert zero-crossings, split pos/neg for gradient clipping
  const chartData = useMemo(() => {
    const base = baseSeries.map((d, i) => {
      let v = Number(d.value || 0)
      // Normalize -0 to 0 to avoid tiny negative zero artifacts
      if (Object.is(v, -0)) v = 0
      return { idx: i, label: d.time ?? String(i), value: v }
    })
    const expanded: Array<{ idx: number; label: string; value: number }> = []
    for (let i = 0; i < base.length; i++) {
      const cur = base[i]
      const prev = i > 0 ? base[i - 1] : undefined
      if (prev) {
        const s1 = Math.sign(prev.value)
        const s2 = Math.sign(cur.value)
        if (s1 !== 0 && s2 !== 0 && s1 !== s2) {
          const dv = cur.value - prev.value
          const di = cur.idx - prev.idx || 1
          const t = Math.abs(prev.value) / Math.abs(dv)
          const xi = prev.idx + t * di
          expanded.push({ idx: xi, label: cur.label, value: 0 })
        }
      }
      expanded.push(cur)
    }
    const result = expanded
      .sort((a, b) => a.idx - b.idx)
      .map(p => {
        // At exactly zero, set both pos and neg to 0 to avoid a visible seam between the two areas
        if (p.value === 0) return { ...p, pos: 0 as number, neg: 0 as number }
        return {
          ...p,
          pos: p.value > 0 ? p.value : (null as unknown as number),
          neg: p.value < 0 ? p.value : (null as unknown as number)
        }
      })
    return result
  }, [baseSeries])

  // Unique gradient IDs per instance to prevent cross-chart ID collisions
  const uid = useId()
  const posGradId = `run-pos-${uid}`
  const negGradId = `run-neg-${uid}`

  return (
    <div className="p-6 bg-white dark:bg-[#171717] h-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">Running P&L</h3>
      </div>

      <div className="h-96 -ml-2 overflow-visible w-full" style={{ width: 'calc(100% + 8px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
            <defs>
              {/* Match Cumulative PnL gradients */}
              <linearGradient id={posGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id={negGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            <XAxis 
              type="number" 
              dataKey="idx" 
              domain={["dataMin", "dataMax"]} 
              allowDecimals={false}
              scale="linear"
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
              className="dark:fill-gray-400"
              padding={{ left: 0, right: 0 }}
              height={25}
              tickMargin={5}
              tickFormatter={(value) => {
                const v = typeof value === 'number' ? value : Number(value)
                const d = chartData.find(pt => pt.idx === v)
                const label = (d as any)?.label || ''
                return label
              }}
              interval="preserveStartEnd"
              tickCount={6}
              minTickGap={20}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              className="dark:fill-gray-400"
              tickFormatter={(value) => {
                if (value === 0) return '$0';
                return `$${(Number(value)/1000).toFixed(1)}k`;
              }}
              width={60}
              tickMargin={8}
              padding={{ top: 0, bottom: 0 }}
              domain={([dataMin, dataMax]: [number, number]) => [
                Math.min(0, dataMin as number),
                Math.max(0, dataMax as number)
              ]}
            />
            <Tooltip
              // Match Cumulative PnL tooltip: only show value, styled
              cursor={false}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const p = payload.find((pp: any) => pp.dataKey === 'value') || payload[0]
                  const value = p?.value ?? p?.payload?.value
                  if (value === undefined || value === null) {
                    return (
                      <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                        <div className="font-semibold text-gray-500">No data</div>
                      </div>
                    )
                  }
                  const vNum = Number(value)
                  const formatted = vNum >= 0 ? `$${vNum.toLocaleString()}` : `-$${Math.abs(vNum).toLocaleString()}`
                  return (
                    <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                      <div className={`font-semibold ${vNum >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatted}</div>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" strokeWidth={1} />
            {/* Positive area */}
            <Area
              type="linear"
              dataKey="pos"
              stroke="none"
              fill={`url(#${posGradId})`}
              fillOpacity={1}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-in-out"
              baseValue={0}
            />
            {/* Negative area */}
            <Area
              type="linear"
              dataKey="neg"
              stroke="none"
              fill={`url(#${negGradId})`}
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
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-in-out"
              dot={false}
              activeDot={{ r: 4, fill: '#5B2CC9', stroke: '#fff', strokeWidth: 2 }}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}