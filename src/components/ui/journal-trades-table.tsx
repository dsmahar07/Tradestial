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

const formatCurrency = (value: number): string => {
  if (!isFinite(value) || isNaN(value)) return '$0'
  const absValue = Math.abs(value)
  if (absValue >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (absValue >= 1_000) return `$${(value / 1_000).toFixed(1)}k`
  return `$${Math.round(value).toLocaleString()}`
}

const getAvatarColor = (symbol: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
    'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
  ]
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

const getInitials = (symbol: string) => {
  return symbol?.slice(0, 2).toUpperCase() || 'XX'
}

export default function JournalTradesTable({ trades }: JournalTradesTableProps) {
  if (!trades || trades.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">No trades for this day.</div>
    )
  }

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
      <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto" style={{ minWidth: '800px' }}>
            <thead className="bg-white dark:bg-[#0f0f0f] border-b-2 border-gray-300 dark:border-[#2a2a2a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[140px]">
                  Symbol
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[110px]">
                  Open Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px]">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[110px]">
                  Close Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                  Entry Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                  Exit Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[130px]">
                  Net P&L
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                  Net ROI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#0f0f0f] divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {trades.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                  <td className="px-6 py-4 w-[140px]">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(t.symbol)}`}>
                        {getInitials(t.symbol)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.symbol}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[110px]">
                    {t.openDate ? new Date(t.openDate).toLocaleDateString('en-US', { 
                      day: '2-digit', 
                      month: 'short'
                    }) : timePart(t.entryTime || t.openTime)}
                  </td>
                  <td className="px-4 py-4 w-[90px]">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        t.netPnl >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {t.netPnl >= 0 ? 'Win' : 'Loss'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[110px]">
                    {t.closeDate ? new Date(t.closeDate).toLocaleDateString('en-US', { 
                      day: '2-digit', 
                      month: 'short'
                    }) : timePart(t.exitTime || t.closeTime)}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[120px]">
                    {formatCurrency(t.entryPrice)}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[120px]">
                    {formatCurrency(t.exitPrice)}
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-medium text-gray-900 dark:text-gray-100 w-[130px]">
                    <span 
                      style={{
                        color: t.netPnl >= 0 ? '#10b981' : '#ef4444'
                      }}
                    >
                      {formatCurrency(t.netPnl)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[100px]">
                    <span 
                      style={{
                        color: (t.netRoi || 0) >= 0 ? '#10b981' : '#ef4444'
                      }}
                    >
                      {t.netRoi != null ? `${(t.netRoi * 100).toFixed(2)}%` : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
