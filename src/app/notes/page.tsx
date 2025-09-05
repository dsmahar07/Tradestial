'use client'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { NotebookTopSearch } from '@/components/features/notes/NotebookTopSearch'
import { NotebookSidebar } from '@/components/features/notes/NotebookSidebar'
import { NotebookMiddlePanel } from '@/components/features/notes/NotebookMiddlePanel'
import { NotebookEditor } from '@/components/features/notes/NotebookEditor'
import JournalHeaderStats from '@/components/ui/journal-header-stats'
import JournalTradesTable from '@/components/ui/journal-trades-table'

import { useConfirmation } from '@/components/ui/confirmation-modal'
import { useToast } from '@/components/ui/notification-toast'
import { TradeJournalingTemplate, defaultTemplates } from '@/lib/templates'
import type { TemplateInstance } from '@/types/templates'
import { useState, useEffect, useMemo } from 'react'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSearchParams } from 'next/navigation'
import { DataStore } from '@/services/data-store.service'


export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  folder: string
  tags: string[]
  color?: string // Color for the note badge/tag
  template?: {
    templateId: string
    customFields?: any[]
    fieldValues: Record<string, any>
  }
  // Sharing configuration
  sharing?: {
    isShared: boolean
    shareToken?: string
    isAnonymous: boolean
    sharedAt?: string
  }
  // Optional trading data for trade/daily journal notes to power PnL header
  tradingData?: {
    netPnl?: number
    isProfit?: boolean
    stats?: {
      totalTrades?: number
      winners?: number
      losers?: number
      winrate?: string
      grossPnl?: number
      volume?: number
      commissions?: number
      profitFactor?: number
    }
    chartData?: Array<{ time: string; value: number }>
    trades?: any[]
    date?: string
  }
}

export interface Folder {
  id: string
  name: string
  order: number
  color?: string
}

export default function NotesPage() {
  usePageTitle('Notes')
  const searchParams = useSearchParams()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedFolder, setSelectedFolder] = useState('All notes')
  const { confirm, ConfirmationModal } = useConfirmation()
  const { success, error, warning, ToastContainer } = useToast()
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'all-notes', name: 'All notes', order: 0, color: '#3b82f6' },
    { id: 'trade-notes', name: 'Trade Notes', order: 1, color: '#10b981' },
    { id: 'daily-journal', name: 'Daily Journal', order: 2, color: '#f59e0b' },
    { id: 'sessions-recap', name: 'Sessions Recap', order: 3, color: '#8b5cf6' },
    { id: 'my-notes', name: 'My notes', order: 4, color: '#ec4899' },
  ])
  const [notes, setNotes] = useState<Note[]>(() => {
    // Load notes from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedNotes = localStorage.getItem('tradestial_notes')
      if (savedNotes) {
        try {
          return JSON.parse(savedNotes)
        } catch (error) {
          console.error('Error loading notes from localStorage:', error)
        }
      }
    }
    // Default note if no saved notes
    return [{
      id: '1',
      title: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folder: 'All notes',
      tags: [],
      color: '#3b82f6' // Default blue color
    }]
  })
  const [templates, setTemplates] = useState<TradeJournalingTemplate[]>(defaultTemplates)
  // Tag filter state
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const n of notes) {
      (n.tags || []).forEach(t => set.add(t))
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [notes])

  // Date state for PnL header (defaults to today)
  const [selectedYMD, setSelectedYMD] = useState<string>(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })

  // Range state for Sessions Recap (default: last 7 days)
  const [selectedRange, setSelectedRange] = useState<{ startYMD: string; endYMD: string }>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    const toYMD = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    return { startYMD: toYMD(start), endYMD: toYMD(end) }
  })

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tradestial_notes', JSON.stringify(notes))
    }
  }, [notes])

  // Refresh trigger when DataStore updates
  const [dataTick, setDataTick] = useState(0)
  useEffect(() => {
    const unsub = DataStore.subscribe(() => setDataTick(t => t + 1))
    return unsub
  }, [])

  // Compute daily PnL header content similar to Journal page
  const { headerNode, netPnl } = useMemo(() => {
    const ymd = selectedYMD
    const [y, m, d] = ymd.split('-').map((n: string) => parseInt(n, 10))
    const dayDate = new Date(y, m - 1, d)
    const trades = DataStore.getTradesByDateRange(dayDate, dayDate)

    const totalTrades = trades.length
    const winners = trades.filter((t: any) => t.netPnl > 0).length
    const losers = trades.filter((t: any) => t.netPnl < 0).length
    const winrate = totalTrades > 0 ? `${Math.round((winners / totalTrades) * 100)}%` : '0%'
    const grossPnl = trades.reduce((s: number, t: any) => s + (t.grossPnl ?? t.netPnl ?? 0), 0)
    const commissions = trades.reduce((s: number, t: any) => s + (t.commissions ?? 0), 0)
    const volume = trades.reduce((s: number, t: any) => s + (t.contractsTraded ?? 0), 0)
    const avgWin = winners > 0 ? trades.filter((t: any) => t.netPnl > 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0) / winners : 0
    const avgLoss = losers > 0 ? Math.abs(trades.filter((t: any) => t.netPnl < 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0)) / losers : 0
    const profitFactor = avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : 0

    const points = trades
      .map((t: any) => ({
        time: (t.entryTime || t.openTime || t.closeTime || '16:00')?.slice(0, 5),
        pnl: t.netPnl ?? 0,
      }))
      .sort((a: any, b: any) => a.time.localeCompare(b.time))

    let running = 0
    const chartData = points.map((p: any) => {
      running += p.pnl
      return { time: p.time, value: Math.round(running) }
    })

    const netPnl = Math.round(trades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0))
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
            profitFactor,
          }}
        />
        {Array.isArray(trades) && trades.length > 0 && (
          <JournalTradesTable trades={trades} />
        )}
      </div>
    )

    return { headerNode, netPnl }
  }, [selectedYMD, dataTick])

  // Compute PnL header content for a date range (Sessions Recap)
  const { rangeHeaderNode, rangeNetPnl } = useMemo(() => {
    const [sy, sm, sd] = selectedRange.startYMD.split('-').map((n: string) => parseInt(n, 10))
    const [ey, em, ed] = selectedRange.endYMD.split('-').map((n: string) => parseInt(n, 10))
    const startDate = new Date(sy, sm - 1, sd)
    const endDate = new Date(ey, em - 1, ed)
    const trades = DataStore.getTradesByDateRange(startDate, endDate)

    const totalTrades = trades.length
    const winners = trades.filter((t: any) => t.netPnl > 0).length
    const losers = trades.filter((t: any) => t.netPnl < 0).length
    const winrate = totalTrades > 0 ? `${Math.round((winners / totalTrades) * 100)}%` : '0%'
    const grossPnl = trades.reduce((s: number, t: any) => s + (t.grossPnl ?? t.netPnl ?? 0), 0)
    const commissions = trades.reduce((s: number, t: any) => s + (t.commissions ?? 0), 0)
    const volume = trades.reduce((s: number, t: any) => s + (t.contractsTraded ?? 0), 0)
    const avgWin = winners > 0 ? trades.filter((t: any) => t.netPnl > 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0) / winners : 0
    const avgLoss = losers > 0 ? Math.abs(trades.filter((t: any) => t.netPnl < 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0)) / losers : 0
    const profitFactor = avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : 0

    // Build equity curve across the period by sorting on combined date+time when available
    const points = trades
      .map((t: any) => ({
        sortKey: `${t.closeDate || t.date || ''} ${(t.entryTime || t.openTime || t.closeTime || '16:00')?.slice(0,5)}`,
        pnl: t.netPnl ?? 0,
      }))
      .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey))

    let running = 0
    const chartData = points.map((p: any) => {
      running += p.pnl
      return { time: '', value: Math.round(running) }
    })

    const rangeNetPnl = Math.round(trades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0))
    const rangeHeaderNode = (
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
            profitFactor,
          }}
        />
        {Array.isArray(trades) && trades.length > 0 && (
          <JournalTradesTable trades={trades} />
        )}
      </div>
    )

    return { rangeHeaderNode, rangeNetPnl }
  }, [selectedRange, dataTick])

  const handleDateChange = (selectedDate: Date) => {
    // Update the editor title to the chosen date and update selectedYMD
    const formattedTitle = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    if (selectedNote) {
      handleUpdateNote(selectedNote.id, selectedNote.content, formattedTitle)
    }

    const y = selectedDate.getFullYear()
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const d = String(selectedDate.getDate()).padStart(2, '0')
    setSelectedYMD(`${y}-${m}-${d}`)
  }

  const handleRangeChange = (startDate: Date, endDate: Date) => {
    // Normalize order if user picked reversed
    const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate]
    const toYMD = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    setSelectedRange({ startYMD: toYMD(start), endYMD: toYMD(end) })

    // Optionally update title to reflect period
    if (selectedNote) {
      const fmt = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      const title = `${fmt(start)} - ${fmt(end)}`
      handleUpdateNote(selectedNote.id, selectedNote.content, title)
    }
  }

  // Handle navigation from Daily Journal with trade data
  useEffect(() => {
    const source = searchParams.get('source')
    const tradeId = searchParams.get('tradeId')
    
    if (source === 'trade' && tradeId) {
      // Set Daily Journal folder as selected
      setSelectedFolder('Daily Journal')
      
      // Get trade data from localStorage
      const tradeDataStr = localStorage.getItem('selectedTradeForNote')
      if (tradeDataStr) {
        try {
          const tradeData = JSON.parse(tradeDataStr)
          
          // Auto-create a note with trade information
          const now = new Date()
          const tradeNote: Note = {
            id: Date.now().toString(),
            title: `${tradeData.date} Trade Analysis`,
            content: `<h2>Trade Analysis - ${tradeData.date}</h2>
              <p><strong>Net P&L:</strong> $${tradeData.netPnl} ${tradeData.isProfit ? '✅' : '❌'}</p>
              <p><strong>Total Trades:</strong> ${tradeData.stats.totalTrades}</p>
              <p><strong>Winners:</strong> ${tradeData.stats.winners} | <strong>Losers:</strong> ${tradeData.stats.losers}</p>
              <p><strong>Win Rate:</strong> ${tradeData.stats.winrate}</p>
              <p><strong>Profit Factor:</strong> ${tradeData.stats.profitFactor}</p>
              <p><strong>Gross P&L:</strong> $${tradeData.stats.grossPnl}</p>
              <p><strong>Volume:</strong> ${tradeData.stats.volume}</p>
              
              <h3>Trade Details:</h3>
              <p><em>Click here to add your analysis, lessons learned, and trade review...</em></p>`,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            folder: 'Daily Journal',
            tags: ['trade-analysis', 'daily-journal'],
            color: '#f59e0b', // Daily Journal color
            // Attach structured trading data to enable PnL header rendering
            tradingData: {
              netPnl: tradeData.netPnl,
              isProfit: tradeData.isProfit,
              stats: tradeData.stats,
              chartData: tradeData.chartData,
              trades: tradeData.trades,
              date: tradeData.date
            }
          }
          
          setNotes(prev => [tradeNote, ...prev])
          setSelectedNote(tradeNote)
          // Ensure header stats use the selected card's date (YYYY-MM-DD)
          if (tradeData?.date) {
            const parsed = new Date(tradeData.date)
            if (!isNaN(parsed.getTime())) {
              const y = parsed.getFullYear()
              const m = String(parsed.getMonth() + 1).padStart(2, '0')
              const d = String(parsed.getDate()).padStart(2, '0')
              setSelectedYMD(`${y}-${m}-${d}`)
            }
          }
          
          // Clean up localStorage
          localStorage.removeItem('selectedTradeForNote')
          
          success('Trade note created', 'Trade analysis note created successfully!')
        } catch (error) {
          console.error('Error parsing trade data:', error)
        }
      }
    }
  }, [searchParams, success])

  const handleCreateNote = () => {
    const now = new Date()
    const formattedDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: formattedDate,
      content: '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      folder: selectedFolder === 'All notes' ? 'My notes' : selectedFolder,
      tags: [],
      color: '#3b82f6' // Default blue color
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    console.log('Created new note:', newNote)
  }

  const handleCreateNoteFromTemplate = (template: TradeJournalingTemplate, templateInstance: TemplateInstance, generatedContent: string) => {
    // If a note is selected, apply template content to it instead of creating a new note
    if (selectedNote) {
      handleUpdateNote(selectedNote.id, generatedContent)
      console.log('Applied template to existing note:', selectedNote.id)
      success('Template applied', `${template.name} applied to current note.`)
      return
    }

    const now = new Date()

    // Generate a more specific title based on template type
    let title = template.name
    if (template.category === 'daily') {
      title = `${template.name} - ${now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })}`
    } else if (template.category === 'trade') {
      const symbol = templateInstance.fieldValues['symbol'] || 'Trade'
      title = `${symbol} - ${template.name}`
    } else if (template.category === 'review') {
      const weekStart = templateInstance.fieldValues['week-starting'] || templateInstance.fieldValues['week-ending']
      if (weekStart) {
        title = `${template.name} - ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      }
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content: generatedContent,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      folder: selectedFolder === 'All notes' ? 'My notes' : selectedFolder,
      tags: [...template.tags],
      color: template.color,
      template: templateInstance
    }

    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    console.log('Created note from template:', newNote)
    success('Note created', `${template.name} note created successfully!`)
  }

  const handleQuickApplyTemplate = (template: TradeJournalingTemplate, content: string) => {
    // If a note is selected, apply template content to it instead of creating a new note
    if (selectedNote) {
      handleUpdateNote(selectedNote.id, content)
      console.log('Quick-applied template to existing note:', selectedNote.id)
      success('Template applied', `${template.name} applied to current note.`)
      return
    }

    const now = new Date()

    // Generate a more specific title based on template type and current date
    let title = template.name
    if (template.category === 'daily') {
      title = `${template.name} - ${now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })}`
    } else if (template.category === 'trade') {
      title = `${template.name} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else if (template.category === 'review') {
      title = `${template.name} - Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      folder: selectedFolder === 'All notes' ? 'My notes' : selectedFolder,
      tags: [...template.tags],
      color: template.color,
    }

    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    console.log('Quick applied template:', newNote)
    success('Template applied!', `${template.name} template applied instantly - ready to edit!`)
  }

  const handleUpdateNote = (id: string, content: string, title?: string, color?: string, tags?: string[], sharing?: { isShared: boolean; shareToken?: string; isAnonymous: boolean; sharedAt?: string }) => {
    console.log('Updating note:', id, 'with content length:', content.length)
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { 
            ...note, 
            content, 
            updatedAt: new Date().toISOString(),
            // Only update title if explicitly provided
            ...(title !== undefined && { title }),
            // Only update color if explicitly provided
            ...(color !== undefined && { color }),
            // Only update tags if explicitly provided
            ...(tags !== undefined && { tags }),
            // Only update sharing if explicitly provided
            ...(sharing !== undefined && { sharing })
          }
        : note
    ))
    // Update selected note state to stay in sync
    if (selectedNote?.id === id) {
      setSelectedNote(prev => prev ? { 
        ...prev, 
        content, 
        updatedAt: new Date().toISOString(),
        // Only update title if explicitly provided
        ...(title !== undefined && { title }),
        // Only update color if explicitly provided
        ...(color !== undefined && { color }),
        // Only update tags if explicitly provided
        ...(tags !== undefined && { tags }),
        // Only update sharing if explicitly provided
        ...(sharing !== undefined && { sharing })
      } : null)
    }
  }

  const handleReorderNotes = (startIndex: number, endIndex: number) => {
    const newNotes = [...notes]
    const [removed] = newNotes.splice(startIndex, 1)
    newNotes.splice(endIndex, 0, removed)
    setNotes(newNotes)
  }

  const handleDeleteNote = (id: string, noteTitle: string) => {
    const noteToDelete = notes.find(note => note.id === id)
    
    // Check if note has meaningful content (more than just title and empty content)
    const hasContent = noteToDelete && (
      (noteToDelete.content && 
       noteToDelete.content.trim() !== '' && 
       noteToDelete.content !== '<p><br></p>' && 
       noteToDelete.content !== '<p>Start typing...</p>') ||
      (noteToDelete.title && noteToDelete.title.trim() !== '')
    )
    
    confirm({
      title: 'Delete Note',
      message: `Are you sure you want to delete "${noteTitle}"? ${hasContent ? 'This note contains content and ' : ''}This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        setNotes(prev => prev.filter(note => note.id !== id))
        if (selectedNote?.id === id) {
          setSelectedNote(null)
        }
        
        // Only show notification if note had meaningful content
        if (hasContent) {
          warning('Note deleted', `"${noteTitle}" has been permanently deleted.`)
        }
      }
    })
  }

  const handleDeleteAllNotes = () => {
    // Get notes in current folder
    const notesToDelete = selectedFolder === 'All notes' 
      ? notes 
      : notes.filter(note => note.folder === selectedFolder)
    
    if (notesToDelete.length === 0) return
    
    confirm({
      title: 'Delete All Notes',
      message: `Are you sure you want to delete all ${notesToDelete.length} notes${selectedFolder !== 'All notes' ? ` in "${selectedFolder}"` : ''}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete All',
      onConfirm: () => {
        if (selectedFolder === 'All notes') {
          // Delete all notes
          setNotes([])
        } else {
          // Delete notes in current folder only
          setNotes(prev => prev.filter(note => note.folder !== selectedFolder))
        }
        setSelectedNote(null)
        warning('Notes deleted', `${notesToDelete.length} notes have been permanently deleted.`)
      }
    })
  }

  const handleNoteSelect = (note: Note) => {
    console.log('Selecting note:', note.title)
    setSelectedNote(note)
    // Prefer explicit trading date when available
    if (note?.tradingData?.date) {
      const dt = new Date(note.tradingData.date)
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear()
        const m = String(dt.getMonth() + 1).padStart(2, '0')
        const d = String(dt.getDate()).padStart(2, '0')
        setSelectedYMD(`${y}-${m}-${d}`)
        return
      }
    }
    // Fallback: try to keep selectedYMD in sync if title looks like a date
    const parsed = Date.parse(note.title)
    if (!isNaN(parsed)) {
      const dt = new Date(parsed)
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const d = String(dt.getDate()).padStart(2, '0')
      setSelectedYMD(`${y}-${m}-${d}`)
    }
  }

  const handleFolderSelect = (folder: string) => {
    console.log('Selecting folder:', folder)
    setSelectedFolder(folder)
    // Clear tag filter when switching folders (optional UX)
    setSelectedTag(null)
    // Clear selected note when changing folders to avoid confusion
    setSelectedNote(null)
  }

  const handleAddFolder = () => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: 'New Folder',
      order: folders.length,
      color: '#3b82f6'
    }
    setFolders(prev => [...prev, newFolder])
  }

  // Handle tag selection from sidebar
  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag)
    // When a tag is selected, show across all folders
    if (tag) setSelectedFolder('All notes')
    setSelectedNote(null)
  }

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    // Only 'My notes' can be deleted
    if (folderId === 'all-notes') {
      warning('Action not allowed', '"All notes" cannot be deleted.')
      return
    }
    if (folderName !== 'My notes') {
      warning('Action not allowed', 'Only the "My notes" folder can be deleted.')
      return
    }

    // Check how many notes are in this folder
    const folderToDelete = folders.find(f => f.id === folderId)
    const notesInFolder = notes.filter(note => note.folder === folderToDelete?.name)

    confirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${folderName}"? ${notesInFolder.length > 0 ? `All ${notesInFolder.length} notes in this folder will be moved to "My notes".` : 'This folder is empty.'}`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        setFolders(prev => prev.filter(folder => folder.id !== folderId))

        // If we're deleting the currently selected folder, switch to "All notes"
        if (folderToDelete && selectedFolder === folderToDelete.name) {
          setSelectedFolder('All notes')
          setSelectedNote(null)
        }

        // Move notes from deleted folder to "My notes"
        setNotes(prev => prev.map(note => 
          note.folder === folderToDelete?.name 
            ? { ...note, folder: 'My notes' }
            : note
        ))

        // Only show notification if folder had notes
        if (notesInFolder.length > 0) {
          warning('Folder deleted', `"${folderName}" deleted. ${notesInFolder.length} notes moved to "My notes".`)
        }
      }
    })
  }

  const handleRenameFolder = (folderId: string, newName: string) => {
    const oldFolder = folders.find(f => f.id === folderId)
    if (!oldFolder) return
    
    // Only allow renaming 'My notes'
    if (oldFolder.name !== 'My notes') {
      warning('Action not allowed', 'Only the "My notes" folder can be renamed.')
      return
    }

    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, name: newName }
        : folder
    ))
    
    // Update notes that belong to this folder
    setNotes(prev => prev.map(note => 
      note.folder === oldFolder.name 
        ? { ...note, folder: newName }
        : note
    ))
    
    // Update selected folder if it's the one being renamed
    if (selectedFolder === oldFolder.name) {
      setSelectedFolder(newName)
    }
  }

  const handleReorderFolders = (startIndex: number, endIndex: number) => {
    if (startIndex === 0 || endIndex === 0) return // Can't move "All notes"
    
    const newFolders = [...folders]
    const [removed] = newFolders.splice(startIndex, 1)
    newFolders.splice(endIndex, 0, removed)
    
    // Update order
    newFolders.forEach((folder, index) => {
      folder.order = index
    })
    
    setFolders(newFolders)
  }

  const handleUpdateFolderColor = (folderId: string, color: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, color }
        : folder
    ))
  }

  const handleDeleteTemplate = (template: TradeJournalingTemplate) => {
    // Show custom confirmation dialog
    confirm({
      title: 'Delete Template',
      message: `Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Template',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Actually remove the template from the templates array
        setTemplates((prevTemplates: TradeJournalingTemplate[]) => 
          prevTemplates.filter((t: TradeJournalingTemplate) => t.id !== template.id)
        )
        success(`Template "${template.name}" has been deleted successfully!`)
      }
    })
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 min-h-0 overflow-hidden px-6 pb-6 pt-6 bg-[#f2f2f2] dark:bg-[#171717]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="h-full min-h-0 flex flex-col bg-white dark:bg-[#0f0f0f] rounded-xl overflow-hidden shadow-lg"
          >
            {/* Top Search Bar */}
            <NotebookTopSearch />
            
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left Sidebar with right spacing */}
              <div className="pr-4 border-r border-gray-200 dark:border-[#404040]">
                <NotebookSidebar 
                  selectedFolder={selectedFolder}
                  folders={folders}
                  onFolderSelect={handleFolderSelect}
                  onAddFolder={handleAddFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onRenameFolder={handleRenameFolder}
                  onReorderFolders={handleReorderFolders}
                  onUpdateFolderColor={handleUpdateFolderColor}
                  tags={tags}
                  selectedTag={selectedTag}
                  onTagSelect={handleTagSelect}
                />
              </div>
              
              {/* Middle Panel */}
              <NotebookMiddlePanel 
                selectedFolder={selectedFolder}
                selectedTag={selectedTag}
                selectedNote={selectedNote}
                notes={notes}
                onNoteSelect={handleNoteSelect}
                onCreateNote={handleCreateNote}
                onDeleteNote={handleDeleteNote}
                onUpdateNote={handleUpdateNote}
                onReorderNotes={handleReorderNotes}
                onDeleteAllNotes={handleDeleteAllNotes}
              />
              
              {/* Right Editor Panel */}
              {(() => {
                const isSessionRecap = selectedFolder === 'Sessions Recap'
                const isJournalContext =
                  selectedFolder === 'Daily Journal' ||
                  selectedFolder === 'Trade Notes' ||
                  !!selectedNote?.tradingData ||
                  (selectedNote?.tags?.some(tag => tag === 'trade-analysis' || tag === 'daily-journal') ?? false)

                const useRange = isSessionRecap
                const useDaily = !useRange && isJournalContext

                // Convert selectedRange (YYYY-MM-DD) to Date objects for the editor to use during sharing
                let rangeFromDate: Date | undefined = undefined
                let rangeToDate: Date | undefined = undefined
                if (useRange && selectedRange?.startYMD && selectedRange?.endYMD) {
                  const [sy, sm, sd] = selectedRange.startYMD.split('-').map((n: string) => parseInt(n, 10))
                  const [ey, em, ed] = selectedRange.endYMD.split('-').map((n: string) => parseInt(n, 10))
                  rangeFromDate = new Date(sy, sm - 1, sd)
                  rangeToDate = new Date(ey, em - 1, ed)
                }

                return (
                  <NotebookEditor 
                    note={selectedNote} 
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    useRangePicker={useRange}
                    onRangeChange={useRange ? handleRangeChange : undefined}
                    rangeFrom={rangeFromDate}
                    rangeTo={rangeToDate}
                    useDatePicker={useDaily}
                    onDateChange={useDaily ? handleDateChange : undefined}
                    headerStats={useRange ? rangeHeaderNode : useDaily ? headerNode : undefined}
                    netPnlValue={useRange ? rangeNetPnl : useDaily ? netPnl : undefined}
                    netPnlIsProfit={useRange ? (rangeNetPnl ?? 0) >= 0 : useDaily ? netPnl >= 0 : undefined}
                    hideNetPnl={!useRange && !useDaily}
                    // Template creation props moved to editor menu
                    onCreateNote={handleCreateNote}
                    onCreateNoteFromTemplate={handleCreateNoteFromTemplate}
                    onQuickApplyTemplate={handleQuickApplyTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    templates={templates}
                  />
                )
              })()}
            </div>
          </motion.div>
        </main>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal />
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}