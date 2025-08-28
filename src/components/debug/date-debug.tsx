'use client'

import { useEffect, useState } from 'react'
import { DataStore } from '@/services/data-store.service'
import { parseLocalDate, getDayOfWeek } from '@/utils/date-utils'
import { Trade } from '@/services/trade-data.service'
import { useChartData } from '@/hooks/use-analytics'

export function DateDebugComponent() {
  const [trades, setTrades] = useState<Trade[]>([])
  const { data: dailyPnLData } = useChartData('dailyPnL')

  useEffect(() => {
    setTrades(DataStore.getAllTrades())
    const unsubscribe = DataStore.subscribe(() => {
      setTrades(DataStore.getAllTrades())
    })
    return unsubscribe
  }, [])

  if (trades.length === 0) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <strong>Date Debug:</strong> No trades found. Import CSV to debug date parsing.
      </div>
    )
  }

  // Show first few trades and their date parsing
  const debugTrades = trades.slice(0, 3).map(trade => {
    const openDate = trade.openDate || ''
    const jsDate = new Date(openDate)
    const utilDate = parseLocalDate(openDate)
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    return {
      id: trade.id,
      openDate,
      jsDateDay: jsDate.getDay(),
      jsDateName: dayName[jsDate.getDay()],
      utilDateDay: utilDate.getDay(),
      utilDateName: dayName[utilDate.getDay()],
      getDayOfWeekResult: getDayOfWeek(openDate),
      getDayOfWeekName: dayName[getDayOfWeek(openDate)],
      pnl: trade.netPnl
    }
  })

  return (
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
      <strong>Date Debug Info:</strong>
      <div className="mt-2 text-sm">
        <div>Total trades: {trades.length}</div>
        <div>Timezone offset: {new Date().getTimezoneOffset()} minutes</div>
        
        {/* Chart Data Debug */}
        <div className="mt-2">
          <strong>Daily P&L Chart Data:</strong>
          {dailyPnLData && dailyPnLData.length > 0 ? (
            <div className="max-h-32 overflow-y-auto">
              {dailyPnLData.slice(0, 5).map((dataPoint: any, i: number) => {
                const dayOfWeek = getDayOfWeek(dataPoint.date || '')
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                return (
                  <div key={i} className="mt-1 p-1 bg-white rounded text-xs">
                    <div>Date: {dataPoint.date} → {dayNames[dayOfWeek]} (P&L: {dataPoint.pnl})</div>
                  </div>
                )
              })}
              {dailyPnLData.length > 5 && <div className="text-xs text-gray-600">...and {dailyPnLData.length - 5} more</div>}
            </div>
          ) : (
            <div className="text-xs text-gray-600">No chart data available</div>
          )}
        </div>
        
        <div className="mt-2">
          <strong>First 3 trades date parsing:</strong>
          {debugTrades.map((trade, i) => (
            <div key={i} className="mt-2 p-2 bg-white rounded border">
              <div>Trade ID: {trade.id}</div>
              <div>Open Date: {trade.openDate}</div>
              <div>JS Date.getDay(): {trade.jsDateDay} ({trade.jsDateName})</div>
              <div>Util parseLocalDate(): {trade.utilDateDay} ({trade.utilDateName})</div>
              <div>getDayOfWeek(): {trade.getDayOfWeekResult} ({trade.getDayOfWeekName})</div>
              <div>P&L: ${trade.pnl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}