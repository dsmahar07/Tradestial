"use client"

import React from 'react'
import JournalHeaderStats from '@/components/ui/journal-header-stats'

export type SharedTradingData = {
  netPnl?: number
  isProfit?: boolean
  stats?: any
  chartData?: Array<{ time: string; value: number }>
  trades?: any[]
  date?: string
}

export type SharedNoteInput = {
  title: string
  contentHtml: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  tradingData?: SharedTradingData
  sharedBy?: { name: string; initials?: string }
}

function TagChip({ label }: { label: string }) {
  const tagColors = [
    { bg: '#FB3748', hover: '#e12d3f' },
    { bg: '#1FC16B', hover: '#1ba85c' },
    { bg: '#F6B51E', hover: '#e0a31b' },
    { bg: '#7D52F4', hover: '#6b45e0' },
    { bg: '#FB4BA3', hover: '#e73d92' },
    { bg: '#3559E9', hover: '#2947d1' },
  ]
  const colorIndex = label.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % tagColors.length
  const selected = tagColors[colorIndex]

  return (
    <span
      className="relative inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
      style={{ backgroundColor: selected.bg }}
    >
      <span className="relative z-10">{label}</span>
    </span>
  )
}

export default function SharedNoteWidget({ note }: { note: SharedNoteInput }) {
  const td = note.tradingData

  const formatMaybeDateTitle = (t: string | undefined): string => {
    if (!t) return 'Untitled'
    const d = new Date(t)
    if (isNaN(d.getTime())) return t
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d)
  }

  return (
    <div className="bg-white dark:bg-[#0f0f0f] relative h-full max-h-full w-full rounded-xl overflow-hidden flex flex-col">
      {/* Shared by tag */}
      {note.sharedBy && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Shared by</span>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 dark:text-white">{note.sharedBy.name}</span>
            <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">{note.sharedBy.initials || (note.sharedBy.name?.[0] || '').toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-10 py-8 border-b border-gray-100 dark:border-[#2A2A2A] flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">{formatMaybeDateTitle(note.title)}</h1>

        {typeof td?.netPnl === 'number' && (
          <p className="mb-2 text-base md:text-lg">
            <span className={(td?.isProfit ? 'text-[#10B981]' : 'text-red-600 dark:text-red-400') + ' font-medium'}>Net P&L: </span>
            <span className={(td?.isProfit ? 'text-[#10B981]' : 'text-red-600 dark:text-red-400') + ' font-medium text-lg md:text-xl tabular-nums'}>
              {td.netPnl >= 0 ? '+' : ''}${Math.abs(td.netPnl).toLocaleString('en-US')}
            </span>
          </p>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {note.createdAt && (
            <span>
              Created: {new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date(note.createdAt))}
            </span>
          )}
          {note.updatedAt && note.createdAt && <span className="mx-2">•</span>}
          {note.updatedAt && (
            <span>
              Last updated: {new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date(note.updatedAt))}
            </span>
          )}
        </p>

        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((t, i) => (
              <TagChip key={`${t}-${i}`} label={t} />
            ))}
          </div>
        )}
      </div>

      {/* Analytics */}
      {td?.stats && td?.chartData && (
        <div className="px-10 py-8 border-b border-gray-100 dark:border-[#2A2A2A] flex-shrink-0">
          <JournalHeaderStats chartData={td.chartData as any} stats={td.stats as any} size="large" />
        </div>
      )}

      {/* Content */}
      <div className="px-10 py-8 flex-1 overflow-auto">
        <div className="prose prose-gray dark:prose-invert max-w-none font-inter" dangerouslySetInnerHTML={{ __html: note.contentHtml }} />
      </div>
    </div>
  )
}
