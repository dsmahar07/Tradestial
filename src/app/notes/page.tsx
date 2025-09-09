'use client'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { NotebookTopSearch } from '@/components/features/notes/NotebookTopSearch'
import { NotebookSidebar } from '@/components/features/notes/NotebookSidebar'
import { NotebookMiddlePanel } from '@/components/features/notes/NotebookMiddlePanel'
import { NoteEditorComponent as NotebookEditor } from '@/components/features/notes/NoteEditorComponent'
import JournalHeaderStats from '@/components/ui/journal-header-stats'
import JournalTradesTable from '@/components/ui/journal-trades-table'

import { useConfirmation } from '@/components/ui/confirmation-modal'
import { useToast } from '@/components/ui/notification-toast'
import { cn } from '@/lib/utils'
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
  isBookmarked?: boolean // Bookmark status
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
  parentId?: string // For nested folders
  isExpanded?: boolean // For folder tree state
}

export default function NotesPage() {
  usePageTitle('Notes')
  const searchParams = useSearchParams()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedFolder, setSelectedFolder] = useState('All Notes')
  const { confirm, ConfirmationModal } = useConfirmation()
  const { success, error, warning, ToastContainer } = useToast()
  // Function to get a random color for new notes
  const getRandomNoteColor = () => {
    const colors = [
      '#3b82f6', // Blue
      '#ef4444', // Red
      '#10b981', // Green
      '#f59e0b', // Yellow
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#84cc16', // Lime
      '#ec4899', // Pink
      '#6b7280', // Gray
      '#14b8a6', // Teal
      '#a855f7'  // Violet
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Function to get next available folder color (different from existing folders)
  const getNextFolderColor = () => {
    const folderColors = [
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Yellow
      '#ef4444', // Red
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#84cc16', // Lime
      '#ec4899', // Pink
      '#14b8a6', // Teal
      '#a855f7', // Violet
      '#6b7280'  // Gray
    ]
    
    // Get colors already used by existing folders
    const usedColors = folders.map(folder => folder.color).filter(Boolean)
    
    // Find first unused color
    const availableColor = folderColors.find(color => !usedColors.includes(color))
    
    // If all colors are used, return a random one
    return availableColor || folderColors[Math.floor(Math.random() * folderColors.length)]
  }

  const [folders, setFolders] = useState<Folder[]>(() => {
    // Load folders from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedFolders = localStorage.getItem('tradestial_folders')
      if (savedFolders) {
        try {
          return JSON.parse(savedFolders)
        } catch (error) {
          console.error('Error loading folders from localStorage:', error)
        }
      }
    }
    // Default folders if no saved folders
    return [
      { id: 'all-notes', name: 'All Notes', order: 0, color: '#3b82f6' },
      { id: 'my-notes', name: 'My notes', order: 1, color: '#10b981' },
      { id: 'daily-journal', name: 'Daily Journal', order: 2, color: '#f59e0b' },
      { id: 'trade-notes', name: 'Trade Notes', order: 3, color: '#ef4444' },
      { id: 'sessions-recap', name: 'Sessions Recap', order: 4, color: '#8b5cf6' }
    ]
  })
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
      color: getRandomNoteColor()
    }]
  })
  const [templates, setTemplates] = useState<TradeJournalingTemplate[]>(defaultTemplates)
  // Tag filter state
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
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
      try {
        // Create a safe copy of notes without circular references
        const safeNotes = notes.map(note => ({
          ...note,
          // Only keep essential tradingData fields, exclude complex objects
          tradingData: note.tradingData ? {
            netPnl: note.tradingData.netPnl,
            isProfit: note.tradingData.isProfit,
            date: note.tradingData.date,
            // Exclude chartData and trades which may contain circular references
            stats: note.tradingData.stats ? {
              totalTrades: note.tradingData.stats.totalTrades,
              winners: note.tradingData.stats.winners,
              losers: note.tradingData.stats.losers,
              winrate: note.tradingData.stats.winrate,
              profitFactor: note.tradingData.stats.profitFactor,
              grossPnl: note.tradingData.stats.grossPnl,
              volume: note.tradingData.stats.volume
            } : undefined
          } : undefined
        }))
        localStorage.setItem('tradestial_notes', JSON.stringify(safeNotes))
      } catch (error) {
        console.error('Error saving notes to localStorage:', error)
      }
    }
  }, [notes])

  // Save folders to localStorage whenever folders change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Create a safe copy of folders without any potential circular references
        const safeFolders = folders.map(folder => ({
          id: folder.id,
          name: folder.name,
          order: folder.order,
          color: folder.color,
          parentId: folder.parentId,
          isExpanded: folder.isExpanded
        }))
        localStorage.setItem('tradestial_folders', JSON.stringify(safeFolders))
      } catch (error) {
        console.error('Error saving folders to localStorage:', error)
      }
    }
  }, [folders])

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
      color: getRandomNoteColor()
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

  const handleUpdateNote = (id: string, content: string, title?: string, color?: string, tags?: string[]) => {
    // Update the notes array
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { 
            ...note, 
            content, 
            title: title !== undefined ? title : note.title,
            color: color !== undefined ? color : note.color,
            tags: tags !== undefined ? tags : note.tags,
            updatedAt: new Date().toISOString() 
          }
        : note
    ))

    // If the currently selected note is the one being updated, reflect changes immediately
    if (selectedNote?.id === id) {
      setSelectedNote(prev => prev ? {
        ...prev,
        content,
        title: title !== undefined ? title : prev.title,
        color: color !== undefined ? color : prev.color,
        tags: tags !== undefined ? tags : prev.tags,
        updatedAt: new Date().toISOString()
      } : prev)
    }
  }

  const handleMoveNote = (noteId: string, targetFolder: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, folder: targetFolder, updatedAt: new Date().toISOString() }
        : note
    ))
    success('Note moved', `Note moved to "${targetFolder}" folder`)
  }

  const handleToggleBookmark = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, isBookmarked: !note.isBookmarked, updatedAt: new Date().toISOString() }
        : note
    ))
    const note = notes.find(n => n.id === noteId)
    if (note) {
      success(
        note.isBookmarked ? 'Bookmark removed' : 'Note bookmarked',
        note.isBookmarked ? 'Note removed from bookmarks' : 'Note added to bookmarks'
      )
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

  const handleAddFolder = (parentId?: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: parentId ? 'New Subfolder' : 'New Folder',
      order: folders.length,
      color: getNextFolderColor(),
      parentId: parentId,
      isExpanded: true
    }
    setFolders(prev => [...prev, newFolder])
    success('Folder created', `${parentId ? 'Subfolder' : 'Folder'} created successfully!`)
  }

  // Handle tag selection from sidebar
  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag)
    // When a tag is selected, show across all folders
    if (tag) setSelectedFolder('All notes')
    setSelectedNote(null)
  }

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    // Prevent deletion of system folders
    if (folderId === 'all-notes') {
      warning('Action not allowed', '"All Notes" cannot be deleted.')
      return
    }
    
    // Allow deletion of any user-created folders and subfolders
    const folderToDelete = folders.find(f => f.id === folderId)
    if (!folderToDelete) {
      warning('Error', 'Folder not found.')
      return
    }
    
    // Check how many notes are in this folder
    const notesInFolder = notes.filter(note => note.folder === folderToDelete.name)

    confirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${folderName}"? ${notesInFolder.length > 0 ? `All ${notesInFolder.length} notes in this folder will be moved to "All Notes".` : 'This folder is empty.'}`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        // Remove the folder and any subfolders
        setFolders(prev => prev.filter(folder => folder.id !== folderId && folder.parentId !== folderId))

        // Move notes to "All Notes" folder
        if (notesInFolder.length > 0) {
          setNotes(prev => prev.map(note => 
            note.folder === folderToDelete.name 
              ? { ...note, folder: 'All Notes' }
              : note
          ))
        }

        // If we're deleting the currently selected folder, switch to "All Notes"
        if (selectedFolder === folderToDelete.name) {
          setSelectedFolder('All Notes')
          setSelectedNote(null)
        }

        success('Folder deleted', `"${folderName}" has been deleted successfully.`)
      }
    })
  }

  const handleRenameFolder = (folderId: string, newName: string) => {
    const oldFolder = folders.find(f => f.id === folderId)
    if (!oldFolder) return
    
    // Allow renaming any user-created folder (not system folders)
    if (folderId === 'all-notes') {
      warning('Action not allowed', '"All Notes" cannot be renamed.')
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  if (isFullscreen) {
    // Fullscreen mode - show entire notes widget
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-0 z-50"
      >
        {/* Fullscreen mode - show entire notes widget */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="h-screen w-screen flex flex-col bg-white dark:bg-[#0f0f0f] overflow-hidden"
        >
          {/* Top Search Bar */}
          <NotebookTopSearch onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />
          
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left Sidebar */}
            <div className={cn(
              "flex-shrink-0 h-full transition-all duration-300",
              isSidebarCollapsed ? "w-20" : "w-64"
            )}>
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
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
              />
            </div>
            
            {/* Middle Panel */}
            <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-[#404040]">
              <NotebookMiddlePanel 
                selectedFolder={selectedFolder}
                selectedTag={selectedTag}
                selectedNote={selectedNote}
                notes={notes}
                folders={folders}
                onNoteSelect={handleNoteSelect}
                onCreateNote={handleCreateNote}
                onDeleteNote={handleDeleteNote}
                onUpdateNote={handleUpdateNote}
                onMoveNote={handleMoveNote}
                onToggleBookmark={handleToggleBookmark}
                onReorderNotes={handleReorderNotes}
                onDeleteAllNotes={handleDeleteAllNotes}
                onToggleCollapse={toggleSidebarCollapse}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            </div>
            
            {/* Right Editor Panel - takes remaining space */}
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
                <div className="flex-1 min-w-0 h-full overflow-hidden">
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
                    hideNetPnlSection={!useRange && !useDaily}
                    // Template creation props moved to editor menu
                    onCreateNote={handleCreateNote}
                    onCreateNoteFromTemplate={handleCreateNoteFromTemplate}
                    onQuickApplyTemplate={handleQuickApplyTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    templates={templates}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                  />
                </div>
              )
            })()}
          </div>
        </motion.div>
        
        {/* Confirmation Modal */}
        <ConfirmationModal />
        
        {/* Toast Notifications */}
        <ToastContainer />
      </motion.div>
    )
  }

  // Normal mode - standard layout
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex h-screen"
    >
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-[#fafafa] dark:bg-[#171717]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="h-full min-h-0 flex flex-col bg-white dark:bg-[#0f0f0f] rounded-xl overflow-hidden shadow-lg"
          >
            {/* Top Search Bar */}
            <NotebookTopSearch onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />
            
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left Sidebar with right spacing */}
              <div className={cn(
                "flex-shrink-0 h-full transition-all duration-300",
                isSidebarCollapsed ? "w-20" : "w-64"
              )}>
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
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={toggleSidebarCollapse}
                />
              </div>
              
              {/* Middle Panel */}
              <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-[#404040] h-full">
                <NotebookMiddlePanel 
                  selectedFolder={selectedFolder}
                  selectedTag={selectedTag}
                  selectedNote={selectedNote}
                  notes={notes}
                  folders={folders}
                  onNoteSelect={handleNoteSelect}
                  onCreateNote={handleCreateNote}
                  onDeleteNote={handleDeleteNote}
                  onUpdateNote={handleUpdateNote}
                  onMoveNote={handleMoveNote}
                  onToggleBookmark={handleToggleBookmark}
                  onReorderNotes={handleReorderNotes}
                  onDeleteAllNotes={handleDeleteAllNotes}
                  onToggleCollapse={toggleSidebarCollapse}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              </div>
              
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
                <div className="flex-1 min-w-0 h-full overflow-hidden">
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
                    hideNetPnlSection={!useRange && !useDaily}
                    // Template creation props moved to editor menu
                    onCreateNote={handleCreateNote}
                    onCreateNoteFromTemplate={handleCreateNoteFromTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    templates={templates}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                  />
                </div>
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
    </motion.div>
  )
}