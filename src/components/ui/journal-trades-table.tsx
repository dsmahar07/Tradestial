"use client"

import React from 'react'
import { Trade } from '@/services/trade-data.service'

interface JournalTradesTableProps {
  trades: Trade[]
}

const currency = (v: number) => (v < 0 ? `-$${Math.abs(Math.round(v))}` : `$${Math.round(v)}`)
const timePart = (value: string | undefined) => {
  if (!value) return ''
  const v = value.trim()
  // If it's already a time-only string like "07:57 AM" or "07:57"
  const timeOnly = /^(\d{1,2}:\d{2})(\s?[AP]M)?$/i
  if (timeOnly.test(v)) return v.toUpperCase()

  // If it's ISO-like with date+time, try to format time portion
  if (!isNaN(Date.parse(v))) {
    const d = new Date(v)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Unrecognized, return as-is (better than blank)
  return v
}

export default function JournalTradesTable({ trades }: JournalTradesTableProps) {
  if (!trades || trades.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">No trades for this day.</div>
    )
  }

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400">
              <th className="py-2 pr-4 font-medium">Symbol</th>
              <th className="py-2 px-4 font-medium">Open</th>
              <th className="py-2 px-4 font-medium">Close</th>
              <th className="py-2 px-4 font-medium">Entry</th>
              <th className="py-2 px-4 font-medium">Exit</th>
              <th className="py-2 px-4 font-medium">Net P&L</th>
              <th className="py-2 px-4 font-medium">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {trades.map((t) => (
              <tr key={t.id} className="text-gray-900 dark:text-gray-100">
                <td className="py-2 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
                      {t.symbol?.slice(0,2).toUpperCase()}
                    </span>
                    <span className="font-medium">{t.symbol}</span>
                  </span>
                </td>
                <td className="py-2 px-4">{timePart(t.entryTime || t.openTime)}</td>
                <td className="py-2 px-4">{timePart(t.exitTime || t.closeTime)}</td>
                <td className="py-2 px-4">{t.entryPrice != null ? `$${t.entryPrice}` : '-'}</td>
                <td className="py-2 px-4">{t.exitPrice != null ? `$${t.exitPrice}` : '-'}</td>
                <td className="py-2 px-4 font-semibold" style={{ color: t.netPnl >= 0 ? '#10b981' : '#ef4444' }}>{currency(t.netPnl)}</td>
                <td className="py-2 px-4">{t.netRoi != null ? `${Math.round(t.netRoi)}%` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
