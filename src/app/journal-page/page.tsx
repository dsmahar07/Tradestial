'use client'

import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { NotebookEditor } from '@/components/features/notes/NotebookEditor'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { ProgressWidget } from '@/components/ui/progress-widget'
import TradingViewWidget from '@/components/ui/tradingview-widget'
import { themeColors } from '@/config/theme'
import { PageLoading } from '@/components/ui/loading-spinner'
import { DataStore } from '@/services/data-store.service'
import { RuleTrackingService } from '@/services/rule-tracking.service'
import JournalHeaderStats from '@/components/ui/journal-header-stats'
import JournalTradesTable from '@/components/ui/journal-trades-table'
import { MoodDisplayWidget } from '@/components/ui/mood-display-widget'

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  folder: string
  tags: string[]
  color?: string
}

function JournalPageContent() {
  usePageTitle('Journal')
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date') // Format: YYYY-MM-DD
  const [selectedYMD, setSelectedYMD] = useState<string>(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })
  
  // Helper function to get initial title based on date param or current date
  const getInitialTitle = () => {
    let targetDate = new Date()
    
    if (dateParam && dateParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse the date parameter (YYYY-MM-DD) carefully to avoid timezone issues
      const [year, month, day] = dateParam.split('-').map(num => parseInt(num, 10))
      const parsedDate = new Date(year, month - 1, day) // month is 0-indexed
      
      // Validate the parsed date
      if (!isNaN(parsedDate.getTime()) && 
          parsedDate.getFullYear() === year && 
          parsedDate.getMonth() === month - 1 && 
          parsedDate.getDate() === day) {
        targetDate = parsedDate
      }
    }
    
    return targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const [currentNote, setCurrentNote] = useState<Note>({
    id: '1',
    title: getInitialTitle(),
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    folder: 'Journal',
    tags: [],
    color: themeColors.primary
  })

  // Update title when date parameter changes and track journal access
  useEffect(() => {
    const getUpdatedTitle = () => {
      let targetDate = new Date()
      
      if (dateParam && dateParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse the date parameter (YYYY-MM-DD) carefully to avoid timezone issues
        const [year, month, day] = dateParam.split('-').map(num => parseInt(num, 10))
        const parsedDate = new Date(year, month - 1, day) // month is 0-indexed
        
        // Validate the parsed date
        if (!isNaN(parsedDate.getTime()) && 
            parsedDate.getFullYear() === year && 
            parsedDate.getMonth() === month - 1 && 
            parsedDate.getDate() === day) {
          targetDate = parsedDate
          setSelectedYMD(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
        }
      }
      
      return targetDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    setCurrentNote(prev => ({
      ...prev,
      title: getUpdatedTitle(),
      updatedAt: new Date().toISOString()
    }))
    
    // Track journal access for Step into the day rule (when user navigates to journal)
    if (dateParam || selectedYMD) {
      const dateToTrack = dateParam || selectedYMD
      // Record a minimal journal entry to indicate user accessed the journal
      RuleTrackingService.recordJournalEntry(dateToTrack, 'Journal accessed')
      console.log('Journal access tracked for Step into the day rule:', dateToTrack)
    }
  }, [dateParam, selectedYMD])

  const handleUpdateNote = (id: string, content: string, title?: string, color?: string, tags?: string[]) => {
    console.log('Updating journal entry:', id, 'with content length:', content.length)
    setCurrentNote(prev => ({
      ...prev,
      content,
      updatedAt: new Date().toISOString(),
      // Don't allow title updates from editor - we'll handle date changes separately
      // Only update color if explicitly provided
      ...(color !== undefined && { color }),
      // Only update tags if explicitly provided
      ...(tags !== undefined && { tags })
    }))
    
    // Track journal entry for Step into the day rule
    if (content && content.trim().length > 0) {
      RuleTrackingService.recordJournalEntry(selectedYMD, content)
      console.log('Journal entry recorded for Step into the day rule tracking:', selectedYMD)
    }
  }

  const handleDateChange = (selectedDate: Date) => {
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    setCurrentNote(prev => ({
      ...prev,
      title: formattedDate,
      updatedAt: new Date().toISOString()
    }))

    const y = selectedDate.getFullYear()
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const d = String(selectedDate.getDate()).padStart(2, '0')
    setSelectedYMD(`${y}-${m}-${d}`)
  }


  const handleDeleteNote = () => {
    // For single notepad, just clear the content
    setCurrentNote(prev => ({
      ...prev,
      content: '',
      title: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      updatedAt: new Date().toISOString()
    }))
  }

  // Re-compute when data store updates
  const [, setDataTick] = useState(0)
  useEffect(() => {
    const unsub = DataStore.subscribe(() => setDataTick(t => t + 1))
    return unsub
  }, [])

  // Pull trades for the selected day and compute stats + intraday chart
  const { headerNode, netPnl } = useMemo(() => {
    const ymd = selectedYMD
    const [y, m, d] = ymd.split('-').map(n => parseInt(n, 10))
    const dayDate = new Date(y, m - 1, d)
    const trades = DataStore.getTradesByDateRange(dayDate, dayDate)

    // Stats
    const totalTrades = trades.length
    const winners = trades.filter(t => t.netPnl > 0).length
    const losers = trades.filter(t => t.netPnl < 0).length
    const winrate = totalTrades > 0 ? `${Math.round((winners / totalTrades) * 100)}%` : '0%'
    const grossPnl = trades.reduce((s, t) => s + (t.grossPnl ?? t.netPnl), 0)
    const commissions = trades.reduce((s, t) => s + (t.commissions ?? 0), 0)
    const volume = trades.reduce((s, t) => s + (t.contractsTraded ?? 0), 0)
    const avgWin = winners > 0 ? trades.filter(t => t.netPnl > 0).reduce((s, t) => s + t.netPnl, 0) / winners : 0
    const avgLoss = losers > 0 ? Math.abs(trades.filter(t => t.netPnl < 0).reduce((s, t) => s + t.netPnl, 0)) / losers : 0
    const profitFactor = avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : 0

    // Intraday cumulative PnL points using entryTime or closeTime fallback
    const points = trades
      .map(t => ({
        time: (t.entryTime || t.openTime || t.closeTime || '16:00')?.slice(0,5),
        pnl: t.netPnl
      }))
      .sort((a, b) => a.time.localeCompare(b.time))

    let running = 0
    const chartData = points.map(p => {
      running += p.pnl
      return { time: p.time, value: Math.round(running) }
    })

    const netPnl = Math.round(trades.reduce((sum, t) => sum + (t.netPnl || 0), 0))
    const headerNode = (
      <div className="px-0">
        <JournalHeaderStats
          chartData={chartData}
          stats={{
            totalTrades,
            winners,
            losers,
            winrate,
            grossPnl: Math.round(grossPnl),
            volume,
            commissions: Math.round(commissions),
            profitFactor
          }}
        />
        <JournalTradesTable trades={trades} />
      </div>
    )

    return { headerNode, netPnl }
  }, [selectedYMD, setDataTick])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[var(--color-bg-dark,#171717)]">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-[var(--color-bg-dark,#171717)] p-6">
          <div className="flex gap-6 h-full">
            {/* Left Sidebar Widgets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-80 space-y-6"
            >
              <MoodDisplayWidget 
                selectedDate={selectedYMD}
              />

              <ProgressWidget 
                completed={0}
                total={0}
                title="Progress"
                emptyMessage="No active rules today"
                selectedDate={selectedYMD}
              />

              <div className="bg-white dark:bg-[var(--color-surface-dark,#0f0f0f)] rounded-xl overflow-hidden shadow-lg p-3">
                <TradingViewWidget />
              </div>
            </motion.div>

            {/* Main Notepad - Right Side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 flex flex-col bg-white dark:bg-[var(--color-surface-dark,#0f0f0f)] rounded-xl overflow-hidden shadow-lg"
            >
              <NotebookEditor 
                note={currentNote} 
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                useDatePicker={true}
                onDateChange={handleDateChange}
                headerStats={headerNode}
                netPnlValue={netPnl}
                netPnlIsProfit={netPnl >= 0}
              />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function JournalPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-50 dark:bg-[var(--color-bg-dark,#171717)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-[var(--color-bg-dark,#171717)] p-6">
            <div className="flex gap-6 h-full">
              <div className="flex-1 flex flex-col bg-white dark:bg-[var(--color-surface-dark,#0f0f0f)] rounded-xl overflow-hidden shadow-lg">
                <PageLoading text="Loading Journal..." />
              </div>
            </div>
          </main>
        </div>
      </div>
    }>
      <JournalPageContent />
    </Suspense>
  )
} 