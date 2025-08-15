'use client'

import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts'

type Point = { period: string | number; value: number }

interface RunningPnlAreaProps {
  data: Point[]
  color?: string
  height?: number
}

export function RunningPnlArea({ data, color = '#10b981', height = 28 }: RunningPnlAreaProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="runPnlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="period" hide />
          <YAxis hide domain={[dataMin => Math.min(0, dataMin as number), dataMax => Math.max(0, dataMax as number)]} />
          <Area type="monotone" dataKey="value" stroke={color} fill="url(#runPnlGrad)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RunningPnlArea


